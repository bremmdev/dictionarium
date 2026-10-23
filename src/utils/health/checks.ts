/**
 * The data checks, as pure functions over rows. `npm run check` prints what
 * they return, and /admin/health shows it. See vault/health.md.
 */
import type { Entry, EntryWithSenses } from "#/db/schema";
import type { EntryRef } from "#/utils/entries/links";
import {
	CONJUGATIONS,
	DECLENSIONS,
	declensionsFor,
	formatCases,
	GOVERNED_CASES,
	hasGoverns,
	hasPrincipalParts,
	hasTerminations,
	INFLECTS,
	isConjugation,
	isDeclension,
	isDeclensionFor,
	isPartOfSpeech,
	isTerminations,
	readCases,
	senseGoverns,
	TERMINATIONS,
	theCases,
} from "#/utils/entries/rules";
import { normalizeLemma } from "#/utils/search/rules";

/** One objection. `where` names the row the way the scripts print it: "in (preposition) sense 2". */
export type Problem = { entry: EntryRef; where: string; message: string };

function problem(entry: EntryRef, where: string, message: string): Problem {
	return {
		entry: { id: entry.id, lemma: entry.lemma, homonym: entry.homonym },
		where,
		message,
	};
}

/**
 * lemma_plain is derived from lemma, so it must equal normalizeLemma(lemma)
 * for every row.
 */
export function checkLemmas(rows: ReadonlyArray<Entry>) {
	return rows
		.filter((r) => normalizeLemma(r.lemma) !== r.lemmaPlain)
		.map((r) =>
			problem(
				r,
				r.lemma,
				`lemma_plain is "${r.lemmaPlain}", should be "${normalizeLemma(r.lemma)}"`,
			),
		);
}

/**
 * UNIQUE (lemma, homonym) stops two cum²s and says nothing about gaps. The
 * homonyms of a lemma run 1..n, because the bare /verbum/cum is homonym 1 and
 * a lone cum² would leave that URL pointing at nothing.
 */
export function checkHomonyms(rows: ReadonlyArray<Entry>) {
	const byLemma = new Map<string, Array<Entry>>();
	for (const r of rows) {
		byLemma.set(r.lemma, [...(byLemma.get(r.lemma) ?? []), r]);
	}

	const problems: Array<Problem> = [];

	for (const [lemma, filed] of byLemma) {
		const sorted = [...filed].sort((a, b) => a.homonym - b.homonym);
		const homonyms = sorted.map((r) => r.homonym);
		const expected = sorted.map((_, i) => i + 1);

		if (homonyms.join(",") !== expected.join(",")) {
			problems.push(
				problem(
					sorted[0],
					lemma,
					`homonyms are [${homonyms.join(", ")}] — must run 1..${sorted.length} with no gaps`,
				),
			);
		}
	}

	return problems;
}

/**
 * UNIQUE (entry_id, rank) stops two sense number 2s and says nothing about
 * the two invariants vault/schema.md actually relies on:
 *
 *   - every entry has at least one sense — a word with no meaning is not an entry;
 *   - ranks run 1..n with no gaps, because rank 1 *is* the headline meaning
 *     and the UI reads `senses[0]` on the strength of that promise.
 */
export function checkSenses(rows: ReadonlyArray<EntryWithSenses>) {
	const problems: Array<Problem> = [];

	for (const entry of rows) {
		if (entry.senses.length === 0) {
			problems.push(
				problem(
					entry,
					entry.lemma,
					"no senses — a word with no meaning is not an entry",
				),
			);
			continue;
		}

		// Rows come back in insertion order, so sort before reading the sequence.
		const ranks = entry.senses.map((s) => s.rank).sort((a, b) => a - b);
		const expected = ranks.map((_, i) => i + 1);

		if (ranks.join(",") !== expected.join(",")) {
			problems.push(
				problem(
					entry,
					entry.lemma,
					`ranks are [${ranks.join(", ")}] — must run 1..${ranks.length} with no gaps`,
				),
			);
		}

		// notNull permits the empty string, which is the same absent meaning wearing a different hat.
		for (const s of entry.senses) {
			if (s.meaningEn.trim() === "") {
				problems.push(
					problem(entry, entry.lemma, `sense ${s.rank} has a blank meaning_en`),
				);
			}
		}
	}

	return problems;
}

/** What is missing, in the word's own terms. Keyed by what hasPrincipalParts admits. */
const FILING: Record<"noun" | "verb" | "adjective", string> = {
	verb: "a verb is filed by its four principal parts",
	noun: "a noun is filed with its genitive",
	adjective: "an adjective is filed with its other terminations",
};

/**
 * The invariant vault/schema.md creates but nothing in the schema enforces:
 * NULL in `declension` / `conjugation` means exactly one thing — the question
 * does not apply to this part of speech. A word that inflects has to say
 * *how*, with a number or with the word `indeclinable`, because a forgotten
 * field is otherwise indistinguishable from a deliberate one.
 *
 * The vocabulary itself lives in src/utils/entries/rules.ts, because the admin
 * form has to hold the same rule at the point of entry. This catches the rows
 * written before it existed, and anything written around it.
 */
export function checkInflection(rows: ReadonlyArray<Entry>) {
	const problems: Array<Problem> = [];

	for (const r of rows) {
		const where = `${r.lemma} (${r.partOfSpeech})`;
		const push = (message: string) => problems.push(problem(r, where, message));

		// A part of speech the map has never heard of is itself a finding: nobody
		// has decided whether it inflects, so neither column can be read either way.
		if (!isPartOfSpeech(r.partOfSpeech)) {
			push(
				"unknown part_of_speech — add it to INFLECTS in src/utils/entries/rules.ts and say whether it inflects",
			);
			continue;
		}

		const asks = INFLECTS[r.partOfSpeech];

		// The question that applies must be answered, and answered in the vocabulary.
		if (asks === "declension") {
			if (r.declension === null) {
				push(
					`declension is NULL — this word inflects, so say how (${declensionsFor(r.partOfSpeech).join(" | ")})`,
				);
			} else if (!isDeclension(r.declension)) {
				push(
					`declension is "${r.declension}", not one of ${DECLENSIONS.join(" | ")}`,
				);
			} else if (!isDeclensionFor(r.partOfSpeech, r.declension)) {
				push(
					`declension is "${r.declension}", which a ${r.partOfSpeech} does not file under (${declensionsFor(r.partOfSpeech).join(" | ")})`,
				);
			}
		}

		if (asks === "conjugation") {
			if (r.conjugation === null) {
				push(
					`conjugation is NULL — this word inflects, so say how (${CONJUGATIONS.join(" | ")})`,
				);
			} else if (!isConjugation(r.conjugation)) {
				push(
					`conjugation is "${r.conjugation}", not one of ${CONJUGATIONS.join(" | ")}`,
				);
			}
		}

		// The question that does not apply must stay NULL, or NULL stops meaning one thing.
		if (asks !== "declension" && r.declension !== null) {
			push(
				`declension is "${r.declension}" — this part of speech does not decline, so it must be NULL`,
			);
		}

		if (asks !== "conjugation" && r.conjugation !== null) {
			push(
				`conjugation is "${r.conjugation}" — this part of speech does not conjugate, so it must be NULL`,
			);
		}

		// The same two rules again, one question further down: a 3rd-declension
		// adjective has to say how many terminations it files with, and nothing else
		// may carry the answer. Counting the forms in principal_parts cannot stand in
		// for it — "fortis, forte" and "vetus, veteris" are both two.
		if (hasTerminations(r.partOfSpeech, r.declension ?? "")) {
			if (r.terminations === null) {
				push(
					`terminations is NULL — a 3rd-declension adjective files with one, two or three (${TERMINATIONS.join(" | ")})`,
				);
			} else if (!isTerminations(r.terminations)) {
				push(
					`terminations is "${r.terminations}", not one of ${TERMINATIONS.join(" | ")}`,
				);
			}
		} else if (r.terminations !== null) {
			push(
				`terminations is "${r.terminations}" — only a 3rd-declension adjective is asked, so it must be NULL`,
			);
		}

		// And the filing itself, which the same NULL rule governs: an adjective that
		// declines prints its other terminations, and one that never changes shape
		// has nothing to print.
		if (hasPrincipalParts(r.partOfSpeech, r.declension ?? "")) {
			if (r.principalParts === null) {
				push(`principal_parts is NULL — ${FILING[r.partOfSpeech]}`);
			}
		} else if (r.principalParts !== null) {
			push(
				`principal_parts is "${r.principalParts}" — the lemma is the whole filing for this word, so it must be NULL`,
			);
		}
	}

	return problems;
}

/** Names what is wrong with how a stored value is spelled, or null if nothing is. */
function misspelt(value: string) {
	const { cases, unknown } = readCases(value);

	if (unknown.length > 0) {
		return `"${value}" holds "${unknown[0]}", which is not one of ${GOVERNED_CASES.join(" | ")}`;
	}
	if (formatCases(cases) !== value) {
		return `"${value}" should be spelled "${formatCases(cases)}" — grammar order, comma-joined, no spaces`;
	}
	return null;
}

/**
 * The case a word governs, held to the rules vault/schema.md gives it — on the
 * entry for a preposition, on the sense for anything whose meanings differ.
 *
 *   - a preposition must say which case it takes, and nothing else may say it
 *     on the entry;
 *   - a preposition with more than one case must say on every sense which one
 *     that meaning takes, from its own list, and every case on its list needs a
 *     sense to show for it;
 *   - a sense that is not asked (a noun's, or one of ad's) leaves it NULL;
 *   - every value is spelled the one way formatCases spells it.
 *
 * What it cannot catch, by design: a verb that should have been marked with a
 * dative and was not. For a verb NULL is the ordinary answer — no marked case —
 * the way an empty usage label is, so a forgotten one looks like a deliberate
 * one. That is the editor's to get right.
 */
export function checkGoverns(rows: ReadonlyArray<EntryWithSenses>) {
	const problems: Array<Problem> = [];

	for (const entry of rows) {
		const where = `${entry.lemma} (${entry.partOfSpeech})`;
		const push = (at: string, message: string) =>
			problems.push(problem(entry, at, message));

		// The entry: a preposition answers, everything else stays NULL.
		if (hasGoverns(entry.partOfSpeech)) {
			if (entry.governs === null) {
				push(
					where,
					`governs is NULL — a preposition is filed with the case it takes (${GOVERNED_CASES.join(" | ")})`,
				);
			}
		} else if (entry.governs !== null) {
			push(
				where,
				`governs is "${entry.governs}" — only a preposition says it on the entry, so it must be NULL`,
			);
		}

		const entrySpelling =
			entry.governs === null ? null : misspelt(entry.governs);
		if (entrySpelling) push(where, `governs ${entrySpelling}`);

		// The senses are judged against the entry's list, which is only worth doing
		// once that list is itself sound.
		if (entrySpelling) continue;

		const asked = senseGoverns(entry.partOfSpeech, entry.governs ?? "");
		const governed = readCases(entry.governs ?? "").cases;
		const senses = [...entry.senses].sort((a, b) => a.rank - b.rank);

		for (const sense of senses) {
			const at = `${where} sense ${sense.rank}`;

			if (sense.governs !== null) {
				const spelling = misspelt(sense.governs);
				if (spelling) push(at, `governs ${spelling}`);
			}

			if (asked === "inapplicable" && sense.governs !== null) {
				push(
					at,
					hasGoverns(entry.partOfSpeech)
						? `governs is "${sense.governs}" — this preposition only ever takes ${theCases(governed)}, so its senses must leave it NULL`
						: `governs is "${sense.governs}" — only the senses of a preposition, verb or adjective say which case they take`,
				);
			}

			if (asked === "required") {
				if (sense.governs === null) {
					push(
						at,
						`governs is NULL — this preposition takes ${theCases(governed)}, so every sense has to say which`,
					);
					continue;
				}

				const outside = readCases(sense.governs).cases.filter(
					(c) => !governed.includes(c),
				);
				if (outside.length > 0) {
					push(
						at,
						`takes ${theCases(outside)}, which the entry does not govern`,
					);
				}
			}
		}

		// Every case on the entry has a meaning to show for it.
		if (asked === "required") {
			const shown = new Set(
				senses.flatMap((s) => readCases(s.governs ?? "").cases),
			);
			const unshown = governed.filter((c) => !shown.has(c));

			if (unshown.length > 0) {
				push(where, `governs ${theCases(unshown)}, but no sense takes it`);
			}
		}
	}

	return problems;
}

/** The checks the health page runs, in the order it shows them. */
export const CHECKS = [
	{ id: "lemmas", la: "Clāvēs quaerendī", en: "search keys", run: checkLemmas },
	{ id: "homonyms", la: "Homōnyma", en: "homonym numbers", run: checkHomonyms },
	{ id: "senses", la: "Significātiōnēs", en: "senses", run: checkSenses },
	{ id: "inflection", la: "Flexiō", en: "inflection", run: checkInflection },
	{
		id: "governs",
		la: "Cāsūs",
		en: "the case a word takes",
		run: checkGoverns,
	},
] as const;

export type CheckId = (typeof CHECKS)[number]["id"];
