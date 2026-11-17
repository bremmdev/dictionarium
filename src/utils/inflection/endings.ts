// The one ending inventory: the grammar pages print these, scripts/check-conjugations.ts
// holds the paradigms to them, and the forms search (vault/forms.md) builds every form from them.

import type {
	ConjugationEndings,
	ImperativePerson,
	RegularConjugation,
	Voice,
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
			passive: {
				present: {
					"1sg": "-or",
					"2sg": "-āris / -āre",
					"3sg": "-ātur",
					"1pl": "-āmur",
					"2pl": "-āminī",
					"3pl": "-antur",
				},
				imperfect: {
					"1sg": "-ābar",
					"2sg": "-ābāris / -ābāre",
					"3sg": "-ābātur",
					"1pl": "-ābāmur",
					"2pl": "-ābāminī",
					"3pl": "-ābantur",
				},
				future: {
					"1sg": "-ābor",
					"2sg": "-āberis / -ābere",
					"3sg": "-ābitur",
					"1pl": "-ābimur",
					"2pl": "-ābiminī",
					"3pl": "-ābuntur",
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
			passive: {
				present: {
					"1sg": "-er",
					"2sg": "-ēris / -ēre",
					"3sg": "-ētur",
					"1pl": "-ēmur",
					"2pl": "-ēminī",
					"3pl": "-entur",
				},
				imperfect: {
					"1sg": "-ārer",
					"2sg": "-ārēris / -ārēre",
					"3sg": "-ārētur",
					"1pl": "-ārēmur",
					"2pl": "-ārēminī",
					"3pl": "-ārentur",
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
			passive: {
				present: {
					"1sg": "-eor",
					"2sg": "-ēris / -ēre",
					"3sg": "-ētur",
					"1pl": "-ēmur",
					"2pl": "-ēminī",
					"3pl": "-entur",
				},
				imperfect: {
					"1sg": "-ēbar",
					"2sg": "-ēbāris / -ēbāre",
					"3sg": "-ēbātur",
					"1pl": "-ēbāmur",
					"2pl": "-ēbāminī",
					"3pl": "-ēbantur",
				},
				future: {
					"1sg": "-ēbor",
					"2sg": "-ēberis / -ēbere",
					"3sg": "-ēbitur",
					"1pl": "-ēbimur",
					"2pl": "-ēbiminī",
					"3pl": "-ēbuntur",
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
			passive: {
				present: {
					"1sg": "-ear",
					"2sg": "-eāris / -eāre",
					"3sg": "-eātur",
					"1pl": "-eāmur",
					"2pl": "-eāminī",
					"3pl": "-eantur",
				},
				imperfect: {
					"1sg": "-ērer",
					"2sg": "-ērēris / -ērēre",
					"3sg": "-ērētur",
					"1pl": "-ērēmur",
					"2pl": "-ērēminī",
					"3pl": "-ērentur",
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
			passive: {
				present: {
					"1sg": "-or",
					"2sg": "-eris / -ere",
					"3sg": "-itur",
					"1pl": "-imur",
					"2pl": "-iminī",
					"3pl": "-untur",
				},
				imperfect: {
					"1sg": "-ēbar",
					"2sg": "-ēbāris / -ēbāre",
					"3sg": "-ēbātur",
					"1pl": "-ēbāmur",
					"2pl": "-ēbāminī",
					"3pl": "-ēbantur",
				},
				future: {
					"1sg": "-ar",
					"2sg": "-ēris / -ēre",
					"3sg": "-ētur",
					"1pl": "-ēmur",
					"2pl": "-ēminī",
					"3pl": "-entur",
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
			passive: {
				present: {
					"1sg": "-ar",
					"2sg": "-āris / -āre",
					"3sg": "-ātur",
					"1pl": "-āmur",
					"2pl": "-āminī",
					"3pl": "-antur",
				},
				imperfect: {
					"1sg": "-erer",
					"2sg": "-erēris / -erēre",
					"3sg": "-erētur",
					"1pl": "-erēmur",
					"2pl": "-erēminī",
					"3pl": "-erentur",
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
			passive: {
				present: {
					"1sg": "-ior",
					"2sg": "-īris / -īre",
					"3sg": "-ītur",
					"1pl": "-īmur",
					"2pl": "-īminī",
					"3pl": "-iuntur",
				},
				imperfect: {
					"1sg": "-iēbar",
					"2sg": "-iēbāris / -iēbāre",
					"3sg": "-iēbātur",
					"1pl": "-iēbāmur",
					"2pl": "-iēbāminī",
					"3pl": "-iēbantur",
				},
				future: {
					"1sg": "-iar",
					"2sg": "-iēris / -iēre",
					"3sg": "-iētur",
					"1pl": "-iēmur",
					"2pl": "-iēminī",
					"3pl": "-ientur",
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
			passive: {
				present: {
					"1sg": "-iar",
					"2sg": "-iāris / -iāre",
					"3sg": "-iātur",
					"1pl": "-iāmur",
					"2pl": "-iāminī",
					"3pl": "-iantur",
				},
				imperfect: {
					"1sg": "-īrer",
					"2sg": "-īrēris / -īrēre",
					"3sg": "-īrētur",
					"1pl": "-īrēmur",
					"2pl": "-īrēminī",
					"3pl": "-īrentur",
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
			passive: {
				present: {
					"1sg": "-ior",
					"2sg": "-eris / -ere",
					"3sg": "-itur",
					"1pl": "-imur",
					"2pl": "-iminī",
					"3pl": "-iuntur",
				},
				imperfect: {
					"1sg": "-iēbar",
					"2sg": "-iēbāris / -iēbāre",
					"3sg": "-iēbātur",
					"1pl": "-iēbāmur",
					"2pl": "-iēbāminī",
					"3pl": "-iēbantur",
				},
				future: {
					"1sg": "-iar",
					"2sg": "-iēris / -iēre",
					"3sg": "-iētur",
					"1pl": "-iēmur",
					"2pl": "-iēminī",
					"3pl": "-ientur",
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
			passive: {
				present: {
					"1sg": "-iar",
					"2sg": "-iāris / -iāre",
					"3sg": "-iātur",
					"1pl": "-iāmur",
					"2pl": "-iāminī",
					"3pl": "-iantur",
				},
				imperfect: {
					"1sg": "-erer",
					"2sg": "-erēris / -erēre",
					"3sg": "-erētur",
					"1pl": "-erēmur",
					"2pl": "-erēminī",
					"3pl": "-erentur",
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
 * The perfect passive is two words: the participle (-us, or -ī in the plural)
 * and this tense of sum. salūtātus sum, salūtātī erant.
 */
export const PERFECT_PASSIVE_AUXILIARY = {
	indicative: {
		perfect: "present",
		pluperfect: "imperfect",
		futurePerfect: "future",
	},
	subjunctive: { perfect: "present", pluperfect: "imperfect" },
} as const;

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

export const IMPERATIVE_PERSONS: ReadonlyArray<ImperativePerson> = [
	"2sg",
	"3sg",
	"2pl",
	"3pl",
];
type ImperativeRow = Partial<Record<ImperativePerson, string>>;

/** Everything but the finite tenses that is built on the present stem. */
export type NonFiniteEndings = {
	infinitive: { active: string; passive: string };
	imperative: Record<Voice, { present: ImperativeRow; future: ImperativeRow }>;
	/** Nominative and genitive, declined like a one-termination adjective. */
	presentParticiple: string;
	/** Masculine, feminine, neuter, declined like bonus. */
	gerundive: string;
	/** The genitive: the dative and ablative end in -ō, the accusative in -um. */
	gerund: string;
};

export const NON_FINITE: Record<RegularConjugation, NonFiniteEndings> = {
	"1": {
		infinitive: { active: "-āre", passive: "-ārī" },
		imperative: {
			active: {
				present: { "2sg": "-ā", "2pl": "-āte" },
				future: {
					"2sg": "-ātō",
					"3sg": "-ātō",
					"2pl": "-ātōte",
					"3pl": "-antō",
				},
			},
			passive: {
				present: { "2sg": "-āre", "2pl": "-āminī" },
				future: { "2sg": "-ātor", "3sg": "-ātor", "3pl": "-antor" },
			},
		},
		presentParticiple: "-āns, -antis",
		gerundive: "-andus, -anda, -andum",
		gerund: "-andī",
	},
	"2": {
		infinitive: { active: "-ēre", passive: "-ērī" },
		imperative: {
			active: {
				present: { "2sg": "-ē", "2pl": "-ēte" },
				future: {
					"2sg": "-ētō",
					"3sg": "-ētō",
					"2pl": "-ētōte",
					"3pl": "-entō",
				},
			},
			passive: {
				present: { "2sg": "-ēre", "2pl": "-ēminī" },
				future: { "2sg": "-ētor", "3sg": "-ētor", "3pl": "-entor" },
			},
		},
		presentParticiple: "-ēns, -entis",
		gerundive: "-endus, -enda, -endum",
		gerund: "-endī",
	},
	"3": {
		infinitive: { active: "-ere", passive: "-ī" },
		imperative: {
			active: {
				present: { "2sg": "-e", "2pl": "-ite" },
				future: {
					"2sg": "-itō",
					"3sg": "-itō",
					"2pl": "-itōte",
					"3pl": "-untō",
				},
			},
			passive: {
				present: { "2sg": "-ere", "2pl": "-iminī" },
				future: { "2sg": "-itor", "3sg": "-itor", "3pl": "-untor" },
			},
		},
		presentParticiple: "-ēns, -entis",
		gerundive: "-endus, -enda, -endum",
		gerund: "-endī",
	},
	"4": {
		infinitive: { active: "-īre", passive: "-īrī" },
		imperative: {
			active: {
				present: { "2sg": "-ī", "2pl": "-īte" },
				future: {
					"2sg": "-ītō",
					"3sg": "-ītō",
					"2pl": "-ītōte",
					"3pl": "-iuntō",
				},
			},
			passive: {
				present: { "2sg": "-īre", "2pl": "-īminī" },
				future: { "2sg": "-ītor", "3sg": "-ītor", "3pl": "-iuntor" },
			},
		},
		presentParticiple: "-iēns, -ientis",
		gerundive: "-iendus, -ienda, -iendum",
		gerund: "-iendī",
	},
	"3io": {
		infinitive: { active: "-ere", passive: "-ī" },
		imperative: {
			active: {
				present: { "2sg": "-e", "2pl": "-ite" },
				future: {
					"2sg": "-itō",
					"3sg": "-itō",
					"2pl": "-itōte",
					"3pl": "-iuntō",
				},
			},
			passive: {
				present: { "2sg": "-ere", "2pl": "-iminī" },
				future: { "2sg": "-itor", "3sg": "-itor", "3pl": "-iuntor" },
			},
		},
		presentParticiple: "-iēns, -ientis",
		gerundive: "-iendus, -ienda, -iendum",
		gerund: "-iendī",
	},
};

/** On the supine stem (salūtāt-), the same for every conjugation. */
export const SUPINE_ENDINGS = {
	perfectParticiple: "-us, -a, -um",
	futureParticiple: "-ūrus, -ūra, -ūrum",
	supine: "-um / -ū",
} as const;

/** dīc, dūc, fac, fer: the short imperatives, compounds of dīcō and dūcō included. */
export const SHORT_IMPERATIVES: Record<string, string> = {
	dīcō: "dīc",
	dūcō: "dūc",
	faciō: "fac",
};

/** Verbs whose present-system passive is another verb: faciō's is fīō. Compounds in -ficiō are regular. */
export const SUPPLETIVE_PASSIVE = ["faciō"];
