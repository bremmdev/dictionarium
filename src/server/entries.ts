import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

import { db } from "#/db";
import { entries, senses } from "#/db/schema";
import { authMiddleware } from "#/server/auth";
import { isPartOfSpeech, parseEntryDraft } from "#/utils/entries/rules";
import { suggestFromWiktionary } from "#/utils/entries/wiktionary";

/**
 * What `npx tsx scripts/seed.ts` used to be, as one word at a time.
 *
 * .validator is the gate. It is the same function the form runs before it
 * submits, and running it again here is not belt and braces: the form is one
 * caller of an RPC that anyone holding an admin session can reach directly.
 */
export const createEntry = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(parseEntryDraft)
	.handler(async ({ data }) => {
		const { senses: drafted, ...columns } = data;

		// One transaction, because an entry with no senses is not an entry
		return db.transaction((tx) => {
			// UNIQUE on lemma is what actually stops the duplicate. Asking first is
			// only so the answer is a sentence instead of a constraint name.
			const existing = tx
				.select({ lemma: entries.lemma })
				.from(entries)
				.where(eq(entries.lemma, columns.lemma))
				.get();

			if (existing) {
				throw new Error(`“${columns.lemma}” is already in the dictionary.`);
			}

			const [created] = tx
				.insert(entries)
				.values(columns)
				.returning({ id: entries.id })
				.all();

			if (!created) {
				throw new Error(`Could not write “${columns.lemma}”.`);
			}

			tx.insert(senses)
				.values(
					// Position is the rank
					drafted.map((sense, i) => ({
						...sense,
						entryId: created.id,
						rank: i + 1,
					})),
				)
				.run();

			return { lemma: columns.lemma };
		});
	});

/**
 * The research assistant scripts/enrich-entries.ts uses, reachable from the
 * form: a lemma in, a filled draft out. It writes nothing — the editor reads
 * what came back and presses Adde, or does not.
 *
 * Server-side because it has to be. The browser cannot call Wiktionary's API
 * directly (no CORS), and the throttle that keeps us welcome there only means
 * something if the requests all leave from one place.
 */
export const suggestEntry = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input: unknown) => {
		const raw = (
			typeof input === "object" && input !== null ? input : {}
		) as Record<string, unknown>;

		const lemma =
			typeof raw.lemma === "string" ? raw.lemma.trim().normalize("NFC") : "";

		const partOfSpeech =
			typeof raw.partOfSpeech === "string" ? raw.partOfSpeech : "";

		if (lemma === "") {
			throw new Error("Type a lemma to look up.");
		}
		// A Wiktionary title is a word. This is only here so that what gets built
		// into the API URL cannot be an essay.
		if (lemma.length > 60) {
			throw new Error("That is too long to be a lemma.");
		}

		return {
			lemma,
			partOfSpeech: isPartOfSpeech(partOfSpeech) ? partOfSpeech : undefined,
		};
	})
	.handler(({ data }) => suggestFromWiktionary(data));
