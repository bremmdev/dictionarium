import "@tanstack/react-start/server-only";

import { count, eq, inArray, like, or, type SQL, sql } from "drizzle-orm";

import type { Db } from "#/db";
import { homographCount } from "#/db/homographs";
import { entries, type ShownEntry } from "#/db/schema";
import { findForms, suggestForms } from "#/server/forms";
import { withFrequency } from "#/server/frequency";
import type { FormLine } from "#/utils/inflection/describe";
import { type SearchKey, searchKey } from "#/utils/search/key";
import { MAX_RESULTS } from "#/utils/search/rules";
import {
	maxEditsFor,
	nearestSuggestions,
	type Suggestion,
	scoreLemmas,
} from "#/utils/search/suggestions";

/** Why a result is listed: the query is its lemma, one of its forms, or inside its lemma. */
export type SearchResult = ShownEntry & {
	match: "lemma" | "form" | "other";
	/** For a form match, what the query is in this entry: "rēgis: gen. sg.". */
	forms: Array<FormLine>;
};

export type SearchOutcome = {
	results: Array<SearchResult>;
	/** Lemmas and forms close to the query. Only filled when results is empty. */
	suggestions: Array<Suggestion>;
	/** Every entry the query matches, of which results holds the first MAX_RESULTS. */
	matchCount: number;
};

export type Search = {
	/** The key the query ran on; null when it was too short to run. */
	key: SearchKey | null;
	outcome: SearchOutcome;
};

/** Tier 0 and 1 are the lemma and form matches; 2 (prefix) and 3 (contains) are both "other". */
const MATCH_BY_TIER = ["lemma", "form"] as const;

/** lemma_plain keeps its v; folding it here is free, since every search is a full scan. */
const foldedPlain = sql`replace(replace(${entries.lemmaPlain}, 'v', 'u'), 'j', 'i')`;

/** One search of the dictionary, as vault/search.md describes it. Reads only. */
export async function search(db: Db, q: string): Promise<Search> {
	const key = searchKey(q);
	if (key === null) {
		return {
			key: null,
			outcome: { results: [], suggestions: [], matchCount: 0 },
		};
	}

	// Forms are looked up in memory and come back as ids, so the cap and the count still hold.
	const found = findForms(db, key);
	const lemmaIds = [...found.lemmaIds];
	const { formIds } = found;
	const contains = like(foldedPlain, `%${key.folded}%`);
	const listed = [...lemmaIds, ...formIds];
	const matches =
		listed.length > 0
			? (or(contains, inArray(entries.id, listed)) as SQL)
			: contains;
	const isLemma =
		lemmaIds.length > 0
			? or(eq(foldedPlain, key.folded), inArray(entries.id, lemmaIds))
			: eq(foldedPlain, key.folded);
	const isForm = formIds.length > 0 ? inArray(entries.id, formIds) : sql`false`;
	// The word itself, then a word it is a form of, then words starting with the query, then the rest.
	const tier = sql<number>`case when ${isLemma} then 0 when ${isForm} then 1 when ${foldedPlain} like ${`${key.folded}%`} then 2 else 3 end`;
	// Commonest first among the form matches, in the order findForms ranked them.
	// Left out when there are none: a bare ORDER BY 0 is a column number to SQLite.
	const formOrder =
		formIds.length > 0
			? [
					sql`case ${entries.id} ${sql.join(
						formIds.map((id, i) => sql`when ${id} then ${i}`),
						sql` `,
					)} else ${formIds.length} end`,
				]
			: [];

	const rows = await db.query.entries.findMany({
		where: matches,
		// Shortest first in each tier, so am finds amō before ambulō.
		orderBy: [
			tier,
			...formOrder,
			sql`length(${entries.lemmaPlain})`,
			entries.lemmaPlain,
			entries.lemma,
			entries.homonym,
		],
		// rank is the dictionary order of an entry's senses, so it is the display order too.
		with: { senses: { orderBy: (s, { asc }) => [asc(s.rank)] } },
		extras: {
			homographs: homographCount(entries).as("homographs"),
			tier: tier.as("tier"),
		},
		limit: MAX_RESULTS,
	});
	const matchCount =
		rows.length < MAX_RESULTS ? rows.length : countMatches(db, matches);

	return {
		key,
		outcome: {
			results: rows.map(
				({ tier, ...entry }): SearchResult => ({
					...withFrequency(entry),
					match: MATCH_BY_TIER[tier] ?? "other",
					forms: found.lines.get(entry.id) ?? [],
				}),
			),
			suggestions: findSuggestions(db, key, rows.length),
			matchCount,
		},
	};
}

/** Only run when the list came back full, since a short list already is the count. */
function countMatches(db: Db, where: SQL) {
	const [row] = db.select({ n: count() }).from(entries).where(where).all();
	return row?.n ?? 0;
}

/** Read only on a miss; every lemma is compared in JS — see vault/search.md. */
function findSuggestions(db: Db, key: SearchKey, resultCount: number) {
	const max = maxEditsFor(key);
	if (resultCount > 0 || max === 0) {
		return [];
	}
	const candidates = db
		.selectDistinct({ lemma: entries.lemma })
		.from(entries)
		.all();
	return nearestSuggestions(key, [
		...scoreLemmas(key, candidates),
		...suggestForms(db, key, max),
	]);
}
