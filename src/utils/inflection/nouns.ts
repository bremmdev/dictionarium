import type { Case } from "#/components/declensions/Declensions.utils";
import {
	type DeclensionEndingRow,
	PLURAL_ENDINGS,
	SINGULAR_ENDINGS,
} from "./endings";
import {
	type Cell,
	endingsOf,
	type Filing,
	type GrammaticalNumber,
	type Inflection,
	partsOf,
} from "./types";

export type Declension = "1" | "2" | "3" | "4" | "5";

const COLUMN: Record<
	Declension,
	Exclude<keyof DeclensionEndingRow, "grammaticalCase">
> = { "1": "first", "2": "second", "3": "third", "4": "fourth", "5": "fifth" };

const isDeclension = (value: string | null): value is Declension =>
	value !== null && value in COLUMN;

/** The endings sheet's cell, split into its alternatives. */
export function sheet(
	number: GrammaticalNumber,
	declension: Declension,
	c: Case,
) {
	const rows = number === "singular" ? SINGULAR_ENDINGS : PLURAL_ENDINGS;
	return endingsOf(
		rows.find((row) => row.grammaticalCase === c)?.[COLUMN[declension]],
	);
}

/** What a nominative has to end in for the rules to apply; the 3rd takes anything. */
const NOMINATIVE: Record<Declension, RegExp> = {
	"1": /a$/,
	"2": /(us|um|er|ir)$/,
	"3": /./,
	"4": /(us|ū)$/,
	"5": /ēs$/,
};

// Closed lists, so no other noun is given a form it does not have.
// biome-ignore format: one list per line
const ABUS = new Set(["dea", "fīlia", "līberta", "nāta", "equa", "mūla", "asina"]);
// biome-ignore format: one list per line
const UBUS = new Set(["lacus", "artus", "partus", "tribus", "arcus", "specus", "portus", "quercus", "veru"]);
const GENITIVE_UM = new Set([
	"vir",
	"līberī",
	"socius",
	"nummus",
	"faber",
	"sēstertius",
]);

type Table = Record<GrammaticalNumber, Partial<Record<Case, Array<string>>>>;

/** Not stem + ending. The first form of each cell is the main one. */
// biome-ignore format: a table reads best one number per line
const TABLES: Record<string, Table> = {
	deus: {
		singular: { nominative: ["deus"], genitive: ["deī"], dative: ["deō"], accusative: ["deum"], ablative: ["deō"], vocative: ["deus", "dee"] },
		plural: { nominative: ["deī", "diī", "dī"], genitive: ["deōrum", "deum"], dative: ["deīs", "diīs", "dīs"], accusative: ["deōs"], ablative: ["deīs", "diīs", "dīs"], vocative: ["deī", "diī", "dī"] },
	},
	domus: {
		singular: { nominative: ["domus"], genitive: ["domūs", "domī"], dative: ["domuī", "domō"], accusative: ["domum"], ablative: ["domō", "domū"], vocative: ["domus"] },
		plural: { nominative: ["domūs"], genitive: ["domuum", "domōrum"], dative: ["domibus"], accusative: ["domōs", "domūs"], ablative: ["domibus"], vocative: ["domūs"] },
	},
	vīs: {
		singular: { nominative: ["vīs"], genitive: ["vīs"], dative: ["vī"], accusative: ["vim"], ablative: ["vī"], vocative: ["vīs"] },
		plural: { nominative: ["vīrēs"], genitive: ["vīrium"], dative: ["vīribus"], accusative: ["vīrēs", "vīrīs"], ablative: ["vīribus"], vocative: ["vīrēs"] },
	},
	bōs: {
		singular: { nominative: ["bōs"], genitive: ["bovis"], dative: ["bovī"], accusative: ["bovem"], ablative: ["bove"], vocative: ["bōs"] },
		plural: { nominative: ["bovēs"], genitive: ["boum", "bovum"], dative: ["bōbus", "būbus"], accusative: ["bovēs"], ablative: ["bōbus", "būbus"], vocative: ["bovēs"] },
	},
	Iuppiter: {
		singular: { nominative: ["Iuppiter"], genitive: ["Iovis"], dative: ["Iovī"], accusative: ["Iovem"], ablative: ["Iove"], vocative: ["Iuppiter"] },
		plural: {},
	},
};

/** Nouns with a table of their own: deus, domus, vīs, bōs, Iuppiter. */
export const IRREGULAR_NOUNS = new Set(Object.keys(TABLES));

function tableCells(table: Table) {
	const cells: Array<Cell> = [];
	for (const number of ["singular", "plural"] as const) {
		for (const [c, forms] of Object.entries(table[number])) {
			forms?.forEach((form, i) => {
				cells.push({
					form,
					analysis: { kind: "case", case: c as Case, number },
					...(i > 0 ? { variant: true as const } : {}),
				});
			});
		}
	}
	return cells;
}

/** The stem, and whether the genitive was filed plural: castra, castrōrum. */
function stemOf(declension: Declension, genitive: string) {
	// Longest first, so moenium gives moen-, not moeni-.
	const endings = (number: GrammaticalNumber) =>
		[
			...sheet(number, declension, "genitive"),
			...(declension === "5" && number === "singular" ? ["ēī"] : []),
		].sort((a, b) => b.length - a.length);

	for (const number of ["plural", "singular"] as const) {
		const ending = endings(number).find((e) => genitive.endsWith(e));
		if (ending && genitive.length > ending.length) {
			return { stem: genitive.slice(0, -ending.length), ending, number };
		}
	}
	return null;
}

export function nounInflection(filing: Filing): Inflection | null {
	const table = TABLES[filing.lemma];
	if (table) {
		const cells = tableCells(table);
		return {
			stems: [...new Set(cells.map((c) => c.form))],
			cells: () => cells,
		};
	}

	const { declension, lemma } = filing;
	const [genitive] = partsOf(filing.principalParts).slice(-1);
	if (!isDeclension(declension) || !genitive) return null;

	const found = stemOf(declension, genitive);
	if (!found) return null;
	const { stem, ending, number: filedNumber } = found;
	const pluralOnly = filedNumber === "plural";
	if (!pluralOnly && !NOMINATIVE[declension].test(lemma)) return null;

	return {
		stems: [stem],
		cells: () =>
			nounCells({
				lemma,
				declension,
				stem,
				genitive,
				ending,
				pluralOnly,
				neuter: filing.gender === "n",
			}),
	};
}

type Parsed = {
	lemma: string;
	declension: Declension;
	stem: string;
	genitive: string;
	/** The ending the genitive was filed with: tells the 5th's -ēī and a plural's i-stem. */
	ending: string;
	pluralOnly: boolean;
	neuter: boolean;
};

function nounCells(p: Parsed): Array<Cell> {
	const { lemma, declension: d, stem, neuter } = p;
	const cells: Array<Cell> = [];
	const add = (
		number: GrammaticalNumber,
		c: Case,
		forms: Array<string>,
		variant = false,
	) => {
		for (const form of forms) {
			cells.push({
				form,
				analysis: { kind: "case", case: c, number },
				...(variant ? { variant: true as const } : {}),
			});
		}
	};
	const on = (endings: Array<string>) => endings.map((e) => stem + e);
	const ends = (number: GrammaticalNumber, c: Case) => sheet(number, d, c);
	// Where i-stems differ, both forms are generated and both marked (vault/forms.md).
	const iStem = (
		number: GrammaticalNumber,
		c: Case,
		consonant: string,
		i: string,
	) => add(number, c, on([consonant, i]), true);

	if (!p.pluralOnly) {
		add("singular", "nominative", [lemma]);

		add("singular", "genitive", [p.genitive]);
		// fīliī, fīlī; cōnsiliī, cōnsilī
		if (d === "2" && stem.endsWith("i")) {
			add("singular", "genitive", [`${stem.slice(0, -1)}ī`], true);
		}

		if (d === "5") add("singular", "dative", on([p.ending]));
		else if (d === "4" && neuter) add("singular", "dative", on(["ū"]));
		else add("singular", "dative", on(ends("singular", "dative")));

		if (neuter) add("singular", "accusative", [lemma]);
		else if (d === "3") iStem("singular", "accusative", "em", "im");
		else add("singular", "accusative", on(ends("singular", "accusative")));

		if (d === "3") iStem("singular", "ablative", "e", "ī");
		else add("singular", "ablative", on(ends("singular", "ablative")));

		if (d === "2" && !neuter && lemma.endsWith("ius")) {
			add("singular", "vocative", [`${stem.slice(0, -1)}ī`]);
		} else if (d === "2" && !neuter && lemma.endsWith("us")) {
			add("singular", "vocative", on(["e"]));
		} else {
			add("singular", "vocative", [lemma]);
		}
	}

	// The nominative plural, which the accusative of a neuter and every vocative repeat.
	const nominative = (c: Case) => {
		if (p.pluralOnly) add("plural", c, [lemma]);
		else if (!neuter) add("plural", c, on(ends("plural", "nominative")));
		else if (d === "3") iStem("plural", c, "a", "ia");
		else add("plural", c, on([d === "4" ? "ua" : "a"]));
	};

	nominative("nominative");

	if (p.pluralOnly) add("plural", "genitive", [p.genitive]);
	else if (d === "3") iStem("plural", "genitive", "um", "ium");
	else add("plural", "genitive", on(ends("plural", "genitive")));
	if (d === "2" && (GENITIVE_UM.has(lemma) || lemma.endsWith("vir"))) {
		add("plural", "genitive", on(["um"]), true);
	}

	for (const c of ["dative", "ablative"] as const) {
		add("plural", c, on(ends("plural", c)));
		if (d === "1" && ABUS.has(lemma)) add("plural", c, on(["ābus"]), true);
		if (d === "4" && UBUS.has(lemma)) add("plural", c, on(["ubus"]), true);
	}

	if (neuter) nominative("accusative");
	else if (d === "3") iStem("plural", "accusative", "ēs", "īs");
	else add("plural", "accusative", on(ends("plural", "accusative")));

	nominative("vocative");

	return cells;
}
