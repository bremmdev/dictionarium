/**
 * The invariant vault/schema.md creates but nothing in the schema enforces:
 * NULL in `declension` / `conjugation` means exactly one thing — the question
 * does not apply to this part of speech. A word that inflects has to say
 * *how*, with a number or with the word `indeclinable`, because a forgotten
 * field is otherwise indistinguishable from a deliberate one.
 *
 * The vocabulary itself lives in src/utils/entries/rules.ts, because the admin
 * form now has to hold the same rule at the point of entry. This script is what
 * catches the rows written before it existed, and anything written around it.
 */
import { db } from "../src/db";
import { entries } from "../src/db/schema";
import {
	CONJUGATIONS,
	DECLENSIONS,
	hasPrincipalParts,
	hasTerminations,
	INFLECTS,
	isConjugation,
	isDeclension,
	isPartOfSpeech,
	isTerminations,
	TERMINATIONS,
} from "#/utils/entries/rules";

/** What is missing, in the word's own terms. Keyed by what hasPrincipalParts admits. */
const FILING: Record<"noun" | "verb" | "adjective", string> = {
	verb: "a verb is filed by its four principal parts",
	noun: "a noun is filed with its genitive",
	adjective: "an adjective is filed with its other terminations",
};

const rows = await db.select().from(entries);
const problems: Array<string> = [];

for (const r of rows) {
	const where = `${r.lemma} (${r.partOfSpeech})`;

	// A part of speech the map has never heard of is itself a finding: nobody
	// has decided whether it inflects, so neither column can be read either way.
	if (!isPartOfSpeech(r.partOfSpeech)) {
		problems.push(
			`${where}: unknown part_of_speech — add it to INFLECTS in src/utils/entries/rules.ts and say whether it inflects`,
		);
		continue;
	}

	const asks = INFLECTS[r.partOfSpeech];

	// The question that applies must be answered, and answered in the vocabulary.
	if (asks === "declension") {
		if (r.declension === null) {
			problems.push(
				`${where}: declension is NULL — this word inflects, so say how (${DECLENSIONS.join(" | ")})`,
			);
		} else if (!isDeclension(r.declension)) {
			problems.push(
				`${where}: declension is "${r.declension}", not one of ${DECLENSIONS.join(" | ")}`,
			);
		}
	}

	if (asks === "conjugation") {
		if (r.conjugation === null) {
			problems.push(
				`${where}: conjugation is NULL — this word inflects, so say how (${CONJUGATIONS.join(" | ")})`,
			);
		} else if (!isConjugation(r.conjugation)) {
			problems.push(
				`${where}: conjugation is "${r.conjugation}", not one of ${CONJUGATIONS.join(" | ")}`,
			);
		}
	}

	// The question that does not apply must stay NULL, or NULL stops meaning one thing.
	if (asks !== "declension" && r.declension !== null) {
		problems.push(
			`${where}: declension is "${r.declension}" — this part of speech does not decline, so it must be NULL`,
		);
	}

	if (asks !== "conjugation" && r.conjugation !== null) {
		problems.push(
			`${where}: conjugation is "${r.conjugation}" — this part of speech does not conjugate, so it must be NULL`,
		);
	}

	// The same two rules again, one question further down: a 3rd-declension
	// adjective has to say how many terminations it files with, and nothing else
	// may carry the answer. Counting the forms in principal_parts cannot stand in
	// for it — "fortis, forte" and "vetus, veteris" are both two.
	if (hasTerminations(r.partOfSpeech, r.declension ?? "")) {
		if (r.terminations === null) {
			problems.push(
				`${where}: terminations is NULL — a 3rd-declension adjective files with one, two or three (${TERMINATIONS.join(" | ")})`,
			);
		} else if (!isTerminations(r.terminations)) {
			problems.push(
				`${where}: terminations is "${r.terminations}", not one of ${TERMINATIONS.join(" | ")}`,
			);
		}
	} else if (r.terminations !== null) {
		problems.push(
			`${where}: terminations is "${r.terminations}" — only a 3rd-declension adjective is asked, so it must be NULL`,
		);
	}

	// And the filing itself, which the same NULL rule governs: an adjective that
	// declines prints its other terminations, and one that never changes shape
	// has nothing to print.
	if (hasPrincipalParts(r.partOfSpeech, r.declension ?? "")) {
		if (r.principalParts === null) {
			problems.push(
				`${where}: principal_parts is NULL — ${FILING[r.partOfSpeech]}`,
			);
		}
	} else if (r.principalParts !== null) {
		problems.push(
			`${where}: principal_parts is "${r.principalParts}" — the lemma is the whole filing for this word, so it must be NULL`,
		);
	}
}

for (const p of problems) console.error(p);

if (problems.length > 0) {
	console.error(
		`\n${problems.length} inflection problem(s). See vault/schema.md — "The inflection vocabulary".`,
	);
	process.exit(1);
}

console.log(`Inflection OK — checked ${rows.length} entries.`);
