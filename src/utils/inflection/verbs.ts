import {
	type Mood,
	PERSONS,
	type Person,
	type RegularConjugation,
	type TenseForms,
	type VerbParadigm,
} from "#/components/conjugations/Conjugations.utils";
import { ENDINGS, PERFECT_ENDINGS } from "./endings";
import {
	type Cell,
	endingsOf,
	type Filing,
	type Inflection,
	partsOf,
} from "./types";

const MOODS: Array<Mood> = ["indicative", "subjunctive"];

/** What the infinitive ends in, and so what comes off it to leave the base. */
const INFINITIVE: Record<RegularConjugation, string> = {
	"1": "āre",
	"2": "ēre",
	"3": "ere",
	"4": "īre",
	"3io": "ere",
};

const isRegular = (value: string | null): value is RegularConjugation =>
	value !== null && value in INFINITIVE;

type Sheet = Partial<Record<string, Partial<Record<Person, string>>>>;

/** Every tense of one sheet on one stem, in the active. */
function finite(
	stem: string,
	endings: { indicative: unknown; subjunctive?: unknown },
	persons: ReadonlyArray<Person>,
) {
	const cells: Array<Cell> = [];
	for (const mood of MOODS) {
		const tenses = ((endings[mood] as { active?: Sheet } | undefined)?.active ??
			{}) as Sheet;
		for (const [tense, row] of Object.entries(tenses)) {
			for (const person of persons) {
				endingsOf(row?.[person]).forEach((ending, i) => {
					cells.push({
						form: stem + ending,
						analysis: {
							kind: "finite",
							person,
							tense,
							mood,
							voice: "active",
						} as Cell["analysis"],
						...(i > 0 ? { variant: true as const } : {}),
					});
				});
			}
		}
	}
	return cells;
}

const infinitive = (form: string, tense: "present" | "perfect"): Cell => ({
	form,
	analysis: { kind: "infinitive", tense, voice: "active" },
});

/**
 * The active of a regular verb, from its principal parts. A filing the rules
 * cannot vouch for (a deponent, ferō's compounds) generates nothing. An
 * impersonal verb, a lemma in -t, has only its third person singular.
 */
export function regularInflection(filing: Filing): Inflection | null {
	const { conjugation } = filing;
	if (!isRegular(conjugation)) return null;
	const [present, infinitiveForm, perfect] = partsOf(filing.principalParts);
	if (!present || !infinitiveForm?.endsWith(INFINITIVE[conjugation]))
		return null;

	const base = infinitiveForm.slice(0, -INFINITIVE[conjugation].length);
	const impersonal = present.endsWith("t");
	const persons = impersonal ? (["3sg"] as const) : PERSONS;
	const presentEndings = ENDINGS[conjugation].indicative.active?.present;
	const [first] = endingsOf(presentEndings?.[persons[0]]);
	if (present !== base + first) return null;

	// The perfect stem is the 3rd part without its -ī, or an impersonal's -it.
	const perfectEnding = impersonal ? "it" : "ī";
	const perfectStem =
		perfect?.endsWith(perfectEnding) && perfect.length > perfectEnding.length
			? perfect.slice(0, -perfectEnding.length)
			: null;

	const perfectCells = (stem: string) => {
		const cells = [
			...finite(stem, PERFECT_ENDINGS, persons),
			infinitive(`${stem}isse`, "perfect"),
		];
		return [...cells, ...syncopated(stem, cells)];
	};

	return {
		stems: perfectStem ? [base, perfectStem] : [base],
		cells: () => [
			...finite(base, ENDINGS[conjugation], persons),
			infinitive(infinitiveForm, "present"),
			...(perfectStem ? perfectCells(perfectStem) : []),
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

/**
 * An irregular verb's own tables, plus the infinitives its principal parts
 * give. The perfect system is regular, so a tense the table leaves out (tulisset)
 * is built from the perfect stem.
 */
export function tableInflection(verb: VerbParadigm): Inflection {
	const cells = () => {
		const inTable = ({ analysis }: Cell) => {
			if (analysis.kind !== "finite") return false;
			const tenses: Partial<Record<string, TenseForms>> =
				verb[analysis.mood]?.active ?? {};
			return tenses[analysis.tense] !== undefined;
		};
		const out = finite(verb.perfectStem, PERFECT_ENDINGS, PERSONS).filter(
			(cell) => !inTable(cell),
		);
		for (const mood of MOODS) {
			const tenses: Partial<Record<string, TenseForms>> =
				verb[mood]?.active ?? {};
			for (const [tense, forms] of Object.entries(tenses)) {
				if (!forms) continue;
				for (const person of PERSONS) {
					const { form, alt } = forms[person];
					const analysis = {
						kind: "finite",
						person,
						tense,
						mood,
						voice: "active",
					} as Cell["analysis"];
					out.push({ form, analysis });
					if (alt) out.push({ form: alt, analysis, variant: true });
				}
			}
		}
		out.push(infinitive(verb.principalParts[1], "present"));
		out.push(infinitive(`${verb.perfectStem}isse`, "perfect"));
		return out;
	};
	return { stems: [], cells };
}
