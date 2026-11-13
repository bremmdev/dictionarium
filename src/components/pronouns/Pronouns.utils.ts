// Data only, like Adjectives.utils.ts: the prose about each pronoun lives in
// Pronouns.tsx, where it can carry lang="la".
//
// A pronoun with a `pattern` follows one of two ending sheets, ille's or
// bonus's, and scripts/check-pronouns.ts holds every cell of it to stem +
// ending. A cell marked irregular is skipped: ipsum, where ille has illud.

import type { AdjectiveCase } from "#/components/declensions/Adjectives.utils";
import type { Form } from "#/components/declensions/Declensions.utils";

export type Cell = Form & {
	/** Not stem + the pattern's ending, so the check skips it. */
	irregular?: true;
};

type Genders<T> = { m: T; f: T; n: T };

export type PronounForms = Record<AdjectiveCase, Genders<Cell>>;

export type GenderedPronoun = {
	/** The anchor, the lemma without macrons: /grammar/pronouns#idem. */
	id: string;
	/** The dictionary line, and the key for the prose in Pronouns.tsx. */
	lemma: string;
	english: string;
	/** Present only where the word follows a pattern: ille's, or bonus's. */
	pattern?: { stem: string; endings: "pronominal" | "bonus" };
	singular: PronounForms;
	plural: PronounForms;
};

/** ille without its ill-. The plural is bonus's; the singular is where it differs. */
export const PRONOMINAL_ENDINGS: Record<
	"singular" | "plural",
	Record<AdjectiveCase, Genders<string>>
> = {
	singular: {
		nominative: { m: "-e", f: "-a", n: "-ud" },
		genitive: { m: "-īus", f: "-īus", n: "-īus" },
		dative: { m: "-ī", f: "-ī", n: "-ī" },
		accusative: { m: "-um", f: "-am", n: "-ud" },
		ablative: { m: "-ō", f: "-ā", n: "-ō" },
	},
	plural: {
		nominative: { m: "-ī", f: "-ae", n: "-a" },
		genitive: { m: "-ōrum", f: "-ārum", n: "-ōrum" },
		dative: { m: "-īs", f: "-īs", n: "-īs" },
		accusative: { m: "-ōs", f: "-ās", n: "-a" },
		ablative: { m: "-īs", f: "-īs", n: "-īs" },
	},
};

/** The cells where ille parts from bonus. Everything else is bonus on ill-. */
export const PRONOMINAL_CELLS = [
	{
		id: "nom-m",
		slot: "Nominative singular, masculine",
		bonus: "bonus",
		ille: "ille",
		ipse: "ipse",
	},
	{
		id: "nom-n",
		slot: "Nominative and accusative singular, neuter",
		bonus: "bonum",
		ille: "illud",
		ipse: "ipsum",
	},
	{
		id: "gen",
		slot: "Genitive singular",
		bonus: "bonī, bonae, bonī",
		ille: "illīus",
		ipse: "ipsīus",
	},
	{
		id: "dat",
		slot: "Dative singular",
		bonus: "bonō, bonae, bonō",
		ille: "illī",
		ipse: "ipsī",
	},
];

export const PRONOMINAL_COLUMNS = [
	{ key: "slot", label: "Cell" },
	{ key: "bonus", label: "bonus" },
	{ key: "ille", label: "ille" },
	{ key: "ipse", label: "ipse" },
];

/**
 * Each demonstrative points at a place, and the place has its adverbs: where,
 * where to, where from. Glosses are what the adverb means, not the pronoun.
 */
export const DEIXIS = [
	{
		id: "hic",
		pronoun: "hic",
		near: "what is near me, the speaker",
		where: { la: "hīc", en: "here" },
		whither: { la: "hūc", en: "to here" },
		whence: { la: "hinc", en: "from here" },
	},
	{
		id: "iste",
		pronoun: "iste",
		near: "what is near you, the person addressed",
		where: { la: "istīc", en: "there, where you are" },
		whither: { la: "istūc", en: "to where you are" },
		whence: { la: "istinc", en: "from where you are" },
	},
	{
		id: "ille",
		pronoun: "ille",
		near: "what is away from us both",
		where: { la: "illīc", en: "over there" },
		whither: { la: "illūc", en: "to over there" },
		whence: { la: "illinc", en: "from over there" },
	},
	{
		id: "is",
		pronoun: "is",
		near: "what has just been mentioned",
		where: { la: "ibi", en: "there" },
		whither: { la: "eō", en: "to there" },
		whence: { la: "inde", en: "from there" },
	},
];

export const DEIXIS_COLUMNS = [
	{ key: "pronoun", label: "Pronoun" },
	{ key: "near", label: "Points at" },
	{ key: "where", label: "Where" },
	{ key: "whither", label: "Where to" },
	{ key: "whence", label: "Where from" },
];

const HIC: GenderedPronoun = {
	id: "hic",
	lemma: "hic, haec, hoc",
	english: "this",
	singular: {
		nominative: { m: { form: "hic" }, f: { form: "haec" }, n: { form: "hoc" } },
		genitive: {
			m: { form: "huius" },
			f: { form: "huius" },
			n: { form: "huius" },
		},
		dative: { m: { form: "huic" }, f: { form: "huic" }, n: { form: "huic" } },
		accusative: {
			m: { form: "hunc" },
			f: { form: "hanc" },
			n: { form: "hoc" },
		},
		ablative: { m: { form: "hōc" }, f: { form: "hāc" }, n: { form: "hōc" } },
	},
	plural: {
		nominative: { m: { form: "hī" }, f: { form: "hae" }, n: { form: "haec" } },
		genitive: {
			m: { form: "hōrum" },
			f: { form: "hārum" },
			n: { form: "hōrum" },
		},
		dative: { m: { form: "hīs" }, f: { form: "hīs" }, n: { form: "hīs" } },
		accusative: { m: { form: "hōs" }, f: { form: "hās" }, n: { form: "haec" } },
		ablative: { m: { form: "hīs" }, f: { form: "hīs" }, n: { form: "hīs" } },
	},
};

const ISTE: GenderedPronoun = {
	id: "iste",
	lemma: "iste, ista, istud",
	english: "that of yours",
	pattern: { stem: "ist", endings: "pronominal" },
	singular: {
		nominative: {
			m: { form: "iste" },
			f: { form: "ista" },
			n: { form: "istud" },
		},
		genitive: {
			m: { form: "istīus" },
			f: { form: "istīus" },
			n: { form: "istīus" },
		},
		dative: { m: { form: "istī" }, f: { form: "istī" }, n: { form: "istī" } },
		accusative: {
			m: { form: "istum" },
			f: { form: "istam" },
			n: { form: "istud" },
		},
		ablative: { m: { form: "istō" }, f: { form: "istā" }, n: { form: "istō" } },
	},
	plural: {
		nominative: {
			m: { form: "istī" },
			f: { form: "istae" },
			n: { form: "ista" },
		},
		genitive: {
			m: { form: "istōrum" },
			f: { form: "istārum" },
			n: { form: "istōrum" },
		},
		dative: {
			m: { form: "istīs" },
			f: { form: "istīs" },
			n: { form: "istīs" },
		},
		accusative: {
			m: { form: "istōs" },
			f: { form: "istās" },
			n: { form: "ista" },
		},
		ablative: {
			m: { form: "istīs" },
			f: { form: "istīs" },
			n: { form: "istīs" },
		},
	},
};

const ILLE: GenderedPronoun = {
	id: "ille",
	lemma: "ille, illa, illud",
	english: "that",
	pattern: { stem: "ill", endings: "pronominal" },
	singular: {
		nominative: {
			m: { form: "ille" },
			f: { form: "illa" },
			n: { form: "illud" },
		},
		genitive: {
			m: { form: "illīus" },
			f: { form: "illīus" },
			n: { form: "illīus" },
		},
		dative: { m: { form: "illī" }, f: { form: "illī" }, n: { form: "illī" } },
		accusative: {
			m: { form: "illum" },
			f: { form: "illam" },
			n: { form: "illud" },
		},
		ablative: { m: { form: "illō" }, f: { form: "illā" }, n: { form: "illō" } },
	},
	plural: {
		nominative: {
			m: { form: "illī" },
			f: { form: "illae" },
			n: { form: "illa" },
		},
		genitive: {
			m: { form: "illōrum" },
			f: { form: "illārum" },
			n: { form: "illōrum" },
		},
		dative: {
			m: { form: "illīs" },
			f: { form: "illīs" },
			n: { form: "illīs" },
		},
		accusative: {
			m: { form: "illōs" },
			f: { form: "illās" },
			n: { form: "illa" },
		},
		ablative: {
			m: { form: "illīs" },
			f: { form: "illīs" },
			n: { form: "illīs" },
		},
	},
};

const IS: GenderedPronoun = {
	id: "is",
	lemma: "is, ea, id",
	english: "he, she, it; that",
	singular: {
		nominative: { m: { form: "is" }, f: { form: "ea" }, n: { form: "id" } },
		genitive: { m: { form: "eius" }, f: { form: "eius" }, n: { form: "eius" } },
		dative: { m: { form: "eī" }, f: { form: "eī" }, n: { form: "eī" } },
		accusative: { m: { form: "eum" }, f: { form: "eam" }, n: { form: "id" } },
		ablative: { m: { form: "eō" }, f: { form: "eā" }, n: { form: "eō" } },
	},
	plural: {
		nominative: {
			m: { form: "eī", alt: ["iī", "ī"] },
			f: { form: "eae" },
			n: { form: "ea" },
		},
		genitive: {
			m: { form: "eōrum" },
			f: { form: "eārum" },
			n: { form: "eōrum" },
		},
		dative: {
			m: { form: "eīs", alt: ["iīs", "īs"] },
			f: { form: "eīs", alt: ["iīs", "īs"] },
			n: { form: "eīs", alt: ["iīs", "īs"] },
		},
		accusative: { m: { form: "eōs" }, f: { form: "eās" }, n: { form: "ea" } },
		ablative: {
			m: { form: "eīs", alt: ["iīs", "īs"] },
			f: { form: "eīs", alt: ["iīs", "īs"] },
			n: { form: "eīs", alt: ["iīs", "īs"] },
		},
	},
};

const IPSE: GenderedPronoun = {
	id: "ipse",
	lemma: "ipse, ipsa, ipsum",
	english: "-self, the very",
	pattern: { stem: "ips", endings: "pronominal" },
	singular: {
		nominative: {
			m: { form: "ipse" },
			f: { form: "ipsa" },
			n: { form: "ipsum", irregular: true },
		},
		genitive: {
			m: { form: "ipsīus" },
			f: { form: "ipsīus" },
			n: { form: "ipsīus" },
		},
		dative: { m: { form: "ipsī" }, f: { form: "ipsī" }, n: { form: "ipsī" } },
		accusative: {
			m: { form: "ipsum" },
			f: { form: "ipsam" },
			n: { form: "ipsum", irregular: true },
		},
		ablative: { m: { form: "ipsō" }, f: { form: "ipsā" }, n: { form: "ipsō" } },
	},
	plural: {
		nominative: {
			m: { form: "ipsī" },
			f: { form: "ipsae" },
			n: { form: "ipsa" },
		},
		genitive: {
			m: { form: "ipsōrum" },
			f: { form: "ipsārum" },
			n: { form: "ipsōrum" },
		},
		dative: {
			m: { form: "ipsīs" },
			f: { form: "ipsīs" },
			n: { form: "ipsīs" },
		},
		accusative: {
			m: { form: "ipsōs" },
			f: { form: "ipsās" },
			n: { form: "ipsa" },
		},
		ablative: {
			m: { form: "ipsīs" },
			f: { form: "ipsīs" },
			n: { form: "ipsīs" },
		},
	},
};

const IDEM: GenderedPronoun = {
	id: "idem",
	lemma: "īdem, eadem, idem",
	english: "the same",
	singular: {
		nominative: {
			m: { form: "īdem" },
			f: { form: "eadem" },
			n: { form: "idem" },
		},
		genitive: {
			m: { form: "eiusdem" },
			f: { form: "eiusdem" },
			n: { form: "eiusdem" },
		},
		dative: {
			m: { form: "eīdem" },
			f: { form: "eīdem" },
			n: { form: "eīdem" },
		},
		accusative: {
			m: { form: "eundem" },
			f: { form: "eandem" },
			n: { form: "idem" },
		},
		ablative: {
			m: { form: "eōdem" },
			f: { form: "eādem" },
			n: { form: "eōdem" },
		},
	},
	plural: {
		nominative: {
			m: { form: "eīdem", alt: ["iīdem", "īdem"] },
			f: { form: "eaedem" },
			n: { form: "eadem" },
		},
		genitive: {
			m: { form: "eōrundem" },
			f: { form: "eārundem" },
			n: { form: "eōrundem" },
		},
		dative: {
			m: { form: "eīsdem", alt: ["iīsdem", "īsdem"] },
			f: { form: "eīsdem", alt: ["iīsdem", "īsdem"] },
			n: { form: "eīsdem", alt: ["iīsdem", "īsdem"] },
		},
		accusative: {
			m: { form: "eōsdem" },
			f: { form: "eāsdem" },
			n: { form: "eadem" },
		},
		ablative: {
			m: { form: "eīsdem", alt: ["iīsdem", "īsdem"] },
			f: { form: "eīsdem", alt: ["iīsdem", "īsdem"] },
			n: { form: "eīsdem", alt: ["iīsdem", "īsdem"] },
		},
	},
};

/** null where there is no such form: suī has no nominative. */
export type PersonalForms = Record<AdjectiveCase, Cell | null>;

export type PersonalPronoun = {
	/** The anchor: /grammar/pronouns#ego. */
	id: string;
	/** Singular and plural nominatives, as the table heads them: "ego, nōs". */
	lemma: string;
	english: string;
	singular: PersonalForms;
	plural: PersonalForms;
};

const EGO: PersonalPronoun = {
	id: "ego",
	lemma: "ego, nōs",
	english: "I, we",
	singular: {
		nominative: { form: "ego" },
		genitive: { form: "meī" },
		dative: { form: "mihi", alt: "mī" },
		accusative: { form: "mē" },
		ablative: { form: "mē" },
	},
	plural: {
		nominative: { form: "nōs" },
		genitive: { form: "nostrī", alt: "nostrum" },
		dative: { form: "nōbīs" },
		accusative: { form: "nōs" },
		ablative: { form: "nōbīs" },
	},
};

const TU: PersonalPronoun = {
	id: "tu",
	lemma: "tū, vōs",
	english: "you",
	singular: {
		nominative: { form: "tū" },
		genitive: { form: "tuī" },
		dative: { form: "tibi" },
		accusative: { form: "tē" },
		ablative: { form: "tē" },
	},
	plural: {
		nominative: { form: "vōs" },
		genitive: { form: "vestrī", alt: "vestrum" },
		dative: { form: "vōbīs" },
		accusative: { form: "vōs" },
		ablative: { form: "vōbīs" },
	},
};

const SUI: PersonalPronoun = {
	id: "sui",
	lemma: "suī",
	english: "himself, herself, itself, themselves",
	singular: {
		nominative: null,
		genitive: { form: "suī" },
		dative: { form: "sibi" },
		accusative: { form: "sē", alt: "sēsē" },
		ablative: { form: "sē", alt: "sēsē" },
	},
	plural: {
		nominative: null,
		genitive: { form: "suī" },
		dative: { form: "sibi" },
		accusative: { form: "sē", alt: "sēsē" },
		ablative: { form: "sē", alt: "sēsē" },
	},
};

/** In person order, the way the verb tables run. */
export const PERSONAL = [EGO, TU, SUI];

const MEUS: GenderedPronoun = {
	id: "meus",
	lemma: "meus, mea, meum",
	english: "my",
	pattern: { stem: "me", endings: "bonus" },
	singular: {
		nominative: {
			m: { form: "meus" },
			f: { form: "mea" },
			n: { form: "meum" },
		},
		genitive: { m: { form: "meī" }, f: { form: "meae" }, n: { form: "meī" } },
		dative: { m: { form: "meō" }, f: { form: "meae" }, n: { form: "meō" } },
		accusative: {
			m: { form: "meum" },
			f: { form: "meam" },
			n: { form: "meum" },
		},
		ablative: { m: { form: "meō" }, f: { form: "meā" }, n: { form: "meō" } },
	},
	plural: {
		nominative: { m: { form: "meī" }, f: { form: "meae" }, n: { form: "mea" } },
		genitive: {
			m: { form: "meōrum" },
			f: { form: "meārum" },
			n: { form: "meōrum" },
		},
		dative: { m: { form: "meīs" }, f: { form: "meīs" }, n: { form: "meīs" } },
		accusative: {
			m: { form: "meōs" },
			f: { form: "meās" },
			n: { form: "mea" },
		},
		ablative: { m: { form: "meīs" }, f: { form: "meīs" }, n: { form: "meīs" } },
	},
};

const TUUS: GenderedPronoun = {
	id: "tuus",
	lemma: "tuus, tua, tuum",
	english: "your (of one person)",
	pattern: { stem: "tu", endings: "bonus" },
	singular: {
		nominative: {
			m: { form: "tuus" },
			f: { form: "tua" },
			n: { form: "tuum" },
		},
		genitive: { m: { form: "tuī" }, f: { form: "tuae" }, n: { form: "tuī" } },
		dative: { m: { form: "tuō" }, f: { form: "tuae" }, n: { form: "tuō" } },
		accusative: {
			m: { form: "tuum" },
			f: { form: "tuam" },
			n: { form: "tuum" },
		},
		ablative: { m: { form: "tuō" }, f: { form: "tuā" }, n: { form: "tuō" } },
	},
	plural: {
		nominative: { m: { form: "tuī" }, f: { form: "tuae" }, n: { form: "tua" } },
		genitive: {
			m: { form: "tuōrum" },
			f: { form: "tuārum" },
			n: { form: "tuōrum" },
		},
		dative: { m: { form: "tuīs" }, f: { form: "tuīs" }, n: { form: "tuīs" } },
		accusative: {
			m: { form: "tuōs" },
			f: { form: "tuās" },
			n: { form: "tua" },
		},
		ablative: { m: { form: "tuīs" }, f: { form: "tuīs" }, n: { form: "tuīs" } },
	},
};

const SUUS: GenderedPronoun = {
	id: "suus",
	lemma: "suus, sua, suum",
	english: "his, her, its, their own",
	pattern: { stem: "su", endings: "bonus" },
	singular: {
		nominative: {
			m: { form: "suus" },
			f: { form: "sua" },
			n: { form: "suum" },
		},
		genitive: { m: { form: "suī" }, f: { form: "suae" }, n: { form: "suī" } },
		dative: { m: { form: "suō" }, f: { form: "suae" }, n: { form: "suō" } },
		accusative: {
			m: { form: "suum" },
			f: { form: "suam" },
			n: { form: "suum" },
		},
		ablative: { m: { form: "suō" }, f: { form: "suā" }, n: { form: "suō" } },
	},
	plural: {
		nominative: { m: { form: "suī" }, f: { form: "suae" }, n: { form: "sua" } },
		genitive: {
			m: { form: "suōrum" },
			f: { form: "suārum" },
			n: { form: "suōrum" },
		},
		dative: { m: { form: "suīs" }, f: { form: "suīs" }, n: { form: "suīs" } },
		accusative: {
			m: { form: "suōs" },
			f: { form: "suās" },
			n: { form: "sua" },
		},
		ablative: { m: { form: "suīs" }, f: { form: "suīs" }, n: { form: "suīs" } },
	},
};

const NOSTER: GenderedPronoun = {
	id: "noster",
	lemma: "noster, nostra, nostrum",
	english: "our",
	pattern: { stem: "nostr", endings: "bonus" },
	singular: {
		nominative: {
			m: { form: "noster", irregular: true },
			f: { form: "nostra" },
			n: { form: "nostrum" },
		},
		genitive: {
			m: { form: "nostrī" },
			f: { form: "nostrae" },
			n: { form: "nostrī" },
		},
		dative: {
			m: { form: "nostrō" },
			f: { form: "nostrae" },
			n: { form: "nostrō" },
		},
		accusative: {
			m: { form: "nostrum" },
			f: { form: "nostram" },
			n: { form: "nostrum" },
		},
		ablative: {
			m: { form: "nostrō" },
			f: { form: "nostrā" },
			n: { form: "nostrō" },
		},
	},
	plural: {
		nominative: {
			m: { form: "nostrī" },
			f: { form: "nostrae" },
			n: { form: "nostra" },
		},
		genitive: {
			m: { form: "nostrōrum" },
			f: { form: "nostrārum" },
			n: { form: "nostrōrum" },
		},
		dative: {
			m: { form: "nostrīs" },
			f: { form: "nostrīs" },
			n: { form: "nostrīs" },
		},
		accusative: {
			m: { form: "nostrōs" },
			f: { form: "nostrās" },
			n: { form: "nostra" },
		},
		ablative: {
			m: { form: "nostrīs" },
			f: { form: "nostrīs" },
			n: { form: "nostrīs" },
		},
	},
};

const VESTER: GenderedPronoun = {
	id: "vester",
	lemma: "vester, vestra, vestrum",
	english: "your (of several)",
	pattern: { stem: "vestr", endings: "bonus" },
	singular: {
		nominative: {
			m: { form: "vester", irregular: true },
			f: { form: "vestra" },
			n: { form: "vestrum" },
		},
		genitive: {
			m: { form: "vestrī" },
			f: { form: "vestrae" },
			n: { form: "vestrī" },
		},
		dative: {
			m: { form: "vestrō" },
			f: { form: "vestrae" },
			n: { form: "vestrō" },
		},
		accusative: {
			m: { form: "vestrum" },
			f: { form: "vestram" },
			n: { form: "vestrum" },
		},
		ablative: {
			m: { form: "vestrō" },
			f: { form: "vestrā" },
			n: { form: "vestrō" },
		},
	},
	plural: {
		nominative: {
			m: { form: "vestrī" },
			f: { form: "vestrae" },
			n: { form: "vestra" },
		},
		genitive: {
			m: { form: "vestrōrum" },
			f: { form: "vestrārum" },
			n: { form: "vestrōrum" },
		},
		dative: {
			m: { form: "vestrīs" },
			f: { form: "vestrīs" },
			n: { form: "vestrīs" },
		},
		accusative: {
			m: { form: "vestrōs" },
			f: { form: "vestrās" },
			n: { form: "vestra" },
		},
		ablative: {
			m: { form: "vestrīs" },
			f: { form: "vestrīs" },
			n: { form: "vestrīs" },
		},
	},
};

/** Each beside the personal pronoun it belongs to: mine, yours, one's own; ours, yours. */
export const POSSESSIVES = [MEUS, TUUS, SUUS, NOSTER, VESTER];

/** In the order the deixis table reads: near me, near you, far, mentioned. */
export const DEMONSTRATIVES = [HIC, ISTE, ILLE, IS];

export const INTENSIVE_AND_IDENTITY = [IPSE, IDEM];

/** Every gendered table on the page, for the check. */
export const PRONOUNS = [
	...POSSESSIVES,
	...DEMONSTRATIVES,
	...INTENSIVE_AND_IDENTITY,
];
