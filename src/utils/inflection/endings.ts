// The one ending inventory: the grammar pages print these, scripts/check-conjugations.ts
// holds the paradigms to them, and the forms search (vault/forms.md) builds every form from them.

import type {
	ConjugationEndings,
	RegularConjugation,
} from "#/components/conjugations/Conjugations.utils";
import type { Case } from "#/components/declensions/Declensions.utils";

/**
 * The endings sheet, thematic vowel included, the way the declension sheet
 * prints -ae and -ārum: salūt- + -ās, aud- + -īs. Hyphenated because the page
 * prints them that way; the check strips the hyphen.
 */
export const ENDINGS: Record<RegularConjugation, ConjugationEndings> = {
	"1": {
		indicative: {
			active: {
				present: {
					"1sg": "-ō",
					"2sg": "-ās",
					"3sg": "-at",
					"1pl": "-āmus",
					"2pl": "-ātis",
					"3pl": "-ant",
				},
				imperfect: {
					"1sg": "-ābam",
					"2sg": "-ābās",
					"3sg": "-ābat",
					"1pl": "-ābāmus",
					"2pl": "-ābātis",
					"3pl": "-ābant",
				},
				future: {
					"1sg": "-ābō",
					"2sg": "-ābis",
					"3sg": "-ābit",
					"1pl": "-ābimus",
					"2pl": "-ābitis",
					"3pl": "-ābunt",
				},
			},
		},
		subjunctive: {
			active: {
				present: {
					"1sg": "-em",
					"2sg": "-ēs",
					"3sg": "-et",
					"1pl": "-ēmus",
					"2pl": "-ētis",
					"3pl": "-ent",
				},
				imperfect: {
					"1sg": "-ārem",
					"2sg": "-ārēs",
					"3sg": "-āret",
					"1pl": "-ārēmus",
					"2pl": "-ārētis",
					"3pl": "-ārent",
				},
			},
		},
	},
	"2": {
		indicative: {
			active: {
				present: {
					"1sg": "-eō",
					"2sg": "-ēs",
					"3sg": "-et",
					"1pl": "-ēmus",
					"2pl": "-ētis",
					"3pl": "-ent",
				},
				imperfect: {
					"1sg": "-ēbam",
					"2sg": "-ēbās",
					"3sg": "-ēbat",
					"1pl": "-ēbāmus",
					"2pl": "-ēbātis",
					"3pl": "-ēbant",
				},
				future: {
					"1sg": "-ēbō",
					"2sg": "-ēbis",
					"3sg": "-ēbit",
					"1pl": "-ēbimus",
					"2pl": "-ēbitis",
					"3pl": "-ēbunt",
				},
			},
		},
		subjunctive: {
			active: {
				present: {
					"1sg": "-eam",
					"2sg": "-eās",
					"3sg": "-eat",
					"1pl": "-eāmus",
					"2pl": "-eātis",
					"3pl": "-eant",
				},
				imperfect: {
					"1sg": "-ērem",
					"2sg": "-ērēs",
					"3sg": "-ēret",
					"1pl": "-ērēmus",
					"2pl": "-ērētis",
					"3pl": "-ērent",
				},
			},
		},
	},
	"3": {
		indicative: {
			active: {
				present: {
					"1sg": "-ō",
					"2sg": "-is",
					"3sg": "-it",
					"1pl": "-imus",
					"2pl": "-itis",
					"3pl": "-unt",
				},
				imperfect: {
					"1sg": "-ēbam",
					"2sg": "-ēbās",
					"3sg": "-ēbat",
					"1pl": "-ēbāmus",
					"2pl": "-ēbātis",
					"3pl": "-ēbant",
				},
				future: {
					"1sg": "-am",
					"2sg": "-ēs",
					"3sg": "-et",
					"1pl": "-ēmus",
					"2pl": "-ētis",
					"3pl": "-ent",
				},
			},
		},
		subjunctive: {
			active: {
				present: {
					"1sg": "-am",
					"2sg": "-ās",
					"3sg": "-at",
					"1pl": "-āmus",
					"2pl": "-ātis",
					"3pl": "-ant",
				},
				imperfect: {
					"1sg": "-erem",
					"2sg": "-erēs",
					"3sg": "-eret",
					"1pl": "-erēmus",
					"2pl": "-erētis",
					"3pl": "-erent",
				},
			},
		},
	},
	"4": {
		indicative: {
			active: {
				present: {
					"1sg": "-iō",
					"2sg": "-īs",
					"3sg": "-it",
					"1pl": "-īmus",
					"2pl": "-ītis",
					"3pl": "-iunt",
				},
				imperfect: {
					"1sg": "-iēbam",
					"2sg": "-iēbās",
					"3sg": "-iēbat",
					"1pl": "-iēbāmus",
					"2pl": "-iēbātis",
					"3pl": "-iēbant",
				},
				future: {
					"1sg": "-iam",
					"2sg": "-iēs",
					"3sg": "-iet",
					"1pl": "-iēmus",
					"2pl": "-iētis",
					"3pl": "-ient",
				},
			},
		},
		subjunctive: {
			active: {
				present: {
					"1sg": "-iam",
					"2sg": "-iās",
					"3sg": "-iat",
					"1pl": "-iāmus",
					"2pl": "-iātis",
					"3pl": "-iant",
				},
				imperfect: {
					"1sg": "-īrem",
					"2sg": "-īrēs",
					"3sg": "-īret",
					"1pl": "-īrēmus",
					"2pl": "-īrētis",
					"3pl": "-īrent",
				},
			},
		},
	},
	"3io": {
		indicative: {
			active: {
				present: {
					"1sg": "-iō",
					"2sg": "-is",
					"3sg": "-it",
					"1pl": "-imus",
					"2pl": "-itis",
					"3pl": "-iunt",
				},
				imperfect: {
					"1sg": "-iēbam",
					"2sg": "-iēbās",
					"3sg": "-iēbat",
					"1pl": "-iēbāmus",
					"2pl": "-iēbātis",
					"3pl": "-iēbant",
				},
				future: {
					"1sg": "-iam",
					"2sg": "-iēs",
					"3sg": "-iet",
					"1pl": "-iēmus",
					"2pl": "-iētis",
					"3pl": "-ient",
				},
			},
		},
		subjunctive: {
			active: {
				present: {
					"1sg": "-iam",
					"2sg": "-iās",
					"3sg": "-iat",
					"1pl": "-iāmus",
					"2pl": "-iātis",
					"3pl": "-iant",
				},
				imperfect: {
					"1sg": "-erem",
					"2sg": "-erēs",
					"3sg": "-eret",
					"1pl": "-erēmus",
					"2pl": "-erētis",
					"3pl": "-erent",
				},
			},
		},
	},
};

/**
 * The perfect system has one set of endings for every verb, so it is kept
 * apart from ENDINGS. " / " separates a genuine alternative, as in the cell.
 */
export const PERFECT_ENDINGS: ConjugationEndings = {
	indicative: {
		active: {
			perfect: {
				"1sg": "-ī",
				"2sg": "-istī",
				"3sg": "-it",
				"1pl": "-imus",
				"2pl": "-istis",
				"3pl": "-ērunt / -ēre",
			},
			pluperfect: {
				"1sg": "-eram",
				"2sg": "-erās",
				"3sg": "-erat",
				"1pl": "-erāmus",
				"2pl": "-erātis",
				"3pl": "-erant",
			},
			// Short i in -eris, -erimus, -eritis, against the perfect subjunctive's
			// -erīs, following Allen & Greenough; Roman usage mixed the two.
			futurePerfect: {
				"1sg": "-erō",
				"2sg": "-eris",
				"3sg": "-erit",
				"1pl": "-erimus",
				"2pl": "-eritis",
				"3pl": "-erint",
			},
		},
	},
	subjunctive: {
		active: {
			perfect: {
				"1sg": "-erim",
				"2sg": "-erīs",
				"3sg": "-erit",
				"1pl": "-erīmus",
				"2pl": "-erītis",
				"3pl": "-erint",
			},
			pluperfect: {
				"1sg": "-issem",
				"2sg": "-issēs",
				"3sg": "-isset",
				"1pl": "-issēmus",
				"2pl": "-issētis",
				"3pl": "-issent",
			},
		},
	},
};

/**
 * The whole page on two grids. The vocative is left out because it is the
 * nominative again everywhere but one cell, and null is the third declension
 * nominative singular, which has no ending of its own at all — the component
 * prints a dash and the prose underneath says why.
 */
export type DeclensionEndingRow = {
	grammaticalCase: Case;
	first: string;
	second: string;
	third: string | null;
	fourth: string;
	fifth: string;
};

export const SINGULAR_ENDINGS: DeclensionEndingRow[] = [
	{
		grammaticalCase: "nominative",
		first: "-a",
		second: "-us",
		third: null,
		fourth: "-us",
		fifth: "-ēs",
	},
	{
		grammaticalCase: "genitive",
		first: "-ae",
		second: "-ī",
		third: "-is",
		fourth: "-ūs",
		fifth: "-eī",
	},
	{
		grammaticalCase: "dative",
		first: "-ae",
		second: "-ō",
		third: "-ī",
		fourth: "-uī",
		fifth: "-eī",
	},
	{
		grammaticalCase: "accusative",
		first: "-am",
		second: "-um",
		third: "-em",
		fourth: "-um",
		fifth: "-em",
	},
	{
		grammaticalCase: "ablative",
		first: "-ā",
		second: "-ō",
		third: "-e",
		fourth: "-ū",
		fifth: "-ē",
	},
];

export const PLURAL_ENDINGS: DeclensionEndingRow[] = [
	{
		grammaticalCase: "nominative",
		first: "-ae",
		second: "-ī",
		third: "-ēs",
		fourth: "-ūs",
		fifth: "-ēs",
	},
	{
		grammaticalCase: "genitive",
		first: "-ārum",
		second: "-ōrum",
		third: "-um / -ium",
		fourth: "-uum",
		fifth: "-ērum",
	},
	{
		grammaticalCase: "dative",
		first: "-īs",
		second: "-īs",
		third: "-ibus",
		fourth: "-ibus",
		fifth: "-ēbus",
	},
	{
		grammaticalCase: "accusative",
		first: "-ās",
		second: "-ōs",
		third: "-ēs",
		fourth: "-ūs",
		fifth: "-ēs",
	},
	{
		grammaticalCase: "ablative",
		first: "-īs",
		second: "-īs",
		third: "-ibus",
		fourth: "-ibus",
		fifth: "-ēbus",
	},
];
