/**
 * "Did you mean …?" for a search that found nothing. Pure functions, measured
 * on folded spellings throughout, so the server can rank lemmas without SQL.
 */

import { fold, type SearchKey } from "#/utils/search/key";

/** Below this a query is one edit from too many short words to be worth guessing. */
export const MIN_SUGGESTION_LENGTH = 4;

/** From here on a second typo is likely and rarely lands on the wrong word. */
export const TWO_EDIT_LENGTH = 8;

export const MAX_SUGGESTIONS = 5;

export type Candidate = { lemma: string };

/** How far from the key a suggestion may be: 0 means do not suggest. */
export function maxEditsFor(key: SearchKey) {
	if (key.folded.length < MIN_SUGGESTION_LENGTH) return 0;
	if (key.folded.length < TWO_EDIT_LENGTH) return 1;
	return 2;
}

/**
 * Optimal string alignment distance: Levenshtein plus a swap of two neighbouring
 * letters as one edit, so "amcius" is 1 from "amicus". Gives up past `max` and
 * returns max + 1, since only "close enough or not" matters here.
 */
export function editDistance(a: string, b: string, max: number) {
	if (Math.abs(a.length - b.length) > max) return max + 1;

	let beforePrevious: Array<number> = [];
	let previous = Array.from({ length: b.length + 1 }, (_, j) => j);

	for (let i = 1; i <= a.length; i++) {
		const current = [i];
		let rowMin = i;
		for (let j = 1; j <= b.length; j++) {
			const substitution = a[i - 1] === b[j - 1] ? 0 : 1;
			let distance = Math.min(
				previous[j] + 1,
				current[j - 1] + 1,
				previous[j - 1] + substitution,
			);
			if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
				distance = Math.min(distance, beforePrevious[j - 2] + 1);
			}
			current[j] = distance;
			rowMin = Math.min(rowMin, distance);
		}
		// A row's minimum never shrinks further down, so this row decides it.
		if (rowMin > max) return max + 1;
		beforePrevious = previous;
		previous = current;
	}

	return Math.min(previous[b.length], max + 1);
}

/** A link to search for, and for a form the word it belongs to: salūtāvissent (salūtō). */
export type Suggestion = { text: string; of?: string };

/** A suggestion with the key it was measured on and its distance from the query. */
export type Scored = Suggestion & { key: string; distance: number };

/** Every lemma within the key's budget, scored. */
export function scoreLemmas(key: SearchKey, candidates: Array<Candidate>) {
	const max = maxEditsFor(key);
	if (max === 0) return [];
	return candidates.flatMap((c): Array<Scored> => {
		const folded = fold(c.lemma);
		const distance = editDistance(key.folded, folded, max);
		return distance === 0 || distance > max
			? []
			: [{ text: c.lemma, key: folded, distance }];
	});
}

/**
 * The suggestions nearest the key, lemmas and forms in one list, only from the
 * closest distance found: two edits are offered only when nothing is one edit
 * away. Same first letter first (people rarely mistype it), then alphabetical;
 * a search appears once per word.
 */
export function nearestSuggestions(
	key: SearchKey,
	scored: Array<Scored>,
): Array<Suggestion> {
	const closest = Math.min(...scored.map((s) => s.distance));
	const opensLikeKey = (s: Scored) => (s.key[0] === key.folded[0] ? 0 : 1);
	const nearest = scored
		.filter((s) => s.distance === closest)
		.sort(
			(a, b) =>
				opensLikeKey(a) - opensLikeKey(b) ||
				a.key.localeCompare(b.key) ||
				a.text.localeCompare(b.text),
		);
	const seen = new Set<string>();
	return (
		nearest
			// A form spelled like its own lemma is the lemma suggestion: amō, not amō (amō).
			.map((s) => (s.of === s.text ? { ...s, of: undefined } : s))
			// rēgis and rēgīs are one link, since the search is the same.
			.filter(({ text, of }) => {
				const id = `${fold(text)}|${of ?? ""}`;
				if (seen.has(id)) return false;
				seen.add(id);
				return true;
			})
			.slice(0, MAX_SUGGESTIONS)
			.map(({ text, of }) => (of ? { text, of } : { text }))
	);
}
