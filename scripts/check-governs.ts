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
 *
 * The rules themselves live in src/utils/entries/rules.ts, where the admin form
 * and the createEntry/updateEntry gate read them too.
 */
import { db } from "../src/db";
import {
	formatCases,
	GOVERNED_CASES,
	hasGoverns,
	readCases,
	senseGoverns,
	theCases,
} from "#/utils/entries/rules";

const rows = await db.query.entries.findMany({
	with: { senses: { orderBy: (s, { asc }) => [asc(s.rank)] } },
});
const problems: Array<string> = [];

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

for (const entry of rows) {
	const where = `${entry.lemma} (${entry.partOfSpeech})`;

	// The entry: a preposition answers, everything else stays NULL.
	if (hasGoverns(entry.partOfSpeech)) {
		if (entry.governs === null) {
			problems.push(
				`${where}: governs is NULL — a preposition is filed with the case it takes (${GOVERNED_CASES.join(" | ")})`,
			);
		}
	} else if (entry.governs !== null) {
		problems.push(
			`${where}: governs is "${entry.governs}" — only a preposition says it on the entry, so it must be NULL`,
		);
	}

	const entrySpelling = entry.governs === null ? null : misspelt(entry.governs);
	if (entrySpelling) problems.push(`${where}: governs ${entrySpelling}`);

	// The senses are judged against the entry's list, which is only worth doing
	// once that list is itself sound.
	if (entrySpelling) continue;

	const asked = senseGoverns(entry.partOfSpeech, entry.governs ?? "");
	const governed = readCases(entry.governs ?? "").cases;

	for (const sense of entry.senses) {
		const at = `${where} sense ${sense.rank}`;

		if (sense.governs !== null) {
			const spelling = misspelt(sense.governs);
			if (spelling) problems.push(`${at}: governs ${spelling}`);
		}

		if (asked === "inapplicable" && sense.governs !== null) {
			problems.push(
				hasGoverns(entry.partOfSpeech)
					? `${at}: governs is "${sense.governs}" — this preposition only ever takes ${theCases(governed)}, so its senses must leave it NULL`
					: `${at}: governs is "${sense.governs}" — only the senses of a preposition, verb or adjective say which case they take`,
			);
		}

		if (asked === "required") {
			if (sense.governs === null) {
				problems.push(
					`${at}: governs is NULL — this preposition takes ${theCases(governed)}, so every sense has to say which`,
				);
				continue;
			}

			const outside = readCases(sense.governs).cases.filter(
				(c) => !governed.includes(c),
			);
			if (outside.length > 0) {
				problems.push(
					`${at}: takes ${theCases(outside)}, which the entry does not govern`,
				);
			}
		}
	}

	// Every case on the entry has a meaning to show for it.
	if (asked === "required") {
		const shown = new Set(
			entry.senses.flatMap((s) => readCases(s.governs ?? "").cases),
		);
		const unshown = governed.filter((c) => !shown.has(c));

		if (unshown.length > 0) {
			problems.push(
				`${where}: governs ${theCases(unshown)}, but no sense takes it`,
			);
		}
	}
}

for (const p of problems) console.error(p);

if (problems.length > 0) {
	console.error(
		`\n${problems.length} governs problem(s). See vault/schema.md — "governs".`,
	);
	process.exit(1);
}

console.log(`Governs OK — checked ${rows.length} entries.`);
