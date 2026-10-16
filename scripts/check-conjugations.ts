/**
 * The paradigms on /conjugations and the endings sheet under them are typed out
 * separately, so a macron slip in either would go unnoticed. Every regular form
 * has to equal its verb's base plus the sheet's ending, or this fails.
 */
import {
	CONJUGATION_GROUPS,
	ENDINGS,
	type Mood,
	PERSONS,
	type TenseForms,
	type Voice,
} from "#/components/conjugations/Conjugations.utils";

const MOODS: Mood[] = ["indicative", "subjunctive"];
const VOICES: Voice[] = ["active", "passive"];

const problems: Array<string> = [];
let checked = 0;

for (const { conjugation, verbs } of CONJUGATION_GROUPS) {
	for (const verb of verbs) {
		const [lemma] = verb.principalParts;

		for (const mood of MOODS) {
			for (const voice of VOICES) {
				const tenses: Record<string, TenseForms | undefined> =
					verb[mood]?.[voice] ?? {};
				const endings: Record<string, Record<string, string> | undefined> =
					ENDINGS[conjugation][mood]?.[voice] ?? {};

				for (const [tense, forms] of Object.entries(tenses)) {
					if (!forms) continue;
					const sheet = endings[tense];
					if (!sheet) {
						problems.push(
							`${lemma} ${mood} ${voice} ${tense}: no endings for conjugation ${conjugation}`,
						);
						continue;
					}

					for (const person of PERSONS) {
						const { form, irregular } = forms[person];
						if (irregular) continue;
						const expected = verb.base + sheet[person].replace(/^-/, "");
						checked++;
						if (form !== expected) {
							problems.push(
								`${lemma} ${mood} ${voice} ${tense} ${person}: "${form}", but ${verb.base}- + ${sheet[person]} gives "${expected}"`,
							);
						}
					}
				}
			}
		}
	}
}

for (const p of problems) console.error(p);

if (problems.length > 0) {
	console.error(
		`\n${problems.length} conjugation problem(s). Fix the paradigm or the endings in src/components/conjugations/Conjugations.utils.ts.`,
	);
	process.exit(1);
}

console.log(`Conjugations OK — checked ${checked} forms.`);
