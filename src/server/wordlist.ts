import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "#/db";
import { type EntryWithSenses, entries } from "#/db/schema";
import {
	findConjugation,
	findDeclension,
	MAX_LIST_RESULTS,
	parseLetters,
	parseWordListSearch,
} from "#/utils/wordlist/rules";

export type WordList = {
	entries: Array<EntryWithSenses>;
	/** True when there were more matches than MAX_LIST_RESULTS. */
	truncated: boolean;
};

export const listEntries = createServerFn({ method: "GET" })
	.validator(parseWordListSearch)
	.handler(async ({ data }): Promise<WordList> => {
		const conditions = [];

		if (data.pos) conditions.push(eq(entries.partOfSpeech, data.pos));
		const declension = findDeclension(data.pos, data.decl);
		if (declension) conditions.push(eq(entries.declension, declension.value));

		const conjugation = findConjugation(data.conj);
		if (conjugation) {
			conditions.push(eq(entries.conjugation, conjugation.value));
		}

		if (data.letters) {
			const parsed = parseLetters(data.letters);
			// The validator only lets a parseable filter through, so this is
			// always ok — but narrowing is cheaper than asserting.
			if (parsed.ok) {
				// lemma_plain is lower-case a–z with the macrons stripped, so its
				// first character is exactly the letter the filter speaks of.
				conditions.push(
					inArray(sql`substr(${entries.lemmaPlain}, 1, 1)`, parsed.letters),
				);
			}
		}

		const rows = await db.query.entries.findMany({
			where: and(...conditions),
			// lemma breaks the tie between malum and mālum, which share lemma_plain.
			orderBy: [entries.lemmaPlain, entries.lemma],
			with: { senses: { orderBy: (s, { asc }) => [asc(s.rank)] } },
			// One over the cap, only to learn whether there is more.
			limit: MAX_LIST_RESULTS + 1,
		});

		return {
			entries: rows.slice(0, MAX_LIST_RESULTS),
			truncated: rows.length > MAX_LIST_RESULTS,
		};
	});
