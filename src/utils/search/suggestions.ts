/**
 * "Did you mean …?" for a search that found nothing. Pure functions over search
 * keys (normalizeLemma output), so the server can rank lemmas without SQL.
 */

/** Below this a query is one edit from too many short words to be worth guessing. */
export const MIN_SUGGESTION_LENGTH = 4;

/** From here on a second typo is likely and rarely lands on the wrong word. */
export const TWO_EDIT_LENGTH = 8;

export const MAX_SUGGESTIONS = 5;

export type Candidate = { lemma: string; lemmaPlain: string };

/** How far from the key a suggestion may be: 0 means do not suggest. */
export function maxEditsFor(key: string) {
	if (key.length < MIN_SUGGESTION_LENGTH) return 0;
	if (key.length < TWO_EDIT_LENGTH) return 1;
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

/**
 * The lemmas nearest the key, only from the closest distance found: two edits
 * are offered only when nothing is one edit away. Same first letter first
 * (people rarely mistype it), then alphabetical; homographs appear once.
 */
export function suggestLemmas(key: string, candidates: Array<Candidate>) {
	const max = maxEditsFor(key);
	if (max === 0) return [];

	let closest = max + 1;
	let nearest: Array<Candidate> = [];
	for (const candidate of candidates) {
		const distance = editDistance(key, candidate.lemmaPlain, max);
		if (distance === 0 || distance > max || distance > closest) continue;
		if (distance < closest) {
			closest = distance;
			nearest = [];
		}
		nearest.push(candidate);
	}

	const opensLikeKey = (c: Candidate) => (c.lemmaPlain[0] === key[0] ? 0 : 1);
	nearest.sort(
		(a, b) =>
			opensLikeKey(a) - opensLikeKey(b) ||
			a.lemmaPlain.localeCompare(b.lemmaPlain) ||
			a.lemma.localeCompare(b.lemma),
	);

	return [...new Set(nearest.map((c) => c.lemma))].slice(0, MAX_SUGGESTIONS);
}
