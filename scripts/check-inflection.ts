/**
 * The invariant vault/schema.md creates but nothing in the schema enforces:
 * NULL in `declension` / `conjugation` means exactly one thing — the question
 * does not apply to this part of speech. A word that inflects has to say
 * *how*, with a number or with the word `indeclinable`, because a forgotten
 * field is otherwise indistinguishable from a deliberate one.
 */
import { db } from "../src/db";
import { entries } from "../src/db/schema";

/** `1-2` is the adjective pattern (bonus, bona, bonum); `indeclinable` is an answer, not an absence. */
const DECLENSIONS = ["1", "2", "3", "4", "5", "1-2", "indeclinable"];
const CONJUGATIONS = ["1", "2", "3", "4", "3io", "irregular"];

/**
 * Which of the two questions a part of speech has to answer. A part of speech
 * missing from here is itself a finding: nobody has decided whether it
 * inflects, so its NULLs cannot be read either way.
 */
const INFLECTS: Record<string, "declension" | "conjugation" | "neither"> = {
	noun: "declension",
	adjective: "declension",
	numeral: "declension",
	pronoun: "declension",
	verb: "conjugation",
	adverb: "neither",
	conjunction: "neither",
	preposition: "neither",
	interjection: "neither",
	particle: "neither",
};

const rows = await db.select().from(entries);
const problems: Array<string> = [];

for (const r of rows) {
	const where = `${r.lemma} (${r.partOfSpeech})`;
	const asks = INFLECTS[r.partOfSpeech];

	if (!asks) {
		problems.push(
			`${where}: unknown part_of_speech — add it to INFLECTS in scripts/check-inflection.ts and say whether it inflects`,
		);
		continue;
	}

	// The question that applies must be answered, and answered in the vocabulary.
	if (asks === "declension") {
		if (r.declension === null) {
			problems.push(
				`${where}: declension is NULL — this word inflects, so say how (${DECLENSIONS.join(" | ")})`,
			);
		} else if (!DECLENSIONS.includes(r.declension)) {
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
		} else if (!CONJUGATIONS.includes(r.conjugation)) {
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
