/**
 * Where a word is set out in full on a grammar page: /verbum/hic links to
 * /grammar/pronouns#hic, /verbum/absum to sum's table, /verbum/amō to the first
 * conjugation, /verbum/servus and /verbum/laetus to their models. Built from the pages' own data, so a table added there is
 * linked here with nothing else to do.
 */
import {
	type AdjectiveParadigm,
	FIRST_SECOND,
	THIRD,
} from "#/components/declensions/Adjectives.utils";
import { CONJUGATION_GROUPS } from "#/components/conjugations/Conjugations.utils";
import { DECLENSION_GROUPS } from "#/components/declensions/Declensions.utils";
import { IRREGULAR_VERBS } from "#/components/irregular-verbs/IrregularVerbs.utils";
import { DECLENSIONS as NUMBER_DECLENSIONS } from "#/components/numbers/NumberTheory.utils";
import {
	DECLINED_LIKE,
	PERSONAL,
	PRONOMINAL_ADJECTIVES,
	PRONOMINAL_COMPOUNDS,
	PRONOUNS,
	TOTUS,
} from "#/components/pronouns/Pronouns.utils";
import type { Entry } from "#/db/schema";
import { IRREGULAR_NOUNS } from "#/utils/inflection/nouns";
import { partsOf } from "#/utils/inflection/types";

export type FullTable = {
	to:
		| "/grammar/pronouns"
		| "/grammar/irregular-verbs"
		| "/grammar/conjugations"
		| "/grammar/declensions"
		| "/numbers";
	hash?: string;
	/** The word whose table it is, when it has none of its own: sum for absum. */
	like?: string;
	/** The pattern a regular word follows: "first conjugation (ā-stems)". */
	pattern?: string;
	/** The word is the page's own example of its pattern: dūcō, dominus. */
	own?: true;
};

const firstForm = (filing: string) => filing.split(", ")[0];

const patternOf = (group: { title: string; stem: string }) =>
	`${group.title.toLowerCase()} (${group.stem})`;

// ūnus, uter and the rest point at tōtus; a table of their own wins.
const LIKE_TOTUS = [
	...PRONOMINAL_ADJECTIVES.map(({ lemma }) => lemma),
	...PRONOMINAL_COMPOUNDS,
].map(
	(lemma) =>
		[
			firstForm(lemma),
			{
				to: "/grammar/pronouns",
				hash: TOTUS.id,
				like: firstForm(TOTUS.lemma),
			},
		] as const,
);

// duo and trēs are declined on the numbers page; ūnus is in DECLINED already.
const [NOMINATIVE] = NUMBER_DECLENSIONS;
const COUNTED = new Set(
	[NOMINATIVE.one, NOMINATIVE.two, NOMINATIVE.three].map(firstForm),
);

const DECLINED = new Map<string, FullTable>([
	...LIKE_TOTUS,
	...[...PERSONAL, ...PRONOUNS, ...DECLINED_LIKE].map(
		({ id, lemma }) =>
			[firstForm(lemma), { to: "/grammar/pronouns", hash: id }] as const,
	),
]);

/** The first two parts: volō, velle is on the page, volō, volāre (to fly) is not. */
const verbKey = (filing: string | null) =>
	(filing ?? "")
		.split(",")
		.slice(0, 2)
		.map((part) => part.trim())
		.join(", ");

const CONJUGATED = new Map<string, FullTable>(
	IRREGULAR_VERBS.flatMap(
		({ id, principalParts: [lemma, infinitive], compounds = [] }) => [
			[
				`${lemma}, ${infinitive}`,
				{ to: "/grammar/irregular-verbs", hash: id },
			] as const,
			...compounds.map(
				(compound) =>
					[
						verbKey(compound.principalParts),
						{ to: "/grammar/irregular-verbs", hash: id, like: lemma },
					] as const,
			),
		],
	),
);

/**
 * A regular verb points at its group on /grammar/conjugations: amō at the
 * first conjugation, like salūtō. The filed conjugation decides, as it does
 * for the forms search.
 */
function conjugationFor(
	entry: Pick<Entry, "lemma" | "conjugation">,
): FullTable | null {
	const group = CONJUGATION_GROUPS.find(
		({ conjugation }) => conjugation === entry.conjugation,
	);
	const [example] = group?.verbs ?? [];
	if (!group || !example) return null;
	const [like] = example.principalParts;
	return {
		to: "/grammar/conjugations",
		hash: group.id,
		...(like === entry.lemma ? { own: true as const } : { like }),
		pattern: patternOf(group),
	};
}

/** dominus, dominī → "us|ī": what each form adds to the start they share. */
function endings(...forms: Array<string>) {
	const [first = ""] = forms;
	let shared = 0;
	while (
		shared < first.length &&
		forms.every((form) => form[shared] === first[shared])
	) {
		shared++;
	}
	return forms.map((form) => form.slice(shared)).join("|");
}

/**
 * A noun points at its declension on /grammar/declensions, and at a model
 * there when it fits one: the same nominative and genitive endings, and a
 * neuter only like a neuter, an i-stem only like an i-stem. servus, servī is
 * like dominus; ager, agrī fits none, so it gets the declension alone, as do
 * deus and fīlius.
 */
function declensionFor(
	entry: Pick<
		Entry,
		"lemma" | "declension" | "gender" | "principalParts" | "stemClass"
	>,
): FullTable | null {
	const group = DECLENSION_GROUPS[Number(entry.declension) - 1];
	if (!group) return null;
	const base = {
		to: "/grammar/declensions",
		hash: group.id,
		pattern: patternOf(group),
	} as const;
	if (group.paradigms.some(({ lemma }) => lemma === entry.lemma)) {
		return { ...base, own: true };
	}
	const genitive = entry.principalParts?.split(",")[0]?.trim();
	// deus has its own forms, and fīlius the vocative fīlī: dominus would mislead.
	const unlike =
		IRREGULAR_NOUNS.has(entry.lemma) ||
		(entry.declension === "2" && entry.lemma.endsWith("ius"));
	if (!genitive || unlike) return base;
	const neuter = entry.gender === "n";
	const ending = endings(entry.lemma, genitive);
	const model = group.paradigms.find(
		(p) =>
			(p.gender === "n.") === neuter &&
			(p.stemClass === undefined || p.stemClass === entry.stemClass) &&
			endings(p.lemma, p.genitive) === ending,
	);
	return model ? { ...base, like: model.lemma } : base;
}

const TERMINATIONS: Record<string, string> = {
	"1": "one termination",
	"2": "two terminations",
	"3": "three terminations",
};

/**
 * An adjective points at a model in the adjectives section when its filing
 * ends the same way: laetus, laeta, laetum like bonus. miser keeps its e and
 * vetus is a consonant stem, so they get the class alone: the third-declension
 * models are all i-stems.
 */
function adjectiveFor(
	entry: Pick<
		Entry,
		"lemma" | "declension" | "terminations" | "principalParts" | "stemClass"
	>,
): FullTable | null {
	const terminations = TERMINATIONS[entry.terminations ?? ""];
	const classes: Record<string, [string, string, Array<AdjectiveParadigm>]> = {
		"1-2": [
			"adjectives-first-second",
			"first and second declension",
			FIRST_SECOND,
		],
		"3": [
			"adjectives-third",
			terminations ? `third declension (${terminations})` : "third declension",
			THIRD,
		],
	};
	const [hash, pattern, models] = classes[entry.declension ?? ""] ?? [];
	if (!hash || !models) return null;
	const base = { to: "/grammar/declensions", hash, pattern } as const;
	const ending = endings(...partsOf(entry.principalParts));
	const fits = entry.declension !== "3" || entry.stemClass === "i-stem";
	const model = fits
		? models.find((m) => endings(...partsOf(m.lemma)) === ending)
		: undefined;
	if (!model) return base;
	const [like] = partsOf(model.lemma);
	return like === entry.lemma
		? { ...base, hash: model.id, own: true }
		: { ...base, hash: model.id, like };
}

/** tōtus and alius are adjectives, and meus may be filed as one. */
export function fullTableFor(
	entry: Pick<
		Entry,
		| "lemma"
		| "partOfSpeech"
		| "principalParts"
		| "conjugation"
		| "declension"
		| "gender"
		| "terminations"
		| "stemClass"
	>,
): FullTable | null {
	if (entry.partOfSpeech === "verb") {
		return (
			CONJUGATED.get(verbKey(entry.principalParts)) ?? conjugationFor(entry)
		);
	}
	if (entry.partOfSpeech === "noun") return declensionFor(entry);
	if (entry.partOfSpeech === "numeral" && COUNTED.has(entry.lemma)) {
		return DECLINED.get(entry.lemma) ?? { to: "/numbers" };
	}
	if (entry.partOfSpeech === "adjective" || entry.partOfSpeech === "numeral") {
		return DECLINED.get(entry.lemma) ?? adjectiveFor(entry);
	}
	if (entry.partOfSpeech === "pronoun")
		return DECLINED.get(entry.lemma) ?? null;
	return null;
}
