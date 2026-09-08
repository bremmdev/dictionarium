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
	INFLECTS,
	isConjugation,
	isDeclension,
	isPartOfSpeech,
} from "#/utils/entries/rules";

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
}

for (const p of problems) console.error(p);

if (problems.length > 0) {
	console.error(
		`\n${problems.length} inflection problem(s). See vault/schema.md — "The inflection vocabulary".`,
	);
	process.exit(1);
}

console.log(`Inflection OK — checked ${rows.length} entries.`);
