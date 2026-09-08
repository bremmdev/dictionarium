import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

import { db } from "#/db";
import { entries, senses } from "#/db/schema";
import { authMiddleware } from "#/server/auth";
import { parseEntryDraft } from "#/utils/entries/rules";

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
