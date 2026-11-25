import "@tanstack/react-start/server-only";

import type { Db } from "#/db";
import { entries } from "#/db/schema";
import { laslaCandidates } from "#/server/frequency";
import { matchLexeme } from "#/utils/entries/frequency";
import { describe, type FormLine } from "#/utils/inflection/describe";
import { FormIndex } from "#/utils/inflection/lookup";

/**
 * The forms index per database, built on its first search (vault/forms.md). Our
 * own writes drop it; PRAGMA data_version catches anyone else's, such as Studio.
 */
let built = new WeakMap<Db, { index: FormIndex; version: number }>();

/** Called after createEntry and updateEntry. */
export function invalidateForms() {
	built = new WeakMap();
}

function currentIndex(db: Db) {
	const version = db.$client.pragma("data_version", { simple: true }) as number;
	const hit = built.get(db);
	if (hit && hit.version === version) return hit.index;

	const rows = db
		.select({
			id: entries.id,
			lemma: entries.lemma,
			partOfSpeech: entries.partOfSpeech,
			principalParts: entries.principalParts,
			gender: entries.gender,
			declension: entries.declension,
			terminations: entries.terminations,
			stemClass: entries.stemClass,
			conjugation: entries.conjugation,
		})
		.from(entries)
		.all();
	const index = new FormIndex(rows);
	built.set(db, { index, version });
	return index;
}

export type FoundForms = {
	lemmaIds: Set<number>;
	/** Form matches, commonest word first by LASLA rank, so sum comes before edō for est. */
	formIds: Array<number>;
	lines: Map<number, Array<FormLine>>;
};

/** Forms close to a query that found nothing, scored for nearestSuggestions. */
export function suggestForms(db: Db, key: string, max: number) {
	return currentIndex(db).suggest(key, max);
}

/** `key` is already formKey'd. */
export function findForms(db: Db, key: string): FoundForms {
	const current = currentIndex(db);
	const { lemmaIds, forms, enclitic } = current.lookup(key);

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

	const lines = new Map(
		[...forms].map(([id, cells]) => [id, describe(cells, enclitic)]),
	);
	return { lemmaIds, formIds, lines };
}
