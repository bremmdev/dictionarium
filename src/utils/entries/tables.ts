/**
 * Where a word is set out in full on a grammar page: /verbum/hic links to
 * /grammar/pronouns#hic, /verbum/absum to sum's table. Built from the pages'
 * own data, so a table added there is linked here with nothing else to do.
 */
import { IRREGULAR_VERBS } from "#/components/irregular-verbs/IrregularVerbs.utils";
import { PERSONAL, PRONOUNS } from "#/components/pronouns/Pronouns.utils";
import type { Entry } from "#/db/schema";

export type FullTable = {
	to: "/grammar/pronouns" | "/grammar/irregular-verbs";
	hash: string;
	/** The verb whose table it is, when the word is one of its compounds. */
	like?: string;
};

const firstForm = (filing: string) => filing.split(", ")[0];

const DECLINED = new Map<string, FullTable>(
	[...PERSONAL, ...PRONOUNS].map(({ id, lemma }) => [
		firstForm(lemma),
		{ to: "/grammar/pronouns", hash: id },
	]),
);

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
