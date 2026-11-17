import {
	PERSON_LABELS,
	TENSE_LABELS,
} from "#/components/conjugations/Conjugations.utils";
import { CASES, type Case } from "#/components/declensions/Declensions.utils";
import type { Gender } from "#/utils/entries/rules";
import type { Cell, GrammaticalNumber } from "./types";

/** Short on screen, the whole words for a screen reader, as PERSON_LABELS. */
export type Label = { short: string; full: string };

/** One spelling of the query in one entry, with its macrons, and what it is. */
export type FormLine = { form: string; labels: Array<Label> };

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
		{ number: GrammaticalNumber; c: Case; genders: Set<Gender> }
	>();
	for (const { analysis } of cells) {
		if (analysis.kind !== "case") continue;
		const id = `${analysis.number}|${analysis.case}`;
		const slot = slots.get(id) ?? {
			number: analysis.number,
			c: analysis.case,
			genders: new Set(),
		};
		if (analysis.gender) slot.genders.add(analysis.gender);
		slots.set(id, slot);
	}

	const groups = new Map<
		string,
		{ number: GrammaticalNumber; genders: Array<Gender>; cases: Array<Case> }
	>();
	for (const { number, c, genders } of slots.values()) {
		const sorted = GENDER_ORDER.filter((g) => genders.has(g));
		const id = `${number}|${sorted.join("")}`;
		const group = groups.get(id) ?? { number, genders: sorted, cases: [] };
		group.cases.push(c);
		groups.set(id, group);
	}

	return [...groups.values()]
		.map((group) => ({
			...group,
			cases: CASES.filter((c) => group.cases.includes(c)),
		}))
		.sort(
			(a, b) =>
				(a.number === b.number ? 0 : a.number === "singular" ? -1 : 1) ||
				CASES.indexOf(a.cases[0]) - CASES.indexOf(b.cases[0]),
		)
		.map(({ number, genders, cases }) => {
			const gender = genderLabel(genders);
			return {
				short: [
					cases.map((c) => CASE_SHORT[c]).join("/"),
					NUMBER_LABELS[number].short,
					gender?.short,
				]
					.filter(Boolean)
					.join(" "),
				full: [cases.join(" or "), NUMBER_LABELS[number].full, gender?.full]
					.filter(Boolean)
					.join(" "),
			};
		});
}

function verbLabel({ analysis }: Cell): Label | null {
	if (analysis.kind === "finite") {
		const { person, tense, mood, voice } = analysis;
		const rest = `${TENSE_LABELS[tense].en} ${mood} ${voice}`;
		return {
			short: `${PERSON_LABELS[person].short} ${rest}`,
			full: `${PERSON_LABELS[person].full} ${rest}`,
		};
	}
	if (analysis.kind === "infinitive") {
		const text = `${analysis.tense} ${analysis.voice} infinitive`;
		return { short: text, full: text };
	}
	return null;
}

/** The cells a query matched in one entry, one line per spelling. */
export function describe(cells: Array<Cell>): Array<FormLine> {
	const bySpelling = new Map<string, Array<Cell>>();
	for (const cell of cells) {
		bySpelling.set(cell.form, [...(bySpelling.get(cell.form) ?? []), cell]);
	}

	return [...bySpelling].map(([form, matched]) => {
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
		return { form, labels: unique };
	});
}
