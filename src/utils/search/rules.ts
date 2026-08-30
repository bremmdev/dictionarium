/**
 * Normalizing lemmas "vīlla" -> "villa". Decomposing to NFD turns a macron into its own combining
 * mark, so dropping every mark strips it without touching the base letter. This
 * has to match how lemma_plain was written by the seed script, or lookups
 * silently miss.
 */
export function normalizeLemma(value: string) {
	return (
		value
			.normalize("NFD")
			.replace(/\p{M}/gu, "")
			.normalize("NFC")
			// Case-fold before filtering: [^a-z ] would delete an uppercase letter, not lower it.
			.toLowerCase()
			.replace(/[^a-z ]/g, "")
	); // Remove non-letters and spaces as '%' and '_' have special meaning in LIKE queries
}

/** Below this we don't bother the database — a single letter matches half the dictionary. */
export const MIN_QUERY_LENGTH = 2;

export const MAX_RESULTS = 10;
