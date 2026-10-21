// Data only — no JSX, so this stays a .ts module, for the same reason as
// Declensions.utils.ts: the components wrap the Latin in <LatinWord>, and the
// prose lives in the .tsx files where it can carry lang="la".
//
// Every form is spelled with its macrons. In the present they are often the
// only difference between two groups: monēre against dūcere, audīs against
// capis. scripts/check-conjugations.ts rebuilds every form from its stem and
// ENDINGS or PERFECT_ENDINGS, so the paradigms and the endings sheet cannot
// disagree.

import type { Conjugation } from "#/utils/entries/rules";

export const PERSONS = ["1sg", "2sg", "3sg", "1pl", "2pl", "3pl"] as const;
export type Person = (typeof PERSONS)[number];

/** Short label for the row header, and the full name a screen reader hears. */
export const PERSON_LABELS: Record<Person, { short: string; full: string }> = {
	"1sg": { short: "1st sg.", full: "first person singular" },
	"2sg": { short: "2nd sg.", full: "second person singular" },
	"3sg": { short: "3rd sg.", full: "third person singular" },
	"1pl": { short: "1st pl.", full: "first person plural" },
	"2pl": { short: "2nd pl.", full: "second person plural" },
	"3pl": { short: "3rd pl.", full: "third person plural" },
};

export const TENSES = [
	"present",
	"imperfect",
	"future",
	"perfect",
	"pluperfect",
	"futurePerfect",
] as const;
export type Tense = (typeof TENSES)[number];

/** The Latin name a table header shows, and the English it is glossed with. */
export const TENSE_LABELS: Record<Tense, { la: string; en: string }> = {
	present: { la: "Praesēns", en: "present" },
	imperfect: { la: "Imperfectum", en: "imperfect" },
	future: { la: "Futūrum", en: "future" },
	perfect: { la: "Perfectum", en: "perfect" },
	// Short for Plūsquamperfectum, which made the column too wide.
	pluperfect: { la: "Plūperfectum", en: "pluperfect" },
	futurePerfect: { la: "Futūrum exāctum", en: "future perfect" },
};

/** Which stem each tense is built on — one table per system on the page. */
export const SYSTEMS = {
	present: ["present", "imperfect", "future"],
	perfect: ["perfect", "pluperfect", "futurePerfect"],
} as const satisfies Record<string, ReadonlyArray<Tense>>;

/** The subjunctive has no future tenses. */
export const MOOD_TENSES = {
	indicative: TENSES,
	subjunctive: ["present", "imperfect", "perfect", "pluperfect"],
} as const satisfies Record<string, ReadonlyArray<Tense>>;

export type Mood = keyof typeof MOOD_TENSES;
export type Voice = "active" | "passive";
type MoodTense<M extends Mood> = (typeof MOOD_TENSES)[M][number];

/** One cell; `alt` is a genuine second form in the same slot. */
export type Form = {
	form: string;
	alt?: string;
	/** Not built from base + ending (dūc), so the derivation check skips it. */
	irregular?: true;
};

export type TenseForms = Record<Person, Form>;

/** Optional at every level: the page fills in tense by tense, and shows only what exists. */
type MoodForms<M extends Mood> = Partial<
	Record<Voice, Partial<Record<MoodTense<M>, TenseForms>>>
>;

export type Verb = {
	/** As the dictionary files them. The first part keys BLURBS and NOTES. */
	principalParts: [
		present: string,
		infinitive: string,
		perfect: string,
		supine: string,
	];
	english: string;
	/** What the endings attach to. The thematic vowel is in ENDINGS, not here. */
	base: string;
	/** The third principal part without its -ī. */
	perfectStem: string;
	indicative: MoodForms<"indicative">;
	subjunctive?: MoodForms<"subjunctive">;
};

export type RegularConjugation = Exclude<Conjugation, "irregular">;

type EndingRow = Record<Person, string>;

type MoodEndings<M extends Mood> = Partial<
	Record<Voice, Partial<Record<MoodTense<M>, EndingRow>>>
>;

export type ConjugationEndings = {
	indicative: MoodEndings<"indicative">;
	subjunctive?: MoodEndings<"subjunctive">;
};

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
	},
};

/**
 * The perfect system has one set of endings for every verb, so it is kept
 * apart from ENDINGS. " / " separates a genuine alternative, as in the cell.
 */
export const PERFECT_ENDINGS: MoodEndings<"indicative"> = {
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
	},
};

/** The personal endings every active tense is built from, and what they mean. */
export const PERSONAL_ENDINGS: Record<
	Person,
	{ ending: string; example: string; english: string }
> = {
	"1sg": { ending: "-ō / -m", example: "salūtō", english: "I greet" },
	"2sg": { ending: "-s", example: "salūtās", english: "you greet" },
	"3sg": { ending: "-t", example: "salūtat", english: "he, she, it greets" },
	"1pl": { ending: "-mus", example: "salūtāmus", english: "we greet" },
	"2pl": { ending: "-tis", example: "salūtātis", english: "you (all) greet" },
	"3pl": { ending: "-nt", example: "salūtant", english: "they greet" },
};

export const PRINCIPAL_PARTS = [
	{
		part: "present",
		example: "salūtō",
		gives:
			"the first person singular present — and, for -iō, whether an -ere verb is third or mixed",
	},
	{
		part: "infinitive",
		example: "salūtāre",
		gives: "the conjugation, and the stem of the present, imperfect and future",
	},
	{
		part: "perfect",
		example: "salūtāvī",
		gives: "the stem of the perfect, pluperfect and future perfect",
	},
	{
		part: "supine",
		example: "salūtātum",
		gives: "the stem of the perfect passive participle",
	},
];

/** How the dictionary entry gives the group away. */
export const CONJUGATION_KEYS: Array<{
	conjugation: string;
	entry: string;
	infinitive: string;
	stemVowel: string | null;
}> = [
	{
		conjugation: "1st",
		entry: "salūtō, salūtāre",
		infinitive: "-āre",
		stemVowel: "ā",
	},
	{
		conjugation: "2nd",
		entry: "moneō, monēre",
		infinitive: "-ēre",
		stemVowel: "ē",
	},
	{
		conjugation: "3rd",
		entry: "dūcō, dūcere",
		infinitive: "-ere",
		stemVowel: null,
	},
	{
		conjugation: "4th",
		entry: "audiō, audīre",
		infinitive: "-īre",
		stemVowel: "ī",
	},
	{
		conjugation: "Mixed",
		entry: "capiō, capere",
		infinitive: "-iō, -ere",
		stemVowel: "i",
	},
];

const SALUTO: Verb = {
	principalParts: ["salūtō", "salūtāre", "salūtāvī", "salūtātum"],
	english: "greet",
	base: "salūt",
	perfectStem: "salūtāv",
	indicative: {
		active: {
			present: {
				"1sg": { form: "salūtō" },
				"2sg": { form: "salūtās" },
				"3sg": { form: "salūtat" },
				"1pl": { form: "salūtāmus" },
				"2pl": { form: "salūtātis" },
				"3pl": { form: "salūtant" },
			},
			imperfect: {
				"1sg": { form: "salūtābam" },
				"2sg": { form: "salūtābās" },
				"3sg": { form: "salūtābat" },
				"1pl": { form: "salūtābāmus" },
				"2pl": { form: "salūtābātis" },
				"3pl": { form: "salūtābant" },
			},
			future: {
				"1sg": { form: "salūtābō" },
				"2sg": { form: "salūtābis" },
				"3sg": { form: "salūtābit" },
				"1pl": { form: "salūtābimus" },
				"2pl": { form: "salūtābitis" },
				"3pl": { form: "salūtābunt" },
			},
			perfect: {
				"1sg": { form: "salūtāvī" },
				"2sg": { form: "salūtāvistī" },
				"3sg": { form: "salūtāvit" },
				"1pl": { form: "salūtāvimus" },
				"2pl": { form: "salūtāvistis" },
				"3pl": { form: "salūtāvērunt", alt: "salūtāvēre" },
			},
			pluperfect: {
				"1sg": { form: "salūtāveram" },
				"2sg": { form: "salūtāverās" },
				"3sg": { form: "salūtāverat" },
				"1pl": { form: "salūtāverāmus" },
				"2pl": { form: "salūtāverātis" },
				"3pl": { form: "salūtāverant" },
			},
		},
	},
};

const MONEO: Verb = {
	principalParts: ["moneō", "monēre", "monuī", "monitum"],
	english: "warn, advise",
	base: "mon",
	perfectStem: "monu",
	indicative: {
		active: {
			present: {
				"1sg": { form: "moneō" },
				"2sg": { form: "monēs" },
				"3sg": { form: "monet" },
				"1pl": { form: "monēmus" },
				"2pl": { form: "monētis" },
				"3pl": { form: "monent" },
			},
			imperfect: {
				"1sg": { form: "monēbam" },
				"2sg": { form: "monēbās" },
				"3sg": { form: "monēbat" },
				"1pl": { form: "monēbāmus" },
				"2pl": { form: "monēbātis" },
				"3pl": { form: "monēbant" },
			},
			future: {
				"1sg": { form: "monēbō" },
				"2sg": { form: "monēbis" },
				"3sg": { form: "monēbit" },
				"1pl": { form: "monēbimus" },
				"2pl": { form: "monēbitis" },
				"3pl": { form: "monēbunt" },
			},
			perfect: {
				"1sg": { form: "monuī" },
				"2sg": { form: "monuistī" },
				"3sg": { form: "monuit" },
				"1pl": { form: "monuimus" },
				"2pl": { form: "monuistis" },
				"3pl": { form: "monuērunt", alt: "monuēre" },
			},
			pluperfect: {
				"1sg": { form: "monueram" },
				"2sg": { form: "monuerās" },
				"3sg": { form: "monuerat" },
				"1pl": { form: "monuerāmus" },
				"2pl": { form: "monuerātis" },
				"3pl": { form: "monuerant" },
			},
		},
	},
};

const DUCO: Verb = {
	principalParts: ["dūcō", "dūcere", "dūxī", "ductum"],
	english: "lead",
	base: "dūc",
	perfectStem: "dūx",
	indicative: {
		active: {
			present: {
				"1sg": { form: "dūcō" },
				"2sg": { form: "dūcis" },
				"3sg": { form: "dūcit" },
				"1pl": { form: "dūcimus" },
				"2pl": { form: "dūcitis" },
				"3pl": { form: "dūcunt" },
			},
			imperfect: {
				"1sg": { form: "dūcēbam" },
				"2sg": { form: "dūcēbās" },
				"3sg": { form: "dūcēbat" },
				"1pl": { form: "dūcēbāmus" },
				"2pl": { form: "dūcēbātis" },
				"3pl": { form: "dūcēbant" },
			},
			future: {
				"1sg": { form: "dūcam" },
				"2sg": { form: "dūcēs" },
				"3sg": { form: "dūcet" },
				"1pl": { form: "dūcēmus" },
				"2pl": { form: "dūcētis" },
				"3pl": { form: "dūcent" },
			},
			perfect: {
				"1sg": { form: "dūxī" },
				"2sg": { form: "dūxistī" },
				"3sg": { form: "dūxit" },
				"1pl": { form: "dūximus" },
				"2pl": { form: "dūxistis" },
				"3pl": { form: "dūxērunt", alt: "dūxēre" },
			},
			pluperfect: {
				"1sg": { form: "dūxeram" },
				"2sg": { form: "dūxerās" },
				"3sg": { form: "dūxerat" },
				"1pl": { form: "dūxerāmus" },
				"2pl": { form: "dūxerātis" },
				"3pl": { form: "dūxerant" },
			},
		},
	},
};

const AUDIO: Verb = {
	principalParts: ["audiō", "audīre", "audīvī", "audītum"],
	english: "hear",
	base: "aud",
	perfectStem: "audīv",
	indicative: {
		active: {
			present: {
				"1sg": { form: "audiō" },
				"2sg": { form: "audīs" },
				"3sg": { form: "audit" },
				"1pl": { form: "audīmus" },
				"2pl": { form: "audītis" },
				"3pl": { form: "audiunt" },
			},
			imperfect: {
				"1sg": { form: "audiēbam" },
				"2sg": { form: "audiēbās" },
				"3sg": { form: "audiēbat" },
				"1pl": { form: "audiēbāmus" },
				"2pl": { form: "audiēbātis" },
				"3pl": { form: "audiēbant" },
			},
			future: {
				"1sg": { form: "audiam" },
				"2sg": { form: "audiēs" },
				"3sg": { form: "audiet" },
				"1pl": { form: "audiēmus" },
				"2pl": { form: "audiētis" },
				"3pl": { form: "audient" },
			},
			perfect: {
				"1sg": { form: "audīvī" },
				"2sg": { form: "audīvistī" },
				"3sg": { form: "audīvit" },
				"1pl": { form: "audīvimus" },
				"2pl": { form: "audīvistis" },
				"3pl": { form: "audīvērunt", alt: "audīvēre" },
			},
			pluperfect: {
				"1sg": { form: "audīveram" },
				"2sg": { form: "audīverās" },
				"3sg": { form: "audīverat" },
				"1pl": { form: "audīverāmus" },
				"2pl": { form: "audīverātis" },
				"3pl": { form: "audīverant" },
			},
		},
	},
};

const CAPIO: Verb = {
	principalParts: ["capiō", "capere", "cēpī", "captum"],
	english: "take, seize",
	base: "cap",
	perfectStem: "cēp",
	indicative: {
		active: {
			present: {
				"1sg": { form: "capiō" },
				"2sg": { form: "capis" },
				"3sg": { form: "capit" },
				"1pl": { form: "capimus" },
				"2pl": { form: "capitis" },
				"3pl": { form: "capiunt" },
			},
			imperfect: {
				"1sg": { form: "capiēbam" },
				"2sg": { form: "capiēbās" },
				"3sg": { form: "capiēbat" },
				"1pl": { form: "capiēbāmus" },
				"2pl": { form: "capiēbātis" },
				"3pl": { form: "capiēbant" },
			},
			future: {
				"1sg": { form: "capiam" },
				"2sg": { form: "capiēs" },
				"3sg": { form: "capiet" },
				"1pl": { form: "capiēmus" },
				"2pl": { form: "capiētis" },
				"3pl": { form: "capient" },
			},
			perfect: {
				"1sg": { form: "cēpī" },
				"2sg": { form: "cēpistī" },
				"3sg": { form: "cēpit" },
				"1pl": { form: "cēpimus" },
				"2pl": { form: "cēpistis" },
				"3pl": { form: "cēpērunt", alt: "cēpēre" },
			},
			pluperfect: {
				"1sg": { form: "cēperam" },
				"2sg": { form: "cēperās" },
				"3sg": { form: "cēperat" },
				"1pl": { form: "cēperāmus" },
				"2pl": { form: "cēperātis" },
				"3pl": { form: "cēperant" },
			},
		},
	},
};

export type ConjugationGroup = {
	conjugation: RegularConjugation;
	/** The heading: "First conjugation". Also keys the blurb in Paradigms.tsx. */
	title: string;
	/** The stem the group is named for — printed beside the heading. */
	stem: string;
	verbs: Verb[];
};

// Mixed last: capiō is explained as part third, part fourth.
export const CONJUGATION_GROUPS: ConjugationGroup[] = [
	{
		conjugation: "1",
		title: "First conjugation",
		stem: "ā-stems",
		verbs: [SALUTO],
	},
	{
		conjugation: "2",
		title: "Second conjugation",
		stem: "ē-stems",
		verbs: [MONEO],
	},
	{
		conjugation: "3",
		title: "Third conjugation",
		stem: "consonant stems",
		verbs: [DUCO],
	},
	{
		conjugation: "4",
		title: "Fourth conjugation",
		stem: "ī-stems",
		verbs: [AUDIO],
	},
	{
		conjugation: "3io",
		title: "Mixed conjugation",
		stem: "third-conjugation -iō verbs",
		verbs: [CAPIO],
	},
];

/** Column order for the endings sheet. */
export const ENDING_COLUMNS: Array<{
	key: RegularConjugation | "person";
	label: string;
}> = [
	{ key: "person", label: "Person" },
	{ key: "1", label: "1st" },
	{ key: "2", label: "2nd" },
	{ key: "3", label: "3rd" },
	{ key: "4", label: "4th" },
	{ key: "3io", label: "Mixed" },
];
