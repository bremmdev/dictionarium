/**
 * The paradigms on /grammar/conjugations and the endings sheet under them are typed out
 * separately, so a macron slip in either would go unnoticed. Every regular form
 * has to equal its verb's stem plus the sheet's ending, or this fails. On
 * /grammar/irregular-verbs only the perfect system is checked.
 */
import {
	CONJUGATION_GROUPS,
	type Form,
	type ImperativePerson,
	type Mood,
	PERSONS,
	type RegularConjugation,
	SYSTEMS,
	type Tense,
	type TenseForms,
	type Verb,
	type VerbParadigm,
	type Voice,
} from "#/components/conjugations/Conjugations.utils";
import {
	ENDINGS,
	PERFECT_ENDINGS,
	NON_FINITE,
	PERFECT_PASSIVE_AUXILIARY,
	SUPINE_ENDINGS,
} from "#/utils/inflection/endings";
import { IRREGULAR_VERBS } from "#/components/irregular-verbs/IrregularVerbs.utils";

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

/** Every cell of one tense against stem + the sheet's ending; irregular cells are skipped. */
function checkForms(
	where: string,
	stem: string,
	forms: TenseForms,
	sheet: Record<string, string>,
) {
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

const SUM = IRREGULAR_VERBS.find(({ principalParts }) => principalParts[0] === "sum");

/** The participle from the supine (-us, -ī in the plural) and the tense of sum the sheet names. */
function checkPerfectPassive(verb: VerbParadigm, mood: Mood, tense: string, forms: TenseForms) {
	const [lemma, , , supine] = verb.principalParts;
	const where = `${lemma} ${mood} passive ${tense}`;
	const auxiliary = (PERFECT_PASSIVE_AUXILIARY[mood] as Record<string, Tense>)[tense];
	const sum = auxiliary && SUM?.[mood]?.active?.[auxiliary as "present"];
	if (!supine?.endsWith("um") || !sum) {
		problems.push(`${where}: no supine or no tense of sum to build it from`);
		return;
	}
	for (const [i, person] of PERSONS.entries()) {
		const expected = `${supine.slice(0, -2)}${i < 3 ? "us" : "ī"} ${sum[person].form}`;
		checked++;
		if (forms[person].form !== expected) {
			problems.push(`${where} ${person}: "${forms[person].form}", but it should be "${expected}"`);
		}
	}
}

/** The Cētera tab: every cell rebuilt from the present stem, the perfect stem or the supine. */
function checkCetera(verb: Verb, conjugation: RegularConjugation) {
	const [lemma, , , supine] = verb.principalParts;
	const { cetera } = verb;
	if (!cetera) return;
	const sheet = NON_FINITE[conjugation];
	const strip = (ending: string) => ending.replace(/^-/, "");
	const on = (stem: string, line: string) =>
		line
			.split(", ")
			.map((ending) => stem + strip(ending))
			.join(", ");
	const sup = supine?.endsWith("um") ? supine.slice(0, -2) : null;
	if (!sup) {
		problems.push(`${lemma}: no supine to build the participles from`);
		return;
	}
	const gerund = on(verb.base, sheet.gerund).slice(0, -1);
	const expected: Array<[string, Form | undefined, string]> = [
		["present active infinitive", cetera.infinitive.present?.active, on(verb.base, sheet.infinitive.active)],
		["present passive infinitive", cetera.infinitive.present?.passive, on(verb.base, sheet.infinitive.passive)],
		["perfect active infinitive", cetera.infinitive.perfect?.active, `${verb.perfectStem}isse`],
		["perfect passive infinitive", cetera.infinitive.perfect?.passive, `${sup}us esse`],
		["future active infinitive", cetera.infinitive.future?.active, `${sup}ūrus esse`],
		["future passive infinitive", cetera.infinitive.future?.passive, `${sup}um īrī`],
		["present participle", cetera.participle.present, on(verb.base, sheet.presentParticiple)],
		["perfect participle", cetera.participle.perfect, on(sup, SUPINE_ENDINGS.perfectParticiple)],
		["future participle", cetera.participle.future, on(sup, SUPINE_ENDINGS.futureParticiple)],
		["gerundive", cetera.gerundive, on(verb.base, sheet.gerundive)],
		["gerund genitive", cetera.gerund?.genitive, `${gerund}ī`],
		["gerund dative", cetera.gerund?.dative, `${gerund}ō`],
		["gerund accusative", cetera.gerund?.accusative, `${gerund}um`],
		["gerund ablative", cetera.gerund?.ablative, `${gerund}ō`],
		["supine accusative", cetera.supine?.accusative, `${sup}um`],
		["supine ablative", cetera.supine?.ablative, `${sup}ū`],
	];
	for (const voice of VOICES) {
		for (const tense of ["present", "future"] as const) {
			for (const [person, ending] of Object.entries(sheet.imperative[voice][tense])) {
				const cell = cetera.imperative[voice]?.[tense][person as ImperativePerson];
				expected.push([`${voice} ${tense} imperative ${person}`, cell, on(verb.base, ending)]);
			}
		}
	}
	for (const [where, cell, form] of expected) {
		checked++;
		if (!cell) problems.push(`${lemma} ${where}: missing, expected "${form}"`);
		else if (!cell.irregular && cell.form !== form) {
			problems.push(`${lemma} ${where}: "${cell.form}", but the sheet gives "${form}"`);
		}
	}
}

for (const { conjugation, verbs } of CONJUGATION_GROUPS) {
	for (const verb of verbs) {
		const [lemma] = verb.principalParts;
		const present = ENDINGS[conjugation].indicative.active?.present;
		checkStems(verb, present?.["1sg"]);
		checkCetera(verb, conjugation);

		for (const mood of MOODS) {
			for (const voice of VOICES) {
				const tenses: Record<string, TenseForms | undefined> =
					verb[mood]?.[voice] ?? {};
				const endings: Sheet = ENDINGS[conjugation][mood]?.[voice] ?? {};
				const perfectEndings: Sheet = PERFECT_ENDINGS[mood]?.[voice] ?? {};

				for (const [tense, forms] of Object.entries(tenses)) {
					if (!forms) continue;
					const isPerfect = PERFECT_SYSTEM.includes(tense as Tense);
					if (isPerfect && voice === "passive") {
						checkPerfectPassive(verb, mood, tense, forms);
						continue;
					}
					const stem = isPerfect ? verb.perfectStem : verb.base;
					const sheet = (isPerfect ? perfectEndings : endings)[tense];
					const where = `${lemma} ${mood} ${voice} ${tense}`;
					if (!sheet) {
						problems.push(`${where}: no endings for conjugation ${conjugation}`);
						continue;
					}

					checkForms(where, stem, forms, sheet);
				}
			}
		}
	}
}

// No pattern to rebuild an irregular present system from, but the perfect
// system is regular for most of them.
for (const verb of IRREGULAR_VERBS) {
	const [lemma, , perfect] = verb.principalParts;
	if (perfect !== `${verb.perfectStem}ī`) {
		problems.push(`${lemma}: perfect stem ${verb.perfectStem}- + -ī is not ${perfect}`);
	}
	for (const mood of MOODS) {
		const tenses: Record<string, TenseForms | undefined> = verb[mood]?.active ?? {};
		const sheets: Sheet = PERFECT_ENDINGS[mood]?.active ?? {};
		for (const tense of SYSTEMS.perfect) {
			const forms = tenses[tense];
			const sheet = sheets[tense];
			if (forms && sheet) {
				checkForms(`${lemma} ${mood} active ${tense}`, verb.perfectStem, forms, sheet);
			}
			const passive = verb[mood]?.passive?.[tense as "perfect"];
			if (passive) checkPerfectPassive(verb, mood, tense, passive);
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
