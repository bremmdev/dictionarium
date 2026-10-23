import "@tanstack/react-start/server-only";

import lasla from "../../data/lasla-frequency.json";
import type { ShownEntry } from "#/db/schema";
import {
	type LaslaRow,
	type Lexeme,
	laslaKey,
	frequencyOf,
	matchLexeme,
	toLexeme,
} from "#/utils/entries/frequency";

/**
 * Looked up on every read rather than stored, so a new or edited entry is right
 * at once and nothing needs migrating. Server-only: the file is ~650 kB.
 */
const byLemma = new Map<string, Array<Lexeme>>();
for (const row of lasla.lexemes as Array<LaslaRow>) {
	const lexeme = toLexeme(row);
	byLemma.set(lexeme.lemma, [...(byLemma.get(lexeme.lemma) ?? []), lexeme]);
}

/** LASLA's words spelled like this lemma, for the matching to choose from. */
export function laslaCandidates(lemma: string): ReadonlyArray<Lexeme> {
	return byLemma.get(laslaKey(lemma)) ?? [];
}

export function withFrequency<T extends Omit<ShownEntry, "frequency">>(
	entry: T,
): T & Pick<ShownEntry, "frequency"> {
	const candidates = laslaCandidates(entry.lemma);
	return { ...entry, frequency: frequencyOf(matchLexeme(entry, candidates)) };
}
