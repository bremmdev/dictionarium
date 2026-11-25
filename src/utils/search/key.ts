import { MIN_QUERY_LENGTH, normalizeLemma } from "#/utils/search/rules";

/** normalizeLemma with æ and œ spelled out, which it alone would delete: caelum, not clum. */
function spelledOut(value: string) {
	return normalizeLemma(value.replace(/æ/gi, "ae").replace(/œ/gi, "oe"));
}

/**
 * The spelling words are matched on: also v → u and j → i, as texts print uideo
 * and iam. Queries, forms and LASLA all meet here; lemma_plain keeps its v.
 */
export function fold(value: string) {
	return spelledOut(value).replace(/[vj]/g, (letter) =>
		letter === "v" ? "u" : "i",
	);
}

/** A typed query, keyed once. Every search step takes this, never the raw string. */
export type SearchKey = {
	/** As recorded: uilla and villa stay two searches. */
	plain: string;
	/** What every step matches and measures on. */
	folded: string;
};

/** Null when too short to run, measured on the key: a% is one letter. */
export function searchKey(q: string): SearchKey | null {
	const plain = spelledOut(q.trim());
	if (plain.length < MIN_QUERY_LENGTH) return null;
	return { plain, folded: fold(plain) };
}
