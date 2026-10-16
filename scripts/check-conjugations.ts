/**
 * The paradigms on /conjugations and the endings sheet under them are typed out
 * separately, so a macron slip in either would go unnoticed. Every regular form
 * has to equal its verb's stem plus the sheet's ending, or this fails.
 */
import {
	CONJUGATION_GROUPS,
	ENDINGS,
	type Mood,
	PERFECT_ENDINGS,
	PERSONS,
	SYSTEMS,
	type Tense,
	type TenseForms,
	type Verb,
	type Voice,
} from "#/components/conjugations/Conjugations.utils";

const MOODS: Mood[] = ["indicative", "subjunctive"];
const VOICES: Voice[] = ["active", "passive"];
const PERFECT_SYSTEM: ReadonlyArray<string> = SYSTEMS.perfect;

type Sheet = Record<string, Record<string, string> | undefined>;

const problems: Array<string> = [];
let checked = 0;

/** Same principal parts, same stems: the filing has to agree with the forms. */
function checkStems(verb: Verb, firstEnding: string | undefined) {
	const [lemma, , perfect] = verb.principalParts;
	if (firstEnding && lemma !== verb.base + firstEnding.replace(/^-/, "")) {
		problems.push(`${lemma}: base ${verb.base}- + ${firstEnding} is not the lemma`);
	}
	if (perfect !== `${verb.perfectStem}ī`) {
		problems.push(`${lemma}: perfect stem ${verb.perfectStem}- + -ī is not ${perfect}`);
	}
}

for (const { conjugation, verbs } of CONJUGATION_GROUPS) {
	for (const verb of verbs) {
		const [lemma] = verb.principalParts;
		const present = ENDINGS[conjugation].indicative.active?.present;
		checkStems(verb, present?.["1sg"]);

		for (const mood of MOODS) {
			for (const voice of VOICES) {
				const tenses: Record<string, TenseForms | undefined> =
					verb[mood]?.[voice] ?? {};
				const endings: Sheet = ENDINGS[conjugation][mood]?.[voice] ?? {};
				const perfectEndings: Sheet =
					mood === "indicative" ? (PERFECT_ENDINGS[voice] ?? {}) : {};

				for (const [tense, forms] of Object.entries(tenses)) {
					if (!forms) continue;
					const isPerfect = PERFECT_SYSTEM.includes(tense as Tense);
					const stem = isPerfect ? verb.perfectStem : verb.base;
					const sheet = (isPerfect ? perfectEndings : endings)[tense];
					const where = `${lemma} ${mood} ${voice} ${tense}`;
					if (!sheet) {
						problems.push(`${where}: no endings for conjugation ${conjugation}`);
						continue;
					}

					for (const person of PERSONS) {
						const { form, alt, irregular } = forms[person];
						if (irregular) continue;
						const [main, altEnding] = sheet[person].split(" / ");
						const build = (ending: string) => stem + ending.replace(/^-/, "");

						checked++;
						if (form !== build(main)) {
							problems.push(
								`${where} ${person}: "${form}", but ${stem}- + ${main} gives "${build(main)}"`,
							);
						}
						if (!alt) continue;
						checked++;
						if (!altEnding) {
							problems.push(`${where} ${person}: alternative "${alt}" has no ending on the sheet`);
						} else if (alt !== build(altEnding)) {
							problems.push(
								`${where} ${person}: alternative "${alt}", but ${stem}- + ${altEnding} gives "${build(altEnding)}"`,
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
