import {
	type Cetera,
	type Form,
	type Mood,
	PERSONS,
	type Person,
	type RegularConjugation,
	type TenseForms,
	type VerbParadigm,
	type Voice,
} from "#/components/conjugations/Conjugations.utils";
import type { Case } from "#/components/declensions/Declensions.utils";
import { firstSecond, third } from "./adjectives";
import {
	ENDINGS,
	IMPERATIVE_PERSONS,
	NON_FINITE,
	PERFECT_ENDINGS,
	SHORT_IMPERATIVES,
	SUPINE_ENDINGS,
	SUPPLETIVE_PASSIVE,
} from "./endings";
import {
	type Cell,
	endingsOf,
	type Filing,
	type Inflection,
	partsOf,
	type VerbalNoun,
} from "./types";

const MOODS: Array<Mood> = ["indicative", "subjunctive"];

const isRegular = (value: string | null): value is RegularConjugation =>
	value !== null && value in NON_FINITE;

type Sheet = Partial<Record<string, Partial<Record<Person, string>>>>;
type Endings = Partial<Record<Mood, Partial<Record<Voice, Sheet>>>>;

const first = (sheet: string) => endingsOf(sheet)[0] ?? "";
const flag = (deponent: boolean) =>
	deponent ? ({ deponent: true } as const) : {};

/** Every tense of one sheet on one stem, in one voice. */
function finite(
	stem: string,
	endings: Endings,
	voice: Voice,
	persons: ReadonlyArray<Person>,
	deponent = false,
) {
	const cells: Array<Cell> = [];
	for (const mood of MOODS) {
		for (const [tense, row] of Object.entries(endings[mood]?.[voice] ?? {})) {
			for (const person of persons) {
				endingsOf(row?.[person]).forEach((ending, i) => {
					cells.push({
						form: stem + ending,
						analysis: {
							kind: "finite",
							person,
							tense,
							mood,
							voice,
							...flag(deponent),
						} as Cell["analysis"],
						...(i > 0 ? { variant: true as const } : {}),
					});
				});
			}
		}
	}
	return cells;
}

const infinitive = (
	form: string,
	tense: "present" | "perfect",
	voice: Voice,
	deponent = false,
): Cell => ({
	form,
	analysis: { kind: "infinitive", tense, voice, ...flag(deponent) },
});

/** A participle or the gerundive, declined; tagged so the card says which. */
function declined(inflection: Inflection | null, of: VerbalNoun) {
	return (inflection?.cells() ?? []).map((cell) =>
		cell.analysis.kind === "case"
			? { ...cell, analysis: { ...cell.analysis, of } }
			: cell,
	);
}

/** The participle stem (salūtāt-) from a supine or a perfect participle. */
function participleStem(part: string | undefined) {
	if (!part) return null;
	for (const ending of ["ūrus", "um", "us"]) {
		if (part.endsWith(ending) && part.length > ending.length)
			return { stem: part.slice(0, -ending.length), ending };
	}
	return null;
}

/** On the present stem: infinitives, imperatives, the present participle, gerund and gerundive. */
function presentNonFinite(
	lemma: string,
	base: string,
	conjugation: RegularConjugation,
	deponent: boolean,
	impersonal: boolean,
	withPassive: boolean,
) {
	const sheet = NON_FINITE[conjugation];
	const on = (ending: string) => base + first(ending);
	const cells: Array<Cell> = [];
	const voices: Array<Voice> = deponent
		? ["passive"]
		: withPassive
			? ["active", "passive"]
			: ["active"];

	for (const voice of voices) {
		cells.push(
			infinitive(on(sheet.infinitive[voice]), "present", voice, deponent),
		);
		if (impersonal) continue;
		for (const tense of ["present", "future"] as const) {
			const row = sheet.imperative[voice][tense];
			for (const person of IMPERATIVE_PERSONS) {
				const ending = row[person];
				if (!ending) continue;
				const analysis = {
					kind: "imperative",
					tense,
					person,
					voice,
					...flag(deponent),
				} as const;
				const short = Object.entries(SHORT_IMPERATIVES).find(([verb]) =>
					lemma.endsWith(verb),
				);
				if (
					short &&
					voice === "active" &&
					tense === "present" &&
					person === "2sg"
				) {
					// dīc, with the regular dīce as the rarer form.
					cells.push({
						form: lemma.slice(0, -short[0].length) + short[1],
						analysis,
					});
					cells.push({ form: on(ending), analysis, variant: true });
				} else {
					cells.push({ form: on(ending), analysis });
				}
			}
		}
	}
	if (impersonal) return cells;

	const [nominative, genitive] = endingsOf(
		sheet.presentParticiple.replace(", ", " / "),
	);
	cells.push(
		...declined(
			third(`${base}${nominative}, ${base}${genitive}`, "1"),
			"presentParticiple",
		),
	);
	const gerundive = sheet.gerundive
		.split(", ")
		.map((e) => base + first(e))
		.join(", ");
	cells.push(...declined(firstSecond(gerundive), "gerundive"));

	const gerund = on(sheet.gerund).slice(0, -1);
	for (const [c, ending] of [
		["genitive", "ī"],
		["dative", "ō"],
		["accusative", "um"],
		["ablative", "ō"],
	] as const) {
		cells.push({
			form: gerund + ending,
			analysis: { kind: "case", case: c, number: "singular", of: "gerund" },
		});
	}
	return cells;
}

/** On the supine stem: the perfect and future participles, and the supine itself. */
function supineNonFinite(
	stem: string,
	withSupine: boolean,
	futureOnly: boolean,
) {
	const line = (sheet: string) =>
		sheet
			.split(", ")
			.map((e) => stem + first(e))
			.join(", ");
	const cells = declined(
		firstSecond(line(SUPINE_ENDINGS.futureParticiple)),
		"futureParticiple",
	);
	if (futureOnly) return cells;
	cells.push(
		...declined(
			firstSecond(line(SUPINE_ENDINGS.perfectParticiple)),
			"perfectParticiple",
		),
	);
	if (withSupine) {
		const [accusative, ablative] = endingsOf(SUPINE_ENDINGS.supine);
		for (const [c, ending] of [
			["accusative", accusative],
			["ablative", ablative],
		] as const) {
			cells.push({
				form: stem + ending,
				analysis: { kind: "case", case: c, number: "singular", of: "supine" },
			});
		}
	}
	return cells;
}

/**
 * A regular verb from its principal parts, deponents included. A filing the
 * rules cannot vouch for (ferō's compounds) generates nothing. An impersonal
 * verb, a lemma in -t, has only its third person singular, and faciō no
 * passive of its own (fīō).
 */
export function regularInflection(filing: Filing): Inflection | null {
	const { conjugation, lemma } = filing;
	if (!isRegular(conjugation)) return null;
	const [present, infinitiveForm, thirdPart, fourth] = partsOf(
		filing.principalParts,
	);
	if (!present || !infinitiveForm) return null;

	const sheet = NON_FINITE[conjugation];
	const shape = (voice: Voice) => {
		const ending = first(sheet.infinitive[voice]);
		if (!infinitiveForm.endsWith(ending)) return null;
		const base = infinitiveForm.slice(0, -ending.length);
		const impersonal = voice === "active" && present.endsWith("t");
		const row = ENDINGS[conjugation].indicative[voice]?.present;
		const person = impersonal ? "3sg" : "1sg";
		return present === base + first(row?.[person] ?? "")
			? { base, impersonal }
			: null;
	};
	const active = shape("active");
	const passive = active ? null : shape("passive");
	const found = active ?? passive;
	if (!found) return null;
	const { base, impersonal } = found;
	const deponent = passive !== null;
	const persons = impersonal ? (["3sg"] as const) : PERSONS;
	const withPassive = !impersonal && !SUPPLETIVE_PASSIVE.includes(lemma);

	// The 3rd part: a perfect in -ī (-it for an impersonal), or a participle
	// for a deponent or semi-deponent (hortātus sum, ausus sum).
	const perfectEnding = impersonal ? "it" : "ī";
	const perfectStem =
		!deponent &&
		thirdPart?.endsWith(perfectEnding) &&
		thirdPart.length > perfectEnding.length
			? thirdPart.slice(0, -perfectEnding.length)
			: null;
	const participle = participleStem(perfectStem ? fourth : thirdPart);
	// A deponent's 3rd part is its participle; anything else needs a perfect.
	const usableParticiple =
		participle && (perfectStem || participle.ending === "us")
			? participle
			: null;

	const perfectCells = (stem: string) => {
		const cells = [
			...finite(stem, PERFECT_ENDINGS, "active", persons),
			infinitive(`${stem}isse`, "perfect", "active"),
		];
		return [...cells, ...syncopated(stem, cells)];
	};

	return {
		stems: [base, perfectStem, usableParticiple?.stem].filter(
			(stem): stem is string => !!stem,
		),
		cells: () => [
			...(deponent
				? []
				: finite(base, ENDINGS[conjugation], "active", persons)),
			...(withPassive
				? finite(base, ENDINGS[conjugation], "passive", persons, deponent)
				: []),
			...presentNonFinite(
				lemma,
				base,
				conjugation,
				deponent,
				impersonal,
				withPassive,
			),
			...(perfectStem ? perfectCells(perfectStem) : []),
			...(usableParticiple && !impersonal
				? supineNonFinite(
						usableParticiple.stem,
						usableParticiple.ending === "um",
						usableParticiple.ending === "ūrus",
					)
				: []),
		],
	};
}

/**
 * A -v- perfect drops vi/ve before s and r (amāstī, amāsse, amārunt), and an
 * -īv- perfect its v throughout (audiit, audierat, audiērunt). As variants.
 */
function syncopated(stem: string, cells: Array<Cell>): Array<Cell> {
	if (!/[āēīō]v$/.test(stem)) return [];
	const short = stem.slice(0, -1);
	const iPerfect = stem.endsWith("īv");
	const out: Array<Cell> = [];
	for (const { form, analysis } of cells) {
		const ending = form.slice(stem.length);
		const variant = (spelled: string) =>
			out.push({ form: spelled, analysis, variant: true });
		if (ending.startsWith("is")) variant(short + ending.slice(1));
		// -ēre is left alone: amāre is the infinitive.
		else if (!iPerfect && /^[eē]r/.test(ending) && ending !== "ēre") {
			variant(short + ending.slice(1));
		}
		if (iPerfect) variant(`${stem.slice(0, -2)}i${ending}`);
	}
	return out;
}

/** A Cētera tab as cells: the two-word infinitives are left out. */
function ceteraCells(cetera: Cetera): Array<Cell> {
	const cells: Array<Cell> = [];
	const push = (cell: Form | undefined, analysis: Cell["analysis"]) => {
		if (!cell || cell.form.includes(" ")) return;
		cells.push({ form: cell.form, analysis });
		if (cell.alt) cells.push({ form: cell.alt, analysis, variant: true });
	};
	for (const voice of ["active", "passive"] as const) {
		for (const tense of ["present", "future"] as const) {
			for (const person of IMPERATIVE_PERSONS) {
				push(cetera.imperative[voice]?.[tense][person], {
					kind: "imperative",
					tense,
					person,
					voice,
				});
			}
		}
		for (const tense of ["present", "perfect"] as const) {
			push(cetera.infinitive[tense]?.[voice], {
				kind: "infinitive",
				tense,
				voice,
			});
		}
	}
	// fore, the one-word future infinitive of sum, is the alt of futūrus esse.
	const future = cetera.infinitive.future?.active?.alt;
	if (future) {
		cells.push({
			form: future,
			analysis: { kind: "infinitive", tense: "future", voice: "active" },
		});
	}
	const { present, perfect, future: futureParticiple } = cetera.participle;
	if (present) {
		cells.push(...declined(third(present.form, "1"), "presentParticiple"));
	}
	for (const [line, of] of [
		[perfect, "perfectParticiple"],
		[futureParticiple, "futureParticiple"],
		[cetera.gerundive, "gerundive"],
	] as const) {
		if (line) cells.push(...declined(firstSecond(line.form), of));
	}
	for (const [c, cell] of Object.entries(cetera.gerund ?? {})) {
		push(cell, {
			kind: "case",
			case: c as Case,
			number: "singular",
			of: "gerund",
		});
	}
	for (const [c, cell] of Object.entries(cetera.supine ?? {})) {
		push(cell, {
			kind: "case",
			case: c as Case,
			number: "singular",
			of: "supine",
		});
	}
	return cells;
}

/**
 * An irregular verb's own tables, Cētera included. The perfect system is
 * regular, so a tense the table leaves out is built from the perfect stem.
 */
export function tableInflection(verb: VerbParadigm): Inflection {
	const cells = () => {
		const inTable = ({ analysis }: Cell) => {
			if (analysis.kind !== "finite") return false;
			const tenses: Partial<Record<string, TenseForms>> =
				verb[analysis.mood]?.[analysis.voice] ?? {};
			return tenses[analysis.tense] !== undefined;
		};
		const out = finite(
			verb.perfectStem,
			PERFECT_ENDINGS,
			"active",
			PERSONS,
		).filter((cell) => !inTable(cell));
		for (const mood of MOODS) {
			for (const voice of ["active", "passive"] as const) {
				const tenses: Partial<Record<string, TenseForms>> =
					verb[mood]?.[voice] ?? {};
				for (const [tense, forms] of Object.entries(tenses)) {
					if (!forms) continue;
					for (const person of PERSONS) {
						const { form, alt } = forms[person];
						// nōn vīs, lātus sum: two words, found by their parts.
						if (form.includes(" ")) continue;
						const analysis = {
							kind: "finite",
							person,
							tense,
							mood,
							voice,
						} as Cell["analysis"];
						out.push({ form, analysis });
						if (alt) out.push({ form: alt, analysis, variant: true });
					}
				}
			}
		}
		if (verb.cetera) out.push(...ceteraCells(verb.cetera));
		else {
			out.push(infinitive(verb.principalParts[1], "present", "active"));
			out.push(infinitive(`${verb.perfectStem}isse`, "perfect", "active"));
		}
		return out;
	};
	return { stems: [], cells };
}

/**
 * A compound of an irregular verb, from its filed parts: afferō, afferre,
 * attulī, allātum puts af- on ferō's present system, at- on its perfect and
 * al- on what comes from the supine. A prefix that changes before a vowel
 * comes from the infinitive: prōsum, prōdesse gives prōsunt but prōdest.
 */
export function compoundInflection(
	filing: Filing,
	verb: VerbParadigm,
): Inflection | null {
	const [lemma, infinitiveForm, perfect, supine] = partsOf(
		filing.principalParts,
	);
	const [baseLemma, baseInfinitive, basePerfect, baseSupine] =
		verb.principalParts;
	const prefix = (part: string | undefined, base: string | undefined) =>
		part && base && part.endsWith(base) && part.length > base.length
			? part.slice(0, -base.length)
			: null;
	const beforeConsonant = prefix(lemma, baseLemma);
	const beforeVowel = prefix(infinitiveForm, baseInfinitive);
	if (!beforeConsonant || !beforeVowel) return null;
	const perfectPrefix = prefix(perfect, basePerfect);
	const supinePrefix = prefix(supine, baseSupine);

	const isPerfect = ({ analysis }: Cell) =>
		(analysis.kind === "finite" &&
			analysis.voice === "active" &&
			["perfect", "pluperfect", "futurePerfect"].includes(analysis.tense)) ||
		(analysis.kind === "infinitive" && analysis.tense === "perfect");
	const fromSupine = ({ analysis }: Cell) =>
		analysis.kind === "case" &&
		(analysis.of === "perfectParticiple" ||
			analysis.of === "futureParticiple" ||
			analysis.of === "supine");

	const base = tableInflection(verb);
	const cells = () =>
		base.cells().flatMap((cell) => {
			const before = isPerfect(cell)
				? perfectPrefix
				: fromSupine(cell)
					? supinePrefix
					: /^[aeiouāēīōū]/.test(cell.form)
						? beforeVowel
						: beforeConsonant;
			return before ? [{ ...cell, form: before + cell.form }] : [];
		});
	return {
		stems: [...new Set(cells().map((cell) => cell.form))],
		cells,
	};
}
