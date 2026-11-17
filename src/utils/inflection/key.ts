import { normalizeLemma } from "#/utils/search/rules";

/**
 * The key forms are matched on: normalizeLemma's, with æ and œ spelled out
 * (normalizeLemma alone deletes them) and v → u, j → i, as texts print uideo
 * and iam. For form matching only; lemma_plain keeps its v.
 */
export function formKey(value: string) {
	return normalizeLemma(
		value.replace(/æ/gi, "ae").replace(/œ/gi, "oe"),
	).replace(/[vj]/g, (letter) => (letter === "v" ? "u" : "i"));
}
