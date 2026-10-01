/**
 * The rules a proverb has to satisfy, in one place — the same role
 * src/utils/entries/rules.ts plays for entries.
 */

/**
 * The `author` of a saying nobody wrote: Fēstīnā lentē, Errāre hūmānum est.
 *
 * A value, not NULL, for the reason `indeclinable` is one in `declension`: NULL
 * cannot tell "no author to name" from "nobody filled this in", and only the
 * second is a gap. So the column is NOT NULL and this is the answer to give.
 * Lowercase like the rest of the stored vocabularies; the UI capitalizes.
 */
export const ANONYMOUS = "anonymous";
