import { createServerFn } from "@tanstack/react-start";
import { and, eq, ne } from "drizzle-orm";

import { db } from "#/db";
import { homographCount } from "#/db/homographs";
import { entries, senses } from "#/db/schema";
import { authMiddleware } from "#/server/auth";
import {
	closeGaps,
	place,
	refuseDuplicate,
	siblingsOf,
	type Tx,
	toFiledWord,
} from "#/server/filing";
import type { FilingResult, LookupResult } from "#/utils/entries/form";
import { isPartOfSpeech, parseEntryDraft } from "#/utils/entries/rules";
import {
	AlreadyFiled,
	suggestFromWiktionary,
} from "#/utils/entries/wiktionary";
import { normalizeLemma } from "#/utils/search/rules";

/** The editor's say-so that a word joining a lemma already on file is a new one. */
function confirmsHomograph(input: unknown) {
	return (
		typeof input === "object" &&
		input !== null &&
		(input as Record<string, unknown>).homograph === true
	);
}

/** The word as just filed, numbered among the others spelled the same. */
function filed(tx: Tx, id: number, lemma: string): FilingResult {
	const row = siblingsOf(tx, lemma).find((s) => s.id === id);
	if (!row) {
		throw new Error(`Could not write “${lemma}”.`);
	}
	return { kind: "filed", entry: toFiledWord(row) };
}

/**
 * Files one new word.
 *
 * .validator is the gate. It is the same function the form runs before it
 * submits, and running it again here is not belt and braces: the form is one
 * caller of an RPC that anyone holding an admin session can reach directly.
 */
export const createEntry = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input: unknown) => ({
		draft: parseEntryDraft(input),
		homograph: confirmsHomograph(input),
	}))
	.handler(async ({ data: { draft, homograph } }) => {
		const { senses: drafted, ...columns } = draft;

		// One transaction, because an entry with no senses is not an entry
		return db.transaction((tx): FilingResult => {
			// UNIQUE on (lemma, homonym) is what actually stops a collision. Asking
			// first is so the answer is a sentence, or a question for the editor.
			const placement = place(tx, columns, homograph);
			if (placement.kind === "unconfirmed") {
				return placement;
			}

			const [created] = tx
				.insert(entries)
				.values({ ...columns, homonym: placement.homonym })
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

			return filed(tx, created.id, columns.lemma);
		});
	});

/**
 * The same word, filed again.
 *
 * The id travels beside the draft rather than inside it, because the lemma is
 * one of the things an edit is allowed to change — so it cannot be what says
 * which row is being changed. parseEntryDraft is the gate here exactly as it is
 * on createEntry; it ignores the id, and this validator is what refuses one
 * that is not a row number.
 */
export const updateEntry = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input: unknown) => {
		const raw = (
			typeof input === "object" && input !== null ? input : {}
		) as Record<string, unknown>;

		const id = raw.id;

		// Not an EntryValidationError: no field on screen is wrong, so there is no
		// input to hang the message on. A bad id is a bad request.
		if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
			throw new Error("That edit does not say which entry it belongs to.");
		}

		return {
			id,
			draft: parseEntryDraft(raw),
			homograph: confirmsHomograph(raw),
		};
	})
	.handler(async ({ data: { id, draft, homograph } }) => {
		const { senses: drafted, ...columns } = draft;

		return db.transaction((tx): FilingResult => {
			// The row may have been deleted since the form read it. Asking is what
			// turns "0 rows updated" into a sentence.
			const existing = tx
				.select({ lemma: entries.lemma, homonym: entries.homonym })
				.from(entries)
				.where(eq(entries.id, id))
				.get();

			if (!existing) {
				throw new Error("That entry is no longer in the dictionary.");
			}

			const renamed = columns.lemma !== existing.lemma;
			let homonym = existing.homonym;

			if (renamed) {
				// Joining another lemma is filing under it: the same rules as a create.
				const placement = place(tx, columns, homograph, id);
				if (placement.kind === "unconfirmed") {
					return placement;
				}
				homonym = placement.homonym;
			} else {
				// Staying put, only a change of grammar can make it a sibling's twin.
				refuseDuplicate(siblingsOf(tx, columns.lemma, id), columns);
			}

			tx.update(entries)
				.set({ ...columns, homonym })
				.where(eq(entries.id, id))
				.run();

			// cum¹ renamed away leaves cum² to become the bare /verbum/cum.
			if (renamed) {
				closeGaps(tx, existing.lemma);
			}

			// Replaced, never merged: position is the rank, so a merge would have to
			// decide which existing row each edited row "is", and it cannot — the
			// editor may have reordered them, cut one from the middle, or rewritten
			// a meaning outright. Deleting first also means the ranks that come back
			// run 1..n by construction, the way they do for a create.
			//
			// Every column of a sense rides along in the draft, examples included,
			// so a replacement loses nothing the editor did not delete on screen.
			tx.delete(senses).where(eq(senses.entryId, id)).run();

			tx.insert(senses)
				.values(
					drafted.map((sense, i) => ({
						...sense,
						entryId: id,
						rank: i + 1,
					})),
				)
				.run();

			return filed(tx, id, columns.lemma);
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

		// The entry being edited, which may look itself up again.
		const editing =
			typeof raw.editing === "number" && Number.isInteger(raw.editing)
				? raw.editing
				: undefined;

		return {
			lemma,
			partOfSpeech: isPartOfSpeech(partOfSpeech) ? partOfSpeech : undefined,
			editing,
		};
	})
	.handler(async ({ data: { editing, ...spec } }): Promise<LookupResult> => {
		// Everything filed under this spelling, macrons or not: Wiktionary skips
		// these, so what comes back is a word still to file. The row being edited
		// is left out, so it can find its own section again.
		const key = eq(entries.lemmaPlain, normalizeLemma(spec.lemma));
		const onFile = db
			.select({
				id: entries.id,
				lemma: entries.lemma,
				homonym: entries.homonym,
				partOfSpeech: entries.partOfSpeech,
				conjugation: entries.conjugation,
				declension: entries.declension,
				gender: entries.gender,
				homographs: homographCount(entries),
			})
			.from(entries)
			.where(editing === undefined ? key : and(key, ne(entries.id, editing)))
			.orderBy(entries.lemma, entries.homonym)
			.all();

		try {
			const suggestion = await suggestFromWiktionary({
				...spec,
				taken: onFile,
			});
			return {
				kind: "suggested",
				suggestion,
				homographOf: onFile
					.filter((e) => e.lemma === suggestion.draft.lemma)
					.map(toFiledWord),
			};
		} catch (err) {
			if (err instanceof AlreadyFiled) {
				return { kind: "exists", entries: onFile.map(toFiledWord) };
			}
			// Wiktionary failing says nothing new about a spelling already on file.
			const same = onFile.filter((e) => e.lemma === spec.lemma);
			if (same.length > 0) {
				return { kind: "exists", entries: same.map(toFiledWord) };
			}
			throw err;
		}
	});
