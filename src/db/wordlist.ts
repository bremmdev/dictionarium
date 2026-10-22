import { and, eq, inArray, notInArray, or, sql } from "drizzle-orm";

import { db } from "#/db";
import { homographCount } from "#/db/homographs";
import { difficultWords, entries, type ShownEntry } from "#/db/schema";
import { withFrequency } from "#/server/frequency";
import {
	findConjugation,
	findDeclension,
	MAX_LIST_RESULTS,
	NAMED_PARTS_OF_SPEECH,
	parseLetters,
	selectedCases,
	type WordListSearch,
} from "#/utils/wordlist/rules";

export type WordList = {
	entries: Array<ShownEntry>;
	/** True when there were more matches than MAX_LIST_RESULTS. */
	truncated: boolean;
};

/**
 * The word list query, behind both list RPCs. `onlyDifficult` is the caller's
 * to decide, never the search's: only the guarded RPC passes true.
 */
export async function findWordList(
	data: WordListSearch,
	onlyDifficult: boolean,
): Promise<WordList> {
	const conditions = [];

	if (onlyDifficult) {
		conditions.push(
			inArray(
				entries.id,
				db.select({ id: difficultWords.entryId }).from(difficultWords),
			),
		);
	}

	if (data.pos === "other") {
		conditions.push(
			notInArray(entries.partOfSpeech, [...NAMED_PARTS_OF_SPEECH]),
		);
	} else if (data.pos) {
		conditions.push(eq(entries.partOfSpeech, data.pos));
	}
	const declension = findDeclension(data.pos, data.decl);
	if (declension) conditions.push(eq(entries.declension, declension.value));

	const conjugation = findConjugation(data.conj);
	if (conjugation) {
		conditions.push(eq(entries.conjugation, conjugation.value));
	}

	// A preposition is listed under every case it takes, and several cases
	// mean any of them — so in, "accusative,ablative", is found by either.
	// governs is one canonical comma-joined list, which makes a case a whole
	// comma-delimited token in it: padding both ends with commas turns that
	// into one LIKE per case, anchored so no case can match inside another.
	// The cases come from the validator's vocabulary, never from the URL as
	// typed, so nothing but a case name reaches the pattern.
	const cases = selectedCases(data.cases);
	if (cases.length > 0) {
		conditions.push(
			or(
				...cases.map(
					(c) => sql`(',' || ${entries.governs} || ',') like ${`%,${c},%`}`,
				),
			),
		);
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
		// lemma breaks the tie between malum and mālum, which share lemma_plain;
		// homonym the one between cum¹ and cum², which share lemma too.
		orderBy: [entries.lemmaPlain, entries.lemma, entries.homonym],
		with: { senses: { orderBy: (s, { asc }) => [asc(s.rank)] } },
		extras: { homographs: homographCount(entries).as("homographs") },
		// One over the cap, only to learn whether there is more.
		limit: MAX_LIST_RESULTS + 1,
	});

	return {
		entries: rows.slice(0, MAX_LIST_RESULTS).map(withFrequency),
		truncated: rows.length > MAX_LIST_RESULTS,
	};
}
