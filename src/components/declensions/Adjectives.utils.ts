// Data only — no JSX, the same split the noun paradigms use. The prose that
// names these forms lives in Adjectives.tsx, where the Latin can carry
// lang="la".
//
// Every cell is written out for every gender, even where the three are the same
// word. A paradigm that prints bonīs once across three columns is a paradigm
// that has to be decoded before it can be read, and the cells that collapse are
// exactly the ones a reader needs to be sure about.
import { type Case, CASES } from "./Declensions.utils";

/**
 * The five cases these tables print. The vocative is left out on purpose: for
 * an adjective it is the nominative again in every cell but one — the masculine
 * singular of the bonus type, which has bone — and a sixth row repeating the
 * first earns less than the space it takes.
 */
export const ADJECTIVE_CASES = CASES.filter(
	// The predicate is typed, so the case list narrows with the data: a Record
	// keyed on it then refuses a vocative rather than silently demanding one.
	(grammaticalCase): grammaticalCase is Exclude<Case, "vocative"> =>
		grammaticalCase !== "vocative",
);

export type AdjectiveCase = (typeof ADJECTIVE_CASES)[number];

/** One case of one number, in all three genders. */
type Genders = {
	m: string;
	f: string;
	n: string;
};

export type AdjectiveParadigm = {
	/** The dictionary line: bonus, bona, bonum. */
	lemma: string;
	english: string;
	/** The class, as vault/schema.md files it. */
	label: string;
	singular: Record<AdjectiveCase, Genders>;
	plural: Record<AdjectiveCase, Genders>;
};

export const ADJECTIVE_COLUMNS = [
	{ key: "grammaticalCase", label: "Case" },
	{ key: "m", label: "Masculine" },
	{ key: "f", label: "Feminine" },
	{ key: "n", label: "Neuter" },
];

export const FILING_COLUMNS = [
	{ key: "entry", label: "Dictionary entry" },
	{ key: "className", label: "Class" },
	{ key: "tells", label: "What the second form is" },
];

// The filing is the whole point of the dictionary line: fortis, forte and
// vetus, veteris both print two forms and are not the same class, which is why
// the schema stores the count rather than deriving it (vault/schema.md).
export const ADJECTIVE_FILING = [
	{
		entry: "bonus, bona, bonum",
		className: "1st and 2nd declension",
		tells: "the feminine and the neuter nominative",
	},
	{
		entry: "ācer, ācris, ācre",
		className: "3rd declension, three terminations",
		tells: "the feminine and the neuter nominative",
	},
	{
		entry: "fortis, forte",
		className: "3rd declension, two terminations",
		tells: "the neuter nominative — one form covers masculine and feminine",
	},
	{
		entry: "fēlīx, fēlīcis",
		className: "3rd declension, one termination",
		tells:
			"the genitive, because one form covers all three genders and the nominative hides the stem",
	},
];

export const EXAMPLE_COLUMNS = [
	{ key: "phrase", label: "Phrase" },
	{ key: "english", label: "Reads as" },
	{ key: "agreeing", label: "What is agreeing" },
];

export const FIRST_SECOND: AdjectiveParadigm[] = [
	{
		lemma: "bonus, bona, bonum",
		english: "good",
		label: "the pattern",
		singular: {
			nominative: { m: "bonus", f: "bona", n: "bonum" },
			genitive: { m: "bonī", f: "bonae", n: "bonī" },
			dative: { m: "bonō", f: "bonae", n: "bonō" },
			accusative: { m: "bonum", f: "bonam", n: "bonum" },
			ablative: { m: "bonō", f: "bonā", n: "bonō" },
		},
		plural: {
			nominative: { m: "bonī", f: "bonae", n: "bona" },
			genitive: { m: "bonōrum", f: "bonārum", n: "bonōrum" },
			dative: { m: "bonīs", f: "bonīs", n: "bonīs" },
			accusative: { m: "bonōs", f: "bonās", n: "bona" },
			ablative: { m: "bonīs", f: "bonīs", n: "bonīs" },
		},
	},
	{
		lemma: "pulcher, pulchra, pulchrum",
		english: "beautiful",
		label: "the -er type",
		singular: {
			nominative: { m: "pulcher", f: "pulchra", n: "pulchrum" },
			genitive: { m: "pulchrī", f: "pulchrae", n: "pulchrī" },
			dative: { m: "pulchrō", f: "pulchrae", n: "pulchrō" },
			accusative: { m: "pulchrum", f: "pulchram", n: "pulchrum" },
			ablative: { m: "pulchrō", f: "pulchrā", n: "pulchrō" },
		},
		plural: {
			nominative: { m: "pulchrī", f: "pulchrae", n: "pulchra" },
			genitive: { m: "pulchrōrum", f: "pulchrārum", n: "pulchrōrum" },
			dative: { m: "pulchrīs", f: "pulchrīs", n: "pulchrīs" },
			accusative: { m: "pulchrōs", f: "pulchrās", n: "pulchra" },
			ablative: { m: "pulchrīs", f: "pulchrīs", n: "pulchrīs" },
		},
	},
];

export const THIRD: AdjectiveParadigm[] = [
	{
		lemma: "ācer, ācris, ācre",
		english: "sharp, keen",
		label: "three terminations",
		singular: {
			nominative: { m: "ācer", f: "ācris", n: "ācre" },
			genitive: { m: "ācris", f: "ācris", n: "ācris" },
			dative: { m: "ācrī", f: "ācrī", n: "ācrī" },
			accusative: { m: "ācrem", f: "ācrem", n: "ācre" },
			ablative: { m: "ācrī", f: "ācrī", n: "ācrī" },
		},
		plural: {
			nominative: { m: "ācrēs", f: "ācrēs", n: "ācria" },
			genitive: { m: "ācrium", f: "ācrium", n: "ācrium" },
			dative: { m: "ācribus", f: "ācribus", n: "ācribus" },
			accusative: { m: "ācrēs", f: "ācrēs", n: "ācria" },
			ablative: { m: "ācribus", f: "ācribus", n: "ācribus" },
		},
	},
	{
		lemma: "fortis, forte",
		english: "strong, brave",
		label: "two terminations",
		singular: {
			nominative: { m: "fortis", f: "fortis", n: "forte" },
			genitive: { m: "fortis", f: "fortis", n: "fortis" },
			dative: { m: "fortī", f: "fortī", n: "fortī" },
			accusative: { m: "fortem", f: "fortem", n: "forte" },
			ablative: { m: "fortī", f: "fortī", n: "fortī" },
		},
		plural: {
			nominative: { m: "fortēs", f: "fortēs", n: "fortia" },
			genitive: { m: "fortium", f: "fortium", n: "fortium" },
			dative: { m: "fortibus", f: "fortibus", n: "fortibus" },
			accusative: { m: "fortēs", f: "fortēs", n: "fortia" },
			ablative: { m: "fortibus", f: "fortibus", n: "fortibus" },
		},
	},
	{
		lemma: "fēlīx, fēlīcis",
		english: "lucky, fortunate",
		label: "one termination",
		singular: {
			nominative: { m: "fēlīx", f: "fēlīx", n: "fēlīx" },
			genitive: { m: "fēlīcis", f: "fēlīcis", n: "fēlīcis" },
			dative: { m: "fēlīcī", f: "fēlīcī", n: "fēlīcī" },
			accusative: { m: "fēlīcem", f: "fēlīcem", n: "fēlīx" },
			ablative: { m: "fēlīcī", f: "fēlīcī", n: "fēlīcī" },
		},
		plural: {
			nominative: { m: "fēlīcēs", f: "fēlīcēs", n: "fēlīcia" },
			genitive: { m: "fēlīcium", f: "fēlīcium", n: "fēlīcium" },
			dative: { m: "fēlīcibus", f: "fēlīcibus", n: "fēlīcibus" },
			accusative: { m: "fēlīcēs", f: "fēlīcēs", n: "fēlīcia" },
			ablative: { m: "fēlīcibus", f: "fēlīcibus", n: "fēlīcibus" },
		},
	},
];
