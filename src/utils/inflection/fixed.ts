/**
 * Words that are not stem + ending, keyed the way fullTableFor is (a verb by
 * lemma and infinitive): the pages' own tables, so a table added there is
 * searchable with nothing else to do.
 */
import type { AdjectiveCase } from "#/components/declensions/Adjectives.utils";
import type { Form } from "#/components/declensions/Declensions.utils";
import { IRREGULAR_VERBS } from "#/components/irregular-verbs/IrregularVerbs.utils";
import { DECLENSIONS as NUMBER_DECLENSIONS } from "#/components/numbers/NumberTheory.utils";
import {
	DECLINED_LIKE,
	type GenderedPronoun,
	PERSONAL,
	PRONOMINAL_ADJECTIVES,
	PRONOMINAL_COMPOUNDS,
	PRONOUNS,
} from "#/components/pronouns/Pronouns.utils";
import type { Gender } from "#/utils/entries/rules";
import { firstSecond } from "./adjectives";
import {
	type Cell,
	type Filing,
	firstForm,
	type GrammaticalNumber,
	type Inflection,
	partsOf,
} from "./types";
import { compoundInflection, tableInflection } from "./verbs";

const NUMBERS: Array<GrammaticalNumber> = ["singular", "plural"];
const GENDERS: Array<Gender> = ["m", "f", "n"];

const altsOf = (alt: Form["alt"]) =>
	alt === undefined ? [] : typeof alt === "string" ? [alt] : [...alt];

function push(
	cells: Array<Cell>,
	{ form, alt }: Form,
	analysis: Cell["analysis"],
) {
	cells.push({ form, analysis });
	for (const other of altsOf(alt))
		cells.push({ form: other, analysis, variant: true });
}

/** Every form is a key: there is no stem to find them by. */
function fixed(build: () => Array<Cell>): Inflection {
	const cells = build();
	return { stems: [...new Set(cells.map((c) => c.form))], cells: () => cells };
}

function genderedCells(
	table: GenderedPronoun,
	restem?: (form: string) => string | null,
) {
	const cells: Array<Cell> = [];
	for (const number of NUMBERS) {
		for (const [c, genders] of Object.entries(table[number])) {
			for (const gender of GENDERS) {
				const cell = genders[gender];
				const form = restem ? restem(cell.form) : cell.form;
				if (form === null) continue;
				const alt = restem
					? altsOf(cell.alt).flatMap((a) => restem(a) ?? [])
					: cell.alt;
				push(
					cells,
					{ form, alt },
					{ kind: "case", case: c as AdjectiveCase, number, gender },
				);
			}
		}
	}
	return cells;
}

const DECLINED = new Map<string, () => Inflection | null>();
const add = (lemma: string, build: () => Inflection | null) => {
	if (!DECLINED.has(lemma)) DECLINED.set(lemma, build);
};

for (const table of PRONOUNS) {
	add(firstForm(table.lemma), () => fixed(() => genderedCells(table)));
}

for (const pronoun of PERSONAL) {
	add(firstForm(pronoun.lemma), () =>
		fixed(() => {
			const cells: Array<Cell> = [];
			for (const number of NUMBERS) {
				for (const [c, cell] of Object.entries(pronoun[number])) {
					if (cell)
						push(cells, cell, {
							kind: "case",
							case: c as AdjectiveCase,
							number,
						});
				}
			}
			return cells;
		}),
	);
}

// tuus on meus's table: me- becomes tu-, and meus itself the filed tuus.
for (const word of DECLINED_LIKE) {
	const like = PRONOUNS.find((t) => t.id === word.like);
	const [nominative, feminine] = word.lemma.split(", ");
	const from = like?.pattern?.stem;
	if (!like || !from || !feminine?.endsWith("a")) continue;
	const to = feminine.slice(0, -1);
	const likeNominative = firstForm(like.lemma);
	add(nominative, () =>
		fixed(() =>
			genderedCells(like, (form) =>
				form === likeNominative
					? nominative
					: form.startsWith(from)
						? to + form.slice(from.length)
						: null,
			),
		),
	);
}

// ūnus, nūllus and the rest: bonus, with the -īus genitive and -ī dative the page lists.
for (const { lemma, genitive, dative } of PRONOMINAL_ADJECTIVES) {
	add(firstForm(lemma), () => firstSecond(lemma, { genitive, dative }));
}

// uterque is uter with -que on every form.
for (const compound of PRONOMINAL_COMPOUNDS) {
	const lemma = firstForm(compound);
	const base = PRONOMINAL_ADJECTIVES.find(
		({ lemma: l }) => `${firstForm(l)}que` === lemma,
	);
	if (!base) continue;
	add(lemma, () => {
		const inflection = firstSecond(base.lemma, base);
		return (
			inflection &&
			fixed(() =>
				inflection.cells().map((c) => ({ ...c, form: `${c.form}que` })),
			)
		);
	});
}

// duo and trēs, from the numbers page: "duo, duae, duo" is m, f, n; "trēs, tria" is m/f, n.
for (const [key, lemma] of [
	["two", "duo"],
	["three", "trēs"],
] as const) {
	add(lemma, () =>
		fixed(() => {
			const cells: Array<Cell> = [];
			for (const row of NUMBER_DECLENSIONS) {
				const c = row.grammaticalCase.toLowerCase() as AdjectiveCase;
				const forms = row[key].split(", ");
				const byGender: Record<Gender, string | undefined> =
					forms.length === 3
						? { m: forms[0], f: forms[1], n: forms[2] }
						: forms.length === 2
							? { m: forms[0], f: forms[0], n: forms[1] }
							: { m: forms[0], f: forms[0], n: forms[0] };
				for (const gender of GENDERS) {
					const form = byGender[gender];
					if (form)
						cells.push({
							form,
							analysis: { kind: "case", case: c, number: "plural", gender },
						});
				}
			}
			return cells;
		}),
	);
}

/**
 * By lemma and infinitive, so volō, velle has the table and volō, volāre
 * (to fly) the rules. Then a compound: afferō, abeō, prōsum.
 */
function conjugated(filing: Filing) {
	const { lemma } = filing;
	const [, infinitive] = partsOf(filing.principalParts);
	const own = IRREGULAR_VERBS.find(
		({ principalParts: [l, i] }) => l === lemma && i === infinitive,
	);
	if (own) return fixed(() => tableInflection(own).cells());
	const base = IRREGULAR_VERBS.find(
		({ principalParts: [l, i] }) =>
			lemma.endsWith(l) && lemma !== l && infinitive?.endsWith(i),
	);
	return base ? compoundInflection(filing, base) : undefined;
}

/** A table for this word, or undefined when the rules apply. */
export function fixedInflection(filing: Filing) {
	const { lemma, partOfSpeech } = filing;
	if (partOfSpeech === "verb") return conjugated(filing);
	if (
		partOfSpeech === "pronoun" ||
		partOfSpeech === "adjective" ||
		partOfSpeech === "numeral"
	) {
		return DECLINED.get(lemma)?.();
	}
	return undefined;
}
