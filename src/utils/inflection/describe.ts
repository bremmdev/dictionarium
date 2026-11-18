import {
	PERSON_LABELS,
	TENSE_LABELS,
} from "#/components/conjugations/Conjugations.utils";
import { CASES, type Case } from "#/components/declensions/Declensions.utils";
import type { Gender } from "#/utils/entries/rules";
import type { Cell, GrammaticalNumber, VerbalNoun } from "./types";

/** Short on screen, the whole words for a screen reader, as PERSON_LABELS. */
export type Label = { short: string; full: string };

/** One spelling of the query in one entry, with its macrons, and what it is. */
export type FormLine = {
	form: string;
	labels: Array<Label>;
	/** Apart from the labels so the Latin can carry lang: "with -que". */
	enclitic?: string;
};

const CASE_SHORT: Record<Case, string> = {
	nominative: "nom.",
	genitive: "gen.",
	dative: "dat.",
	accusative: "acc.",
	ablative: "abl.",
	vocative: "voc.",
};

const NUMBER_LABELS: Record<GrammaticalNumber, Label> = {
	singular: { short: "sg.", full: "singular" },
	plural: { short: "pl.", full: "plural" },
};

const GENDER_LABELS: Record<Gender, Label> = {
	m: { short: "masc.", full: "masculine" },
	f: { short: "fem.", full: "feminine" },
	n: { short: "neut.", full: "neuter" },
};

const GENDER_ORDER: Array<Gender> = ["m", "f", "n"];

const VERBAL_NOUNS: Record<VerbalNoun, string> = {
	presentParticiple: "present participle",
	perfectParticiple: "perfect participle",
	futureParticiple: "future participle",
	gerundive: "gerundive",
	gerund: "gerund",
	supine: "supine",
};

/** The gerund and the supine have no number or gender to name. */
const UNNUMBERED = new Set<VerbalNoun>(["gerund", "supine"]);

function genderLabel(genders: Array<Gender>): Label | null {
	if (genders.length === 0) return null;
	if (genders.length === 3)
		return { short: "all genders", full: "all genders" };
	return {
		short: genders.map((g) => GENDER_LABELS[g].short).join("/"),
		full: genders.map((g) => GENDER_LABELS[g].full).join(" or "),
	};
}

/** "gen./dat. sg. fem., nom./voc. pl. fem.": cases merged where number and genders agree. */
function caseLabels(cells: Array<Cell>): Array<Label> {
	const slots = new Map<
		string,
		{
			of?: VerbalNoun;
			number: GrammaticalNumber;
			c: Case;
			genders: Set<Gender>;
		}
	>();
	for (const { analysis } of cells) {
		if (analysis.kind !== "case") continue;
		const id = `${analysis.of ?? ""}|${analysis.number}|${analysis.case}`;
		const slot = slots.get(id) ?? {
			of: analysis.of,
			number: analysis.number,
			c: analysis.case,
			genders: new Set(),
		};
		if (analysis.gender) slot.genders.add(analysis.gender);
		slots.set(id, slot);
	}

	const groups = new Map<
		string,
		{
			of?: VerbalNoun;
			number: GrammaticalNumber;
			genders: Array<Gender>;
			cases: Array<Case>;
		}
	>();
	for (const { of, number, c, genders } of slots.values()) {
		const sorted = GENDER_ORDER.filter((g) => genders.has(g));
		const id = `${of ?? ""}|${number}|${sorted.join("")}`;
		const group = groups.get(id) ?? { of, number, genders: sorted, cases: [] };
		group.cases.push(c);
		groups.set(id, group);
	}

	return (
		[...groups.values()]
			.map((group) => ({
				...group,
				cases: CASES.filter((c) => group.cases.includes(c)),
			}))
			.sort(
				(a, b) =>
					(a.number === b.number ? 0 : a.number === "singular" ? -1 : 1) ||
					CASES.indexOf(a.cases[0]) - CASES.indexOf(b.cases[0]),
			)
			.map(({ of, number, genders, cases }) => {
				const bare = of !== undefined && UNNUMBERED.has(of);
				const gender = bare ? null : genderLabel(genders);
				const numberLabel = bare ? null : NUMBER_LABELS[number];
				return {
					of,
					short: [
						cases.map((c) => CASE_SHORT[c]).join("/"),
						numberLabel?.short,
						gender?.short,
					]
						.filter(Boolean)
						.join(" "),
					full: [cases.join(" or "), numberLabel?.full, gender?.full]
						.filter(Boolean)
						.join(" "),
				};
			})
			.reduce<Array<Label & { of?: VerbalNoun; parts: Array<Label> }>>(
				(merged, { of, short, full }) => {
					const same = merged.find((label) => label.of === of);
					if (same) same.parts.push({ short, full });
					else merged.push({ of, short, full, parts: [{ short, full }] });
					return merged;
				},
				[],
			)
			// One label per participle: "perfect participle (nom. sg. neut., acc. sg. masc./neut.)".
			.flatMap(({ of, parts }) => {
				if (!of) return parts;
				const join = (key: keyof Label, separator: string) =>
					`${VERBAL_NOUNS[of]} (${parts.map((p) => p[key]).join(separator)})`;
				return [{ short: join("short", ", "), full: join("full", "; ") }];
			})
	);
}

function verbLabel({ analysis }: Cell): Label | null {
	if (analysis.kind === "case") return null;
	// A deponent is passive in form only, so its voice is left unsaid.
	const voice = analysis.deponent ? null : analysis.voice;
	if (analysis.kind === "finite") {
		const { person, tense, mood } = analysis;
		const rest = [TENSE_LABELS[tense].en, mood, voice]
			.filter(Boolean)
			.join(" ");
		return {
			short: `${PERSON_LABELS[person].short} ${rest}`,
			full: `${PERSON_LABELS[person].full} ${rest}`,
		};
	}
	if (analysis.kind === "imperative") {
		const { person, tense } = analysis;
		const rest = [tense, "imperative", voice].filter(Boolean).join(" ");
		return {
			short: `${PERSON_LABELS[person].short} ${rest}`,
			full: `${PERSON_LABELS[person].full} ${rest}`,
		};
	}
	const text = [analysis.tense, voice, "infinitive"].filter(Boolean).join(" ");
	return { short: text, full: text };
}

/**
 * The cells a query matched in one entry, one line per spelling. An enclitic
 * goes back on the form and is named after the labels: virumque, "with -que".
 */
export function describe(
	cells: Array<Cell>,
	enclitic?: string,
): Array<FormLine> {
	const bySpelling = new Map<string, Array<Cell>>();
	for (const cell of cells) {
		bySpelling.set(cell.form, [...(bySpelling.get(cell.form) ?? []), cell]);
	}

	return [...bySpelling].map(([form, all]) => {
		// A rarer verb form is left out when the spelling has a main one: amāre is
		// the infinitive, not also the -re form of amāris. Cases keep both (fīlī).
		const hasMain = all.some((c) => !c.variant);
		const matched = all.filter(
			(c) => !(hasMain && c.variant && c.analysis.kind !== "case"),
		);
		const labels = [
			...caseLabels(matched),
			...matched.flatMap((c) => verbLabel(c) ?? []),
		];
		const seen = new Set<string>();
		const unique = labels.filter(({ full }) => {
			if (seen.has(full)) return false;
			seen.add(full);
			return true;
		});
		if (!enclitic) return { form, labels: unique };
		return { form: form + enclitic, labels: unique, enclitic };
	});
}
