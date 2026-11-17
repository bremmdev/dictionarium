import "@tanstack/react-start/server-only";

import { db } from "#/db";
import { entries } from "#/db/schema";
import { laslaCandidates } from "#/server/frequency";
import { matchLexeme } from "#/utils/entries/frequency";
import { describe, type FormLine } from "#/utils/inflection/describe";
import { FormIndex } from "#/utils/inflection/lookup";

/**
 * The forms index, built on the first search (vault/forms.md). Our own writes
 * drop it; PRAGMA data_version catches anyone else's, such as Studio.
 */
let index: FormIndex | null = null;
let builtAt = -1;

/** Called after createEntry and updateEntry. */
export function invalidateForms() {
	index = null;
}

function currentIndex() {
	const version = db.$client.pragma("data_version", { simple: true }) as number;
	if (index && version === builtAt) return index;

	const rows = db
		.select({
			id: entries.id,
			lemma: entries.lemma,
			partOfSpeech: entries.partOfSpeech,
			principalParts: entries.principalParts,
			gender: entries.gender,
			declension: entries.declension,
			terminations: entries.terminations,
			conjugation: entries.conjugation,
		})
		.from(entries)
		.all();
	index = new FormIndex(rows);
	builtAt = version;
	return index;
}

export type FoundForms = {
	lemmaIds: Set<number>;
	/** Form matches, commonest word first by LASLA rank, so sum comes before edō for est. */
	formIds: Array<number>;
	lines: Map<number, Array<FormLine>>;
};

/** `key` is already formKey'd. */
export function findForms(key: string): FoundForms {
	const current = currentIndex();
	const { lemmaIds, forms } = current.lookup(key);

	const rankOf = (id: number) => {
		const filing = current.filing(id);
		const lexeme = filing
			? matchLexeme(filing, laslaCandidates(filing.lemma))
			: null;
		return lexeme?.rank ?? Number.POSITIVE_INFINITY;
	};
	const formIds = [...forms.keys()]
		.map((id) => ({ id, rank: rankOf(id) }))
		.sort((a, b) => a.rank - b.rank)
		.map(({ id }) => id);

	const lines = new Map([...forms].map(([id, cells]) => [id, describe(cells)]));
	return { lemmaIds, formIds, lines };
}
