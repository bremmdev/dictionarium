/**
 * Where a word goes under its lemma: homonym 1 if the spelling is new, the next
 * number if it is a homograph of words already filed, and nowhere if it is one
 * of them again. Plain functions over a transaction, so createEntry and
 * updateEntry share them. See vault/editor.md, "Words spelled alike".
 */
import { and, asc, eq, ne } from "drizzle-orm";

import type { db } from "#/db";
import { homographCount } from "#/db/homographs";
import { entries } from "#/db/schema";
import {
	type FiledWord,
	type Identity,
	sameWord,
} from "#/utils/entries/homographs";
import { homonymLabel } from "#/utils/entries/links";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type Placement =
	| { kind: "placed"; homonym: number }
	/** The lemma is taken by other words, and the editor has not said this is a new one. */
	| { kind: "unconfirmed"; siblings: Array<FiledWord> };

/** The words filed under `lemma`, in homonym order, leaving out the row being edited. */
export function siblingsOf(tx: Tx, lemma: string, except?: number) {
	return tx
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
		.where(
			except === undefined
				? eq(entries.lemma, lemma)
				: and(eq(entries.lemma, lemma), ne(entries.id, except)),
		)
		.orderBy(asc(entries.homonym))
		.all();
}

export function toFiledWord(row: FiledWord): FiledWord {
	const { id, lemma, homonym, partOfSpeech, homographs } = row;
	return { id, lemma, homonym, partOfSpeech, homographs };
}

/** Refuses a word that is already filed: same spelling, same grammar. */
export function refuseDuplicate(
	siblings: Array<FiledWord & Identity>,
	word: Identity,
) {
	const twin = siblings.find((s) => sameWord(s, word));
	if (twin) {
		throw new Error(
			`${homonymLabel(twin)} is already filed as this ${twin.partOfSpeech}. Words spelled alike have to differ in part of speech, conjugation, declension or gender.`,
		);
	}
}

/**
 * The homonym a word takes under a lemma it is joining. `homograph` is the
 * editor's say-so that it is a different word: without it a second capiō with
 * a mistyped conjugation would quietly become capiō².
 */
export function place(
	tx: Tx,
	word: Identity,
	homograph: boolean,
	except?: number,
): Placement {
	const siblings = siblingsOf(tx, word.lemma, except);
	refuseDuplicate(siblings, word);

	if (siblings.length === 0) {
		return { kind: "placed", homonym: 1 };
	}
	if (!homograph) {
		return { kind: "unconfirmed", siblings: siblings.map(toFiledWord) };
	}
	return {
		kind: "placed",
		homonym: Math.max(...siblings.map((s) => s.homonym)) + 1,
	};
}

/**
 * Renumbers a lemma's words 1..n after one has left it, so cum² becomes cum¹
 * and /verbum/cum still points at a word. One row at a time, lowest first:
 * each moves into a number the row before it has just vacated.
 */
export function closeGaps(tx: Tx, lemma: string) {
	siblingsOf(tx, lemma).forEach((row, i) => {
		if (row.homonym !== i + 1) {
			tx.update(entries)
				.set({ homonym: i + 1 })
				.where(eq(entries.id, row.id))
				.run();
		}
	});
}
