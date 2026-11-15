/**
 * Where a word is set out in full on a grammar page: /verbum/hic links to
 * /grammar/pronouns#hic, /verbum/absum to sum's table. Built from the pages'
 * own data, so a table added there is linked here with nothing else to do.
 */
import { IRREGULAR_VERBS } from "#/components/irregular-verbs/IrregularVerbs.utils";
import {
	DECLINED_LIKE,
	PERSONAL,
	PRONOMINAL_ADJECTIVES,
	PRONOMINAL_COMPOUNDS,
	PRONOUNS,
	TOTUS,
} from "#/components/pronouns/Pronouns.utils";
import type { Entry } from "#/db/schema";

export type FullTable = {
	to: "/grammar/pronouns" | "/grammar/irregular-verbs";
	hash: string;
	/** The word whose table it is, when it has none of its own: sum for absum. */
	like?: string;
};

const firstForm = (filing: string) => filing.split(", ")[0];

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

const DECLINED = new Map<string, FullTable>([
	...LIKE_TOTUS,
	...[...PERSONAL, ...PRONOUNS, ...DECLINED_LIKE].map(
		({ id, lemma }) =>
			[firstForm(lemma), { to: "/grammar/pronouns", hash: id }] as const,
	),
]);

const CONJUGATED = new Map<string, FullTable>(
	IRREGULAR_VERBS.flatMap(({ id, principalParts: [lemma], compounds = [] }) => [
		[lemma, { to: "/grammar/irregular-verbs", hash: id }] as const,
		...compounds.map(
			(compound) =>
				[
					firstForm(compound.principalParts),
					{ to: "/grammar/irregular-verbs", hash: id, like: lemma },
				] as const,
		),
	]),
);

/** tōtus and alius are adjectives, and meus may be filed as one. */
export function fullTableFor(
	entry: Pick<Entry, "lemma" | "partOfSpeech">,
): FullTable | null {
	if (entry.partOfSpeech === "verb") {
		return CONJUGATED.get(entry.lemma) ?? null;
	}
	if (entry.partOfSpeech === "pronoun" || entry.partOfSpeech === "adjective") {
		return DECLINED.get(entry.lemma) ?? null;
	}
	return null;
}
