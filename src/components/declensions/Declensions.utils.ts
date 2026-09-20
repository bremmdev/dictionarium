// Data only — no JSX, so this stays a .ts module. Paradigm wraps the Latin in
// <LatinWord> when it builds the table rows, and the prose around the tables
// lives in Paradigms.tsx, because a string cannot carry the lang="la" that
// vault/a11y.md asks of every run of Latin.
//
// Every form is spelled with its macrons, because vowel length is the only
// thing separating several of these cells from each other: fīlia (nom.) from
// fīliā (abl.), manus (nom. sg.) from manūs (gen. sg., nom./acc. pl.). Drop the
// macron and the paradigm stops teaching the distinction it exists to teach.

/** The six cases, in the order every Latin grammar in English prints them. */
export const CASES = [
	"nominative",
	"genitive",
	"dative",
	"accusative",
	"ablative",
	"vocative",
] as const;

export type Case = (typeof CASES)[number];

/**
 * One cell. `alt` is a genuine second form in the same slot — domus is the only
 * noun here that needs it throughout, plus the old i-stem accusative plural of
 * urbs.
 */
type Form = {
	form: string;
	alt?: string;
};

export type Paradigm = {
	/** The dictionary entry: lemma, genitive, gender. */
	lemma: string;
	genitive: string;
	gender: "m." | "f." | "n.";
	english: string;
	singular: Record<Case, Form>;
	plural: Record<Case, Form>;
};

export const PARADIGM_COLUMNS = [
	{ key: "grammaticalCase", label: "Case" },
	{ key: "singular", label: "Singular" },
	{ key: "plural", label: "Plural" },
];

export const CASE_COLUMNS = [
	{ key: "grammaticalCase", label: "Case" },
	{ key: "role", label: "What it marks" },
	{ key: "example", label: "Roughly" },
];

export const CASE_ROLES = [
	{
		grammaticalCase: "nominative",
		role: "the subject of the sentence",
		example: "the daughter sings",
	},
	{
		grammaticalCase: "genitive",
		role: "possession, and what a thing belongs to",
		example: "the daughter's, of the daughter",
	},
	{
		grammaticalCase: "dative",
		role: "the indirect object — who it is given to or done for",
		example: "to the daughter, for the daughter",
	},
	{
		grammaticalCase: "accusative",
		role: "the direct object, and the goal of motion",
		example: "I see the daughter",
	},
	{
		grammaticalCase: "ablative",
		role: "separation, means, place and time",
		example: "by, with, from the daughter",
	},
	{
		grammaticalCase: "vocative",
		role: "calling someone by name",
		example: "daughter!",
	},
];

export const GENDER_COLUMNS = [
	{ key: "declension", label: "Declension" },
	{ key: "usually", label: "Usually" },
	{ key: "exception", label: "Watch out for" },
];

/**
 * Gender is a property of the word, not of the declension — these are
 * tendencies strong enough to guess with, and the exceptions are the ones a
 * reader meets in the first year. `examples` is Latin, so the component marks
 * it up; the English around it stays in the English of the page.
 */
export const GENDER_RULES = [
	{
		declension: "1st",
		usually: "feminine",
		examples: "fīlia, domina, fēmina",
		exception: "male occupations are masculine",
		exceptionExamples: "nauta, agricola, poeta",
	},
	{
		declension: "2nd",
		usually: "masculine, or neuter in -um",
		examples: "dominus, servus, fīlius, bellum",
		exception: "countries and trees are feminine",
		exceptionExamples: "Aegyptus, laurus",
	},
	{
		declension: "3rd",
		usually: "any gender — it has to be learnt with the word",
		examples: "",
		exception: "",
		exceptionExamples: "",
	},
	{
		declension: "4th",
		usually: "masculine",
		examples: "cantus, exercitus, adventus",
		exception: "two common feminines, and two neuters you will actually meet",
		exceptionExamples: "manus, domus; genū, cornū",
	},
	{
		declension: "5th",
		usually: "feminine",
		examples: "rēs, fidēs, spēs",
		exception: "one masculine",
		exceptionExamples: "diēs",
	},
];

export const GENITIVE_COLUMNS = [
	{ key: "declension", label: "Declension" },
	{ key: "example", label: "Dictionary entry" },
	{ key: "ending", label: "Drop this" },
	{ key: "stem", label: "Stem" },
];

// The nominative is the unreliable one — urbs, nōmen and manus all look like
// nothing in particular. The genitive is what files a noun and what carries its
// stem, which is why the dictionary lists it second.
export const GENITIVE_ENDINGS = [
	{
		declension: "1st",
		ending: "-ae",
		example: "fīlia, fīliae",
		stem: "fīli-",
	},
	{
		declension: "2nd",
		ending: "-ī",
		example: "dominus, dominī",
		stem: "domin-",
	},
	{ declension: "3rd", ending: "-is", example: "urbs, urbis", stem: "urb-" },
	{ declension: "4th", ending: "-ūs", example: "manus, manūs", stem: "man-" },
	{ declension: "5th", ending: "-eī / -ēī", example: "rēs, reī", stem: "r-" },
];

export const ENDING_COLUMNS = [
	{ key: "grammaticalCase", label: "Case" },
	{ key: "first", label: "1st" },
	{ key: "second", label: "2nd" },
	{ key: "third", label: "3rd" },
	{ key: "fourth", label: "4th" },
	{ key: "fifth", label: "5th" },
];

/**
 * The whole page on two grids. The vocative is left out because it is the
 * nominative again everywhere but one cell, and null is the third declension
 * nominative singular, which has no ending of its own at all — the component
 * prints a dash and the prose underneath says why.
 */
type EndingRow = {
	grammaticalCase: Case;
	first: string;
	second: string;
	third: string | null;
	fourth: string;
	fifth: string;
};

export const SINGULAR_ENDINGS: EndingRow[] = [
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

export const PLURAL_ENDINGS: EndingRow[] = [
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

const FIRST: Paradigm[] = [
	{
		lemma: "fīlia",
		genitive: "fīliae",
		gender: "f.",
		english: "daughter",
		singular: {
			nominative: { form: "fīlia" },
			genitive: { form: "fīliae" },
			dative: { form: "fīliae" },
			accusative: { form: "fīliam" },
			ablative: { form: "fīliā" },
			vocative: { form: "fīlia" },
		},
		plural: {
			nominative: { form: "fīliae" },
			genitive: { form: "fīliārum" },
			dative: { form: "fīliīs" },
			accusative: { form: "fīliās" },
			ablative: { form: "fīliīs" },
			vocative: { form: "fīliae" },
		},
	},
];

const SECOND: Paradigm[] = [
	{
		lemma: "dominus",
		genitive: "dominī",
		gender: "m.",
		english: "master",
		singular: {
			nominative: { form: "dominus" },
			genitive: { form: "dominī" },
			dative: { form: "dominō" },
			accusative: { form: "dominum" },
			ablative: { form: "dominō" },
			vocative: { form: "domine" },
		},
		plural: {
			nominative: { form: "dominī" },
			genitive: { form: "dominōrum" },
			dative: { form: "dominīs" },
			accusative: { form: "dominōs" },
			ablative: { form: "dominīs" },
			vocative: { form: "dominī" },
		},
	},
	{
		lemma: "puer",
		genitive: "puerī",
		gender: "m.",
		english: "boy",
		singular: {
			nominative: { form: "puer" },
			genitive: { form: "puerī" },
			dative: { form: "puerō" },
			accusative: { form: "puerum" },
			ablative: { form: "puerō" },
			vocative: { form: "puer" },
		},
		plural: {
			nominative: { form: "puerī" },
			genitive: { form: "puerōrum" },
			dative: { form: "puerīs" },
			accusative: { form: "puerōs" },
			ablative: { form: "puerīs" },
			vocative: { form: "puerī" },
		},
	},
	{
		lemma: "bellum",
		genitive: "bellī",
		gender: "n.",
		english: "war",
		singular: {
			nominative: { form: "bellum" },
			genitive: { form: "bellī" },
			dative: { form: "bellō" },
			accusative: { form: "bellum" },
			ablative: { form: "bellō" },
			vocative: { form: "bellum" },
		},
		plural: {
			nominative: { form: "bella" },
			genitive: { form: "bellōrum" },
			dative: { form: "bellīs" },
			accusative: { form: "bella" },
			ablative: { form: "bellīs" },
			vocative: { form: "bella" },
		},
	},
];

const THIRD: Paradigm[] = [
	{
		lemma: "prīnceps",
		genitive: "prīncipis",
		gender: "m.",
		english: "chief, leader",
		singular: {
			nominative: { form: "prīnceps" },
			genitive: { form: "prīncipis" },
			dative: { form: "prīncipī" },
			accusative: { form: "prīncipem" },
			ablative: { form: "prīncipe" },
			vocative: { form: "prīnceps" },
		},
		plural: {
			nominative: { form: "prīncipēs" },
			genitive: { form: "prīncipum" },
			dative: { form: "prīncipibus" },
			accusative: { form: "prīncipēs" },
			ablative: { form: "prīncipibus" },
			vocative: { form: "prīncipēs" },
		},
	},
	{
		lemma: "urbs",
		genitive: "urbis",
		gender: "f.",
		english: "city",
		singular: {
			nominative: { form: "urbs" },
			genitive: { form: "urbis" },
			dative: { form: "urbī" },
			accusative: { form: "urbem" },
			ablative: { form: "urbe" },
			vocative: { form: "urbs" },
		},
		plural: {
			nominative: { form: "urbēs" },
			genitive: { form: "urbium" },
			dative: { form: "urbibus" },
			accusative: { form: "urbēs", alt: "urbīs" },
			ablative: { form: "urbibus" },
			vocative: { form: "urbēs" },
		},
	},
	{
		lemma: "nōmen",
		genitive: "nōminis",
		gender: "n.",
		english: "name",
		singular: {
			nominative: { form: "nōmen" },
			genitive: { form: "nōminis" },
			dative: { form: "nōminī" },
			accusative: { form: "nōmen" },
			ablative: { form: "nōmine" },
			vocative: { form: "nōmen" },
		},
		plural: {
			nominative: { form: "nōmina" },
			genitive: { form: "nōminum" },
			dative: { form: "nōminibus" },
			accusative: { form: "nōmina" },
			ablative: { form: "nōminibus" },
			vocative: { form: "nōmina" },
		},
	},
];

const FOURTH: Paradigm[] = [
	{
		lemma: "manus",
		genitive: "manūs",
		gender: "f.",
		english: "hand",
		singular: {
			nominative: { form: "manus" },
			genitive: { form: "manūs" },
			dative: { form: "manuī" },
			accusative: { form: "manum" },
			ablative: { form: "manū" },
			vocative: { form: "manus" },
		},
		plural: {
			nominative: { form: "manūs" },
			genitive: { form: "manuum" },
			dative: { form: "manibus" },
			accusative: { form: "manūs" },
			ablative: { form: "manibus" },
			vocative: { form: "manūs" },
		},
	},
	{
		lemma: "domus",
		genitive: "domūs",
		gender: "f.",
		english: "house, home",
		singular: {
			nominative: { form: "domus" },
			genitive: { form: "domūs", alt: "domī" },
			dative: { form: "domuī", alt: "domō" },
			accusative: { form: "domum" },
			ablative: { form: "domō", alt: "domū" },
			vocative: { form: "domus" },
		},
		plural: {
			nominative: { form: "domūs" },
			genitive: { form: "domuum", alt: "domōrum" },
			dative: { form: "domibus" },
			accusative: { form: "domōs", alt: "domūs" },
			ablative: { form: "domibus" },
			vocative: { form: "domūs" },
		},
	},
	{
		lemma: "genū",
		genitive: "genūs",
		gender: "n.",
		english: "knee",
		singular: {
			nominative: { form: "genū" },
			genitive: { form: "genūs" },
			dative: { form: "genū" },
			accusative: { form: "genū" },
			ablative: { form: "genū" },
			vocative: { form: "genū" },
		},
		plural: {
			nominative: { form: "genua" },
			genitive: { form: "genuum" },
			dative: { form: "genibus" },
			accusative: { form: "genua" },
			ablative: { form: "genibus" },
			vocative: { form: "genua" },
		},
	},
];

const FIFTH: Paradigm[] = [
	{
		lemma: "rēs",
		genitive: "reī",
		gender: "f.",
		english: "thing, matter, affair",
		singular: {
			nominative: { form: "rēs" },
			genitive: { form: "reī" },
			dative: { form: "reī" },
			accusative: { form: "rem" },
			ablative: { form: "rē" },
			vocative: { form: "rēs" },
		},
		plural: {
			nominative: { form: "rēs" },
			genitive: { form: "rērum" },
			dative: { form: "rēbus" },
			accusative: { form: "rēs" },
			ablative: { form: "rēbus" },
			vocative: { form: "rēs" },
		},
	},
];

export type DeclensionGroup = {
	/** The heading: "First declension". Also keys the blurb in Paradigms.tsx. */
	title: string;
	/** The stem the declension is named for — printed beside the heading. */
	stem: string;
	paradigms: Paradigm[];
};

export const DECLENSION_GROUPS: DeclensionGroup[] = [
	{ title: "First declension", stem: "a-stems", paradigms: FIRST },
	{ title: "Second declension", stem: "o-stems", paradigms: SECOND },
	{
		title: "Third declension",
		stem: "consonant and i-stems",
		paradigms: THIRD,
	},
	{ title: "Fourth declension", stem: "u-stems", paradigms: FOURTH },
	{ title: "Fifth declension", stem: "e-stems", paradigms: FIFTH },
];
