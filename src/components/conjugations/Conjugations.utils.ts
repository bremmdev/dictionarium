// Data only — no JSX, so this stays a .ts module, for the same reason as
// Declensions.utils.ts: the components wrap the Latin in <LatinWord>, and the
// prose lives in the .tsx files where it can carry lang="la".
//
// Every form is spelled with its macrons. In the present they are often the
// only difference between two groups: monēre against dūcere, audīs against
// capis. scripts/check-conjugations.ts rebuilds every form from its stem and
// ENDINGS or PERFECT_ENDINGS (src/utils/inflection/endings.ts), so the
// paradigms and the endings sheet cannot disagree.

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
export const TENSE_LABELS: Record<
	Tense,
	{ la: string; en: string; short?: string }
> = {
	present: { la: "Praesēns", en: "present" },
	imperfect: { la: "Imperfectum", en: "imperfect" },
	future: { la: "Futūrum", en: "future" },
	perfect: { la: "Perfectum", en: "perfect" },
	// Short for Plūsquamperfectum, which made the column too wide.
	pluperfect: { la: "Plūperfectum", en: "pluperfect", short: "Plūperf." },
	futurePerfect: {
		la: "Futūrum exāctum",
		en: "future perfect",
		short: "Fut. exāct.",
	},
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

/** The Latin name on a verb's tab, and its English gloss. */
export const MOOD_LABELS: Record<Mood, { la: string; en: string }> = {
	indicative: { la: "Indicātīvus", en: "indicative" },
	subjunctive: { la: "Coniūnctīvus", en: "subjunctive" },
};
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

export type ImperativePerson = "2sg" | "3sg" | "2pl" | "3pl";

/**
 * Everything that is not a finite tense, on the Cētera tab. Participles and the
 * gerundive are their dictionary lines (salūtāns, salūtantis; salūtātus,
 * salūtāta, salūtātum); the future and perfect passive infinitives are two words.
 * Partial because an irregular verb lacks some (sum has no gerund); the check
 * holds a regular verb to the whole set.
 */
export type Cetera = {
	imperative: Partial<
		Record<
			Voice,
			{
				present: Partial<Record<ImperativePerson, Form>>;
				future: Partial<Record<ImperativePerson, Form>>;
			}
		>
	>;
	infinitive: Partial<
		Record<"present" | "perfect" | "future", Partial<Record<Voice, Form>>>
	>;
	participle: Partial<Record<"present" | "perfect" | "future", Form>>;
	gerundive?: Form;
	gerund?: Record<"genitive" | "dative" | "accusative" | "ablative", Form>;
	supine?: Record<"accusative" | "ablative", Form>;
};

/** What a paradigm table needs, regular or irregular. */
export type VerbParadigm = {
	/** As the dictionary files them. The first part keys BLURBS and NOTES. */
	principalParts: [
		present: string,
		infinitive: string,
		perfect: string,
		// sum has futūrus here instead, and possum and volō have nothing.
		supine?: string,
	];
	english: string;
	/** The third principal part without its -ī. */
	perfectStem: string;
	indicative: MoodForms<"indicative">;
	subjunctive?: MoodForms<"subjunctive">;
	cetera?: Cetera;
};

export type Verb = VerbParadigm & {
	/** What the endings attach to. The thematic vowel is in ENDINGS, not here. */
	base: string;
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

/** The personal endings every tense but the perfect is built from, and what they mean. */
export const PERSONAL_ENDINGS: Record<
	Person,
	{ ending: string; passive: string; example: string; english: string }
> = {
	"1sg": {
		ending: "-ō / -m",
		passive: "-or / -r",
		example: "salūtō",
		english: "I greet",
	},
	"2sg": {
		ending: "-s",
		passive: "-ris / -re",
		example: "salūtās",
		english: "you greet",
	},
	"3sg": {
		ending: "-t",
		passive: "-tur",
		example: "salūtat",
		english: "he, she, it greets",
	},
	"1pl": {
		ending: "-mus",
		passive: "-mur",
		example: "salūtāmus",
		english: "we greet",
	},
	"2pl": {
		ending: "-tis",
		passive: "-minī",
		example: "salūtātis",
		english: "you (all) greet",
	},
	"3pl": {
		ending: "-nt",
		passive: "-ntur",
		example: "salūtant",
		english: "they greet",
	},
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
			futurePerfect: {
				"1sg": { form: "salūtāverō" },
				"2sg": { form: "salūtāveris" },
				"3sg": { form: "salūtāverit" },
				"1pl": { form: "salūtāverimus" },
				"2pl": { form: "salūtāveritis" },
				"3pl": { form: "salūtāverint" },
			},
		},
		passive: {
			present: {
				"1sg": { form: "salūtor" },
				"2sg": { form: "salūtāris", alt: "salūtāre" },
				"3sg": { form: "salūtātur" },
				"1pl": { form: "salūtāmur" },
				"2pl": { form: "salūtāminī" },
				"3pl": { form: "salūtantur" },
			},
			imperfect: {
				"1sg": { form: "salūtābar" },
				"2sg": { form: "salūtābāris", alt: "salūtābāre" },
				"3sg": { form: "salūtābātur" },
				"1pl": { form: "salūtābāmur" },
				"2pl": { form: "salūtābāminī" },
				"3pl": { form: "salūtābantur" },
			},
			future: {
				"1sg": { form: "salūtābor" },
				"2sg": { form: "salūtāberis", alt: "salūtābere" },
				"3sg": { form: "salūtābitur" },
				"1pl": { form: "salūtābimur" },
				"2pl": { form: "salūtābiminī" },
				"3pl": { form: "salūtābuntur" },
			},
			perfect: {
				"1sg": { form: "salūtātus sum" },
				"2sg": { form: "salūtātus es" },
				"3sg": { form: "salūtātus est" },
				"1pl": { form: "salūtātī sumus" },
				"2pl": { form: "salūtātī estis" },
				"3pl": { form: "salūtātī sunt" },
			},
			pluperfect: {
				"1sg": { form: "salūtātus eram" },
				"2sg": { form: "salūtātus erās" },
				"3sg": { form: "salūtātus erat" },
				"1pl": { form: "salūtātī erāmus" },
				"2pl": { form: "salūtātī erātis" },
				"3pl": { form: "salūtātī erant" },
			},
			futurePerfect: {
				"1sg": { form: "salūtātus erō" },
				"2sg": { form: "salūtātus eris" },
				"3sg": { form: "salūtātus erit" },
				"1pl": { form: "salūtātī erimus" },
				"2pl": { form: "salūtātī eritis" },
				"3pl": { form: "salūtātī erunt" },
			},
		},
	},
	subjunctive: {
		active: {
			present: {
				"1sg": { form: "salūtem" },
				"2sg": { form: "salūtēs" },
				"3sg": { form: "salūtet" },
				"1pl": { form: "salūtēmus" },
				"2pl": { form: "salūtētis" },
				"3pl": { form: "salūtent" },
			},
			imperfect: {
				"1sg": { form: "salūtārem" },
				"2sg": { form: "salūtārēs" },
				"3sg": { form: "salūtāret" },
				"1pl": { form: "salūtārēmus" },
				"2pl": { form: "salūtārētis" },
				"3pl": { form: "salūtārent" },
			},
			perfect: {
				"1sg": { form: "salūtāverim" },
				"2sg": { form: "salūtāverīs" },
				"3sg": { form: "salūtāverit" },
				"1pl": { form: "salūtāverīmus" },
				"2pl": { form: "salūtāverītis" },
				"3pl": { form: "salūtāverint" },
			},
			pluperfect: {
				"1sg": { form: "salūtāvissem" },
				"2sg": { form: "salūtāvissēs" },
				"3sg": { form: "salūtāvisset" },
				"1pl": { form: "salūtāvissēmus" },
				"2pl": { form: "salūtāvissētis" },
				"3pl": { form: "salūtāvissent" },
			},
		},
		passive: {
			present: {
				"1sg": { form: "salūter" },
				"2sg": { form: "salūtēris", alt: "salūtēre" },
				"3sg": { form: "salūtētur" },
				"1pl": { form: "salūtēmur" },
				"2pl": { form: "salūtēminī" },
				"3pl": { form: "salūtentur" },
			},
			imperfect: {
				"1sg": { form: "salūtārer" },
				"2sg": { form: "salūtārēris", alt: "salūtārēre" },
				"3sg": { form: "salūtārētur" },
				"1pl": { form: "salūtārēmur" },
				"2pl": { form: "salūtārēminī" },
				"3pl": { form: "salūtārentur" },
			},
			perfect: {
				"1sg": { form: "salūtātus sim" },
				"2sg": { form: "salūtātus sīs" },
				"3sg": { form: "salūtātus sit" },
				"1pl": { form: "salūtātī sīmus" },
				"2pl": { form: "salūtātī sītis" },
				"3pl": { form: "salūtātī sint" },
			},
			pluperfect: {
				"1sg": { form: "salūtātus essem" },
				"2sg": { form: "salūtātus essēs" },
				"3sg": { form: "salūtātus esset" },
				"1pl": { form: "salūtātī essēmus" },
				"2pl": { form: "salūtātī essētis" },
				"3pl": { form: "salūtātī essent" },
			},
		},
	},
	cetera: {
		imperative: {
			active: {
				present: {
					"2sg": { form: "salūtā" },
					"2pl": { form: "salūtāte" },
				},
				future: {
					"2sg": { form: "salūtātō" },
					"3sg": { form: "salūtātō" },
					"2pl": { form: "salūtātōte" },
					"3pl": { form: "salūtantō" },
				},
			},
			passive: {
				present: {
					"2sg": { form: "salūtāre" },
					"2pl": { form: "salūtāminī" },
				},
				future: {
					"2sg": { form: "salūtātor" },
					"3sg": { form: "salūtātor" },
					"3pl": { form: "salūtantor" },
				},
			},
		},
		infinitive: {
			present: { active: { form: "salūtāre" }, passive: { form: "salūtārī" } },
			perfect: {
				active: { form: "salūtāvisse" },
				passive: { form: "salūtātus esse" },
			},
			future: {
				active: { form: "salūtātūrus esse" },
				passive: { form: "salūtātum īrī" },
			},
		},
		participle: {
			present: { form: "salūtāns, salūtantis" },
			perfect: { form: "salūtātus, salūtāta, salūtātum" },
			future: { form: "salūtātūrus, salūtātūra, salūtātūrum" },
		},
		gerundive: { form: "salūtandus, salūtanda, salūtandum" },
		gerund: {
			genitive: { form: "salūtandī" },
			dative: { form: "salūtandō" },
			accusative: { form: "salūtandum" },
			ablative: { form: "salūtandō" },
		},
		supine: {
			accusative: { form: "salūtātum" },
			ablative: { form: "salūtātū" },
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
			futurePerfect: {
				"1sg": { form: "monuerō" },
				"2sg": { form: "monueris" },
				"3sg": { form: "monuerit" },
				"1pl": { form: "monuerimus" },
				"2pl": { form: "monueritis" },
				"3pl": { form: "monuerint" },
			},
		},
		passive: {
			present: {
				"1sg": { form: "moneor" },
				"2sg": { form: "monēris", alt: "monēre" },
				"3sg": { form: "monētur" },
				"1pl": { form: "monēmur" },
				"2pl": { form: "monēminī" },
				"3pl": { form: "monentur" },
			},
			imperfect: {
				"1sg": { form: "monēbar" },
				"2sg": { form: "monēbāris", alt: "monēbāre" },
				"3sg": { form: "monēbātur" },
				"1pl": { form: "monēbāmur" },
				"2pl": { form: "monēbāminī" },
				"3pl": { form: "monēbantur" },
			},
			future: {
				"1sg": { form: "monēbor" },
				"2sg": { form: "monēberis", alt: "monēbere" },
				"3sg": { form: "monēbitur" },
				"1pl": { form: "monēbimur" },
				"2pl": { form: "monēbiminī" },
				"3pl": { form: "monēbuntur" },
			},
			perfect: {
				"1sg": { form: "monitus sum" },
				"2sg": { form: "monitus es" },
				"3sg": { form: "monitus est" },
				"1pl": { form: "monitī sumus" },
				"2pl": { form: "monitī estis" },
				"3pl": { form: "monitī sunt" },
			},
			pluperfect: {
				"1sg": { form: "monitus eram" },
				"2sg": { form: "monitus erās" },
				"3sg": { form: "monitus erat" },
				"1pl": { form: "monitī erāmus" },
				"2pl": { form: "monitī erātis" },
				"3pl": { form: "monitī erant" },
			},
			futurePerfect: {
				"1sg": { form: "monitus erō" },
				"2sg": { form: "monitus eris" },
				"3sg": { form: "monitus erit" },
				"1pl": { form: "monitī erimus" },
				"2pl": { form: "monitī eritis" },
				"3pl": { form: "monitī erunt" },
			},
		},
	},
	subjunctive: {
		active: {
			present: {
				"1sg": { form: "moneam" },
				"2sg": { form: "moneās" },
				"3sg": { form: "moneat" },
				"1pl": { form: "moneāmus" },
				"2pl": { form: "moneātis" },
				"3pl": { form: "moneant" },
			},
			imperfect: {
				"1sg": { form: "monērem" },
				"2sg": { form: "monērēs" },
				"3sg": { form: "monēret" },
				"1pl": { form: "monērēmus" },
				"2pl": { form: "monērētis" },
				"3pl": { form: "monērent" },
			},
			perfect: {
				"1sg": { form: "monuerim" },
				"2sg": { form: "monuerīs" },
				"3sg": { form: "monuerit" },
				"1pl": { form: "monuerīmus" },
				"2pl": { form: "monuerītis" },
				"3pl": { form: "monuerint" },
			},
			pluperfect: {
				"1sg": { form: "monuissem" },
				"2sg": { form: "monuissēs" },
				"3sg": { form: "monuisset" },
				"1pl": { form: "monuissēmus" },
				"2pl": { form: "monuissētis" },
				"3pl": { form: "monuissent" },
			},
		},
		passive: {
			present: {
				"1sg": { form: "monear" },
				"2sg": { form: "moneāris", alt: "moneāre" },
				"3sg": { form: "moneātur" },
				"1pl": { form: "moneāmur" },
				"2pl": { form: "moneāminī" },
				"3pl": { form: "moneantur" },
			},
			imperfect: {
				"1sg": { form: "monērer" },
				"2sg": { form: "monērēris", alt: "monērēre" },
				"3sg": { form: "monērētur" },
				"1pl": { form: "monērēmur" },
				"2pl": { form: "monērēminī" },
				"3pl": { form: "monērentur" },
			},
			perfect: {
				"1sg": { form: "monitus sim" },
				"2sg": { form: "monitus sīs" },
				"3sg": { form: "monitus sit" },
				"1pl": { form: "monitī sīmus" },
				"2pl": { form: "monitī sītis" },
				"3pl": { form: "monitī sint" },
			},
			pluperfect: {
				"1sg": { form: "monitus essem" },
				"2sg": { form: "monitus essēs" },
				"3sg": { form: "monitus esset" },
				"1pl": { form: "monitī essēmus" },
				"2pl": { form: "monitī essētis" },
				"3pl": { form: "monitī essent" },
			},
		},
	},
	cetera: {
		imperative: {
			active: {
				present: {
					"2sg": { form: "monē" },
					"2pl": { form: "monēte" },
				},
				future: {
					"2sg": { form: "monētō" },
					"3sg": { form: "monētō" },
					"2pl": { form: "monētōte" },
					"3pl": { form: "monentō" },
				},
			},
			passive: {
				present: {
					"2sg": { form: "monēre" },
					"2pl": { form: "monēminī" },
				},
				future: {
					"2sg": { form: "monētor" },
					"3sg": { form: "monētor" },
					"3pl": { form: "monentor" },
				},
			},
		},
		infinitive: {
			present: { active: { form: "monēre" }, passive: { form: "monērī" } },
			perfect: {
				active: { form: "monuisse" },
				passive: { form: "monitus esse" },
			},
			future: {
				active: { form: "monitūrus esse" },
				passive: { form: "monitum īrī" },
			},
		},
		participle: {
			present: { form: "monēns, monentis" },
			perfect: { form: "monitus, monita, monitum" },
			future: { form: "monitūrus, monitūra, monitūrum" },
		},
		gerundive: { form: "monendus, monenda, monendum" },
		gerund: {
			genitive: { form: "monendī" },
			dative: { form: "monendō" },
			accusative: { form: "monendum" },
			ablative: { form: "monendō" },
		},
		supine: { accusative: { form: "monitum" }, ablative: { form: "monitū" } },
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
			futurePerfect: {
				"1sg": { form: "dūxerō" },
				"2sg": { form: "dūxeris" },
				"3sg": { form: "dūxerit" },
				"1pl": { form: "dūxerimus" },
				"2pl": { form: "dūxeritis" },
				"3pl": { form: "dūxerint" },
			},
		},
		passive: {
			present: {
				"1sg": { form: "dūcor" },
				"2sg": { form: "dūceris", alt: "dūcere" },
				"3sg": { form: "dūcitur" },
				"1pl": { form: "dūcimur" },
				"2pl": { form: "dūciminī" },
				"3pl": { form: "dūcuntur" },
			},
			imperfect: {
				"1sg": { form: "dūcēbar" },
				"2sg": { form: "dūcēbāris", alt: "dūcēbāre" },
				"3sg": { form: "dūcēbātur" },
				"1pl": { form: "dūcēbāmur" },
				"2pl": { form: "dūcēbāminī" },
				"3pl": { form: "dūcēbantur" },
			},
			future: {
				"1sg": { form: "dūcar" },
				"2sg": { form: "dūcēris", alt: "dūcēre" },
				"3sg": { form: "dūcētur" },
				"1pl": { form: "dūcēmur" },
				"2pl": { form: "dūcēminī" },
				"3pl": { form: "dūcentur" },
			},
			perfect: {
				"1sg": { form: "ductus sum" },
				"2sg": { form: "ductus es" },
				"3sg": { form: "ductus est" },
				"1pl": { form: "ductī sumus" },
				"2pl": { form: "ductī estis" },
				"3pl": { form: "ductī sunt" },
			},
			pluperfect: {
				"1sg": { form: "ductus eram" },
				"2sg": { form: "ductus erās" },
				"3sg": { form: "ductus erat" },
				"1pl": { form: "ductī erāmus" },
				"2pl": { form: "ductī erātis" },
				"3pl": { form: "ductī erant" },
			},
			futurePerfect: {
				"1sg": { form: "ductus erō" },
				"2sg": { form: "ductus eris" },
				"3sg": { form: "ductus erit" },
				"1pl": { form: "ductī erimus" },
				"2pl": { form: "ductī eritis" },
				"3pl": { form: "ductī erunt" },
			},
		},
	},
	subjunctive: {
		active: {
			present: {
				"1sg": { form: "dūcam" },
				"2sg": { form: "dūcās" },
				"3sg": { form: "dūcat" },
				"1pl": { form: "dūcāmus" },
				"2pl": { form: "dūcātis" },
				"3pl": { form: "dūcant" },
			},
			imperfect: {
				"1sg": { form: "dūcerem" },
				"2sg": { form: "dūcerēs" },
				"3sg": { form: "dūceret" },
				"1pl": { form: "dūcerēmus" },
				"2pl": { form: "dūcerētis" },
				"3pl": { form: "dūcerent" },
			},
			perfect: {
				"1sg": { form: "dūxerim" },
				"2sg": { form: "dūxerīs" },
				"3sg": { form: "dūxerit" },
				"1pl": { form: "dūxerīmus" },
				"2pl": { form: "dūxerītis" },
				"3pl": { form: "dūxerint" },
			},
			pluperfect: {
				"1sg": { form: "dūxissem" },
				"2sg": { form: "dūxissēs" },
				"3sg": { form: "dūxisset" },
				"1pl": { form: "dūxissēmus" },
				"2pl": { form: "dūxissētis" },
				"3pl": { form: "dūxissent" },
			},
		},
		passive: {
			present: {
				"1sg": { form: "dūcar" },
				"2sg": { form: "dūcāris", alt: "dūcāre" },
				"3sg": { form: "dūcātur" },
				"1pl": { form: "dūcāmur" },
				"2pl": { form: "dūcāminī" },
				"3pl": { form: "dūcantur" },
			},
			imperfect: {
				"1sg": { form: "dūcerer" },
				"2sg": { form: "dūcerēris", alt: "dūcerēre" },
				"3sg": { form: "dūcerētur" },
				"1pl": { form: "dūcerēmur" },
				"2pl": { form: "dūcerēminī" },
				"3pl": { form: "dūcerentur" },
			},
			perfect: {
				"1sg": { form: "ductus sim" },
				"2sg": { form: "ductus sīs" },
				"3sg": { form: "ductus sit" },
				"1pl": { form: "ductī sīmus" },
				"2pl": { form: "ductī sītis" },
				"3pl": { form: "ductī sint" },
			},
			pluperfect: {
				"1sg": { form: "ductus essem" },
				"2sg": { form: "ductus essēs" },
				"3sg": { form: "ductus esset" },
				"1pl": { form: "ductī essēmus" },
				"2pl": { form: "ductī essētis" },
				"3pl": { form: "ductī essent" },
			},
		},
	},
	cetera: {
		imperative: {
			active: {
				present: {
					"2sg": { form: "dūc", irregular: true },
					"2pl": { form: "dūcite" },
				},
				future: {
					"2sg": { form: "dūcitō" },
					"3sg": { form: "dūcitō" },
					"2pl": { form: "dūcitōte" },
					"3pl": { form: "dūcuntō" },
				},
			},
			passive: {
				present: {
					"2sg": { form: "dūcere" },
					"2pl": { form: "dūciminī" },
				},
				future: {
					"2sg": { form: "dūcitor" },
					"3sg": { form: "dūcitor" },
					"3pl": { form: "dūcuntor" },
				},
			},
		},
		infinitive: {
			present: { active: { form: "dūcere" }, passive: { form: "dūcī" } },
			perfect: {
				active: { form: "dūxisse" },
				passive: { form: "ductus esse" },
			},
			future: {
				active: { form: "ductūrus esse" },
				passive: { form: "ductum īrī" },
			},
		},
		participle: {
			present: { form: "dūcēns, dūcentis" },
			perfect: { form: "ductus, ducta, ductum" },
			future: { form: "ductūrus, ductūra, ductūrum" },
		},
		gerundive: { form: "dūcendus, dūcenda, dūcendum" },
		gerund: {
			genitive: { form: "dūcendī" },
			dative: { form: "dūcendō" },
			accusative: { form: "dūcendum" },
			ablative: { form: "dūcendō" },
		},
		supine: { accusative: { form: "ductum" }, ablative: { form: "ductū" } },
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
			futurePerfect: {
				"1sg": { form: "audīverō" },
				"2sg": { form: "audīveris" },
				"3sg": { form: "audīverit" },
				"1pl": { form: "audīverimus" },
				"2pl": { form: "audīveritis" },
				"3pl": { form: "audīverint" },
			},
		},
		passive: {
			present: {
				"1sg": { form: "audior" },
				"2sg": { form: "audīris", alt: "audīre" },
				"3sg": { form: "audītur" },
				"1pl": { form: "audīmur" },
				"2pl": { form: "audīminī" },
				"3pl": { form: "audiuntur" },
			},
			imperfect: {
				"1sg": { form: "audiēbar" },
				"2sg": { form: "audiēbāris", alt: "audiēbāre" },
				"3sg": { form: "audiēbātur" },
				"1pl": { form: "audiēbāmur" },
				"2pl": { form: "audiēbāminī" },
				"3pl": { form: "audiēbantur" },
			},
			future: {
				"1sg": { form: "audiar" },
				"2sg": { form: "audiēris", alt: "audiēre" },
				"3sg": { form: "audiētur" },
				"1pl": { form: "audiēmur" },
				"2pl": { form: "audiēminī" },
				"3pl": { form: "audientur" },
			},
			perfect: {
				"1sg": { form: "audītus sum" },
				"2sg": { form: "audītus es" },
				"3sg": { form: "audītus est" },
				"1pl": { form: "audītī sumus" },
				"2pl": { form: "audītī estis" },
				"3pl": { form: "audītī sunt" },
			},
			pluperfect: {
				"1sg": { form: "audītus eram" },
				"2sg": { form: "audītus erās" },
				"3sg": { form: "audītus erat" },
				"1pl": { form: "audītī erāmus" },
				"2pl": { form: "audītī erātis" },
				"3pl": { form: "audītī erant" },
			},
			futurePerfect: {
				"1sg": { form: "audītus erō" },
				"2sg": { form: "audītus eris" },
				"3sg": { form: "audītus erit" },
				"1pl": { form: "audītī erimus" },
				"2pl": { form: "audītī eritis" },
				"3pl": { form: "audītī erunt" },
			},
		},
	},
	subjunctive: {
		active: {
			present: {
				"1sg": { form: "audiam" },
				"2sg": { form: "audiās" },
				"3sg": { form: "audiat" },
				"1pl": { form: "audiāmus" },
				"2pl": { form: "audiātis" },
				"3pl": { form: "audiant" },
			},
			imperfect: {
				"1sg": { form: "audīrem" },
				"2sg": { form: "audīrēs" },
				"3sg": { form: "audīret" },
				"1pl": { form: "audīrēmus" },
				"2pl": { form: "audīrētis" },
				"3pl": { form: "audīrent" },
			},
			perfect: {
				"1sg": { form: "audīverim" },
				"2sg": { form: "audīverīs" },
				"3sg": { form: "audīverit" },
				"1pl": { form: "audīverīmus" },
				"2pl": { form: "audīverītis" },
				"3pl": { form: "audīverint" },
			},
			pluperfect: {
				"1sg": { form: "audīvissem" },
				"2sg": { form: "audīvissēs" },
				"3sg": { form: "audīvisset" },
				"1pl": { form: "audīvissēmus" },
				"2pl": { form: "audīvissētis" },
				"3pl": { form: "audīvissent" },
			},
		},
		passive: {
			present: {
				"1sg": { form: "audiar" },
				"2sg": { form: "audiāris", alt: "audiāre" },
				"3sg": { form: "audiātur" },
				"1pl": { form: "audiāmur" },
				"2pl": { form: "audiāminī" },
				"3pl": { form: "audiantur" },
			},
			imperfect: {
				"1sg": { form: "audīrer" },
				"2sg": { form: "audīrēris", alt: "audīrēre" },
				"3sg": { form: "audīrētur" },
				"1pl": { form: "audīrēmur" },
				"2pl": { form: "audīrēminī" },
				"3pl": { form: "audīrentur" },
			},
			perfect: {
				"1sg": { form: "audītus sim" },
				"2sg": { form: "audītus sīs" },
				"3sg": { form: "audītus sit" },
				"1pl": { form: "audītī sīmus" },
				"2pl": { form: "audītī sītis" },
				"3pl": { form: "audītī sint" },
			},
			pluperfect: {
				"1sg": { form: "audītus essem" },
				"2sg": { form: "audītus essēs" },
				"3sg": { form: "audītus esset" },
				"1pl": { form: "audītī essēmus" },
				"2pl": { form: "audītī essētis" },
				"3pl": { form: "audītī essent" },
			},
		},
	},
	cetera: {
		imperative: {
			active: {
				present: {
					"2sg": { form: "audī" },
					"2pl": { form: "audīte" },
				},
				future: {
					"2sg": { form: "audītō" },
					"3sg": { form: "audītō" },
					"2pl": { form: "audītōte" },
					"3pl": { form: "audiuntō" },
				},
			},
			passive: {
				present: {
					"2sg": { form: "audīre" },
					"2pl": { form: "audīminī" },
				},
				future: {
					"2sg": { form: "audītor" },
					"3sg": { form: "audītor" },
					"3pl": { form: "audiuntor" },
				},
			},
		},
		infinitive: {
			present: { active: { form: "audīre" }, passive: { form: "audīrī" } },
			perfect: {
				active: { form: "audīvisse" },
				passive: { form: "audītus esse" },
			},
			future: {
				active: { form: "audītūrus esse" },
				passive: { form: "audītum īrī" },
			},
		},
		participle: {
			present: { form: "audiēns, audientis" },
			perfect: { form: "audītus, audīta, audītum" },
			future: { form: "audītūrus, audītūra, audītūrum" },
		},
		gerundive: { form: "audiendus, audienda, audiendum" },
		gerund: {
			genitive: { form: "audiendī" },
			dative: { form: "audiendō" },
			accusative: { form: "audiendum" },
			ablative: { form: "audiendō" },
		},
		supine: { accusative: { form: "audītum" }, ablative: { form: "audītū" } },
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
			futurePerfect: {
				"1sg": { form: "cēperō" },
				"2sg": { form: "cēperis" },
				"3sg": { form: "cēperit" },
				"1pl": { form: "cēperimus" },
				"2pl": { form: "cēperitis" },
				"3pl": { form: "cēperint" },
			},
		},
		passive: {
			present: {
				"1sg": { form: "capior" },
				"2sg": { form: "caperis", alt: "capere" },
				"3sg": { form: "capitur" },
				"1pl": { form: "capimur" },
				"2pl": { form: "capiminī" },
				"3pl": { form: "capiuntur" },
			},
			imperfect: {
				"1sg": { form: "capiēbar" },
				"2sg": { form: "capiēbāris", alt: "capiēbāre" },
				"3sg": { form: "capiēbātur" },
				"1pl": { form: "capiēbāmur" },
				"2pl": { form: "capiēbāminī" },
				"3pl": { form: "capiēbantur" },
			},
			future: {
				"1sg": { form: "capiar" },
				"2sg": { form: "capiēris", alt: "capiēre" },
				"3sg": { form: "capiētur" },
				"1pl": { form: "capiēmur" },
				"2pl": { form: "capiēminī" },
				"3pl": { form: "capientur" },
			},
			perfect: {
				"1sg": { form: "captus sum" },
				"2sg": { form: "captus es" },
				"3sg": { form: "captus est" },
				"1pl": { form: "captī sumus" },
				"2pl": { form: "captī estis" },
				"3pl": { form: "captī sunt" },
			},
			pluperfect: {
				"1sg": { form: "captus eram" },
				"2sg": { form: "captus erās" },
				"3sg": { form: "captus erat" },
				"1pl": { form: "captī erāmus" },
				"2pl": { form: "captī erātis" },
				"3pl": { form: "captī erant" },
			},
			futurePerfect: {
				"1sg": { form: "captus erō" },
				"2sg": { form: "captus eris" },
				"3sg": { form: "captus erit" },
				"1pl": { form: "captī erimus" },
				"2pl": { form: "captī eritis" },
				"3pl": { form: "captī erunt" },
			},
		},
	},
	subjunctive: {
		active: {
			present: {
				"1sg": { form: "capiam" },
				"2sg": { form: "capiās" },
				"3sg": { form: "capiat" },
				"1pl": { form: "capiāmus" },
				"2pl": { form: "capiātis" },
				"3pl": { form: "capiant" },
			},
			imperfect: {
				"1sg": { form: "caperem" },
				"2sg": { form: "caperēs" },
				"3sg": { form: "caperet" },
				"1pl": { form: "caperēmus" },
				"2pl": { form: "caperētis" },
				"3pl": { form: "caperent" },
			},
			perfect: {
				"1sg": { form: "cēperim" },
				"2sg": { form: "cēperīs" },
				"3sg": { form: "cēperit" },
				"1pl": { form: "cēperīmus" },
				"2pl": { form: "cēperītis" },
				"3pl": { form: "cēperint" },
			},
			pluperfect: {
				"1sg": { form: "cēpissem" },
				"2sg": { form: "cēpissēs" },
				"3sg": { form: "cēpisset" },
				"1pl": { form: "cēpissēmus" },
				"2pl": { form: "cēpissētis" },
				"3pl": { form: "cēpissent" },
			},
		},
		passive: {
			present: {
				"1sg": { form: "capiar" },
				"2sg": { form: "capiāris", alt: "capiāre" },
				"3sg": { form: "capiātur" },
				"1pl": { form: "capiāmur" },
				"2pl": { form: "capiāminī" },
				"3pl": { form: "capiantur" },
			},
			imperfect: {
				"1sg": { form: "caperer" },
				"2sg": { form: "caperēris", alt: "caperēre" },
				"3sg": { form: "caperētur" },
				"1pl": { form: "caperēmur" },
				"2pl": { form: "caperēminī" },
				"3pl": { form: "caperentur" },
			},
			perfect: {
				"1sg": { form: "captus sim" },
				"2sg": { form: "captus sīs" },
				"3sg": { form: "captus sit" },
				"1pl": { form: "captī sīmus" },
				"2pl": { form: "captī sītis" },
				"3pl": { form: "captī sint" },
			},
			pluperfect: {
				"1sg": { form: "captus essem" },
				"2sg": { form: "captus essēs" },
				"3sg": { form: "captus esset" },
				"1pl": { form: "captī essēmus" },
				"2pl": { form: "captī essētis" },
				"3pl": { form: "captī essent" },
			},
		},
	},
	cetera: {
		imperative: {
			active: {
				present: {
					"2sg": { form: "cape" },
					"2pl": { form: "capite" },
				},
				future: {
					"2sg": { form: "capitō" },
					"3sg": { form: "capitō" },
					"2pl": { form: "capitōte" },
					"3pl": { form: "capiuntō" },
				},
			},
			passive: {
				present: {
					"2sg": { form: "capere" },
					"2pl": { form: "capiminī" },
				},
				future: {
					"2sg": { form: "capitor" },
					"3sg": { form: "capitor" },
					"3pl": { form: "capiuntor" },
				},
			},
		},
		infinitive: {
			present: { active: { form: "capere" }, passive: { form: "capī" } },
			perfect: {
				active: { form: "cēpisse" },
				passive: { form: "captus esse" },
			},
			future: {
				active: { form: "captūrus esse" },
				passive: { form: "captum īrī" },
			},
		},
		participle: {
			present: { form: "capiēns, capientis" },
			perfect: { form: "captus, capta, captum" },
			future: { form: "captūrus, captūra, captūrum" },
		},
		gerundive: { form: "capiendus, capienda, capiendum" },
		gerund: {
			genitive: { form: "capiendī" },
			dative: { form: "capiendō" },
			accusative: { form: "capiendum" },
			ablative: { form: "capiendō" },
		},
		supine: { accusative: { form: "captum" }, ablative: { form: "captū" } },
	},
};

export type ConjugationGroup = {
	/** The group's anchor: /grammar/conjugations#first. An entry page links here. */
	id: string;
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
		id: "first",
		conjugation: "1",
		title: "First conjugation",
		stem: "ā-stems",
		verbs: [SALUTO],
	},
	{
		id: "second",
		conjugation: "2",
		title: "Second conjugation",
		stem: "ē-stems",
		verbs: [MONEO],
	},
	{
		id: "third",
		conjugation: "3",
		title: "Third conjugation",
		stem: "consonant stems",
		verbs: [DUCO],
	},
	{
		id: "fourth",
		conjugation: "4",
		title: "Fourth conjugation",
		stem: "ī-stems",
		verbs: [AUDIO],
	},
	{
		id: "mixed",
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
