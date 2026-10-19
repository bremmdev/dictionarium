/**
 * When two entries spelled alike are one word filed twice, and when they are
 * homographs: cum the preposition and cum the conjunction, legō 1st conj. and
 * legō 3rd. See vault/editor.md, "Words spelled alike".
 */
import type { EntryRef } from "#/utils/entries/links";

/** What tells two words spelled `lemma` apart. Principal parts do not: hand-edited text drifts. */
export type Identity = {
	lemma: string;
	partOfSpeech: string;
	conjugation: string | null;
	declension: string | null;
	gender: string | null;
};

/** A filed word as the desk names it: enough to link to it, label it, and edit it. */
export type FiledWord = EntryRef & { partOfSpeech: string; homographs: number };

const GRAMMAR = [
	"partOfSpeech",
	"conjugation",
	"declension",
	"gender",
] as const;

/** A blank is unknown rather than different: a fill that could not read the declension still matches. */
export function sameWord(a: Identity, b: Identity) {
	return (
		a.lemma === b.lemma &&
		GRAMMAR.every((key) => !a[key] || !b[key] || a[key] === b[key])
	);
}
