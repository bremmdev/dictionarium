import { createServerFn } from "@tanstack/react-start";
import { and, count, eq, like, ne, type SQL, sql } from "drizzle-orm";

import { db } from "#/db";
import { homographCount } from "#/db/homographs";
import { type Entry, entries, type ShownEntry } from "#/db/schema";
import { withFrequency } from "#/server/frequency";
import { recordSearch } from "#/server/recording";
import {
	MAX_RESULTS,
	MIN_QUERY_LENGTH,
	normalizeLemma,
} from "#/utils/search/rules";
import { maxEditsFor, suggestLemmas } from "#/utils/search/suggestions";

export type SearchOutcome = {
	results: Array<ShownEntry>;
	/** Macronned lemmas close to the query. Only filled when results is empty. */
	suggestions: Array<string>;
};

export const searchEntries = createServerFn({ method: "GET" })
	.validator((input: unknown) => {
		const raw = (
			typeof input === "object" && input !== null ? input : {}
		) as Record<string, unknown>;

		return {
			q: typeof raw.q === "string" ? raw.q.trim() : "",
			// Opt-in, so a preload or any other read is never counted by default.
			record: raw.record === true,
		};
	})
	.handler(async ({ data: { q, record } }): Promise<SearchOutcome> => {
		// Shape first, size second. Measuring raw input tells you how much arrived, never what is in it.
		const key = normalizeLemma(q);
		if (key.length < MIN_QUERY_LENGTH) {
			return { results: [], suggestions: [] };
		}

		const results = await db.query.entries.findMany({
			where: like(entries.lemmaPlain, `%${key}%`),
			// Words that start with the query are what the user almost always
			// wants, so rank those above the ones that merely contain it.
			orderBy: [
				sql`case when ${entries.lemmaPlain} like ${`${key}%`} then 0 else 1 end`,
				entries.lemmaPlain,
				entries.lemma,
				entries.homonym,
			],
			// rank is the dictionary order of an entry's senses, so it is the display order too.
			with: { senses: { orderBy: (s, { asc }) => [asc(s.rank)] } },
			extras: { homographs: homographCount(entries).as("homographs") },
			limit: MAX_RESULTS,
		});

		// Recorded below the length guard, so only searches that were actually run
		// are counted — a single letter never reaches the database
		// `key` rather than `q` for the same reason lemma_plain exists: "Vīlla "
		// and "villa" are one search.
		//
		// Awaited rather than left floating: the only asynchronous part is
		// decrypting the session cookie, the insert itself is synchronous, and a
		// floating promise here would be an unhandled rejection waiting to happen.
		if (record) {
			await recordSearch(key, results.length);
		}

		return {
			results: results.map(withFrequency),
			suggestions: findSuggestions(key, results.length),
		};
	});

/** Read only on a miss; every lemma is compared in JS — see vault/search.md. */
function findSuggestions(key: string, resultCount: number) {
	if (resultCount > 0 || maxEditsFor(key) === 0) {
		return [];
	}
	const candidates = db
		.selectDistinct({ lemma: entries.lemma, lemmaPlain: entries.lemmaPlain })
		.from(entries)
		.all();
	return suggestLemmas(key, candidates);
}

function findEntry(where: SQL | undefined) {
	return db.query.entries
		.findFirst({
			where,
			with: { senses: { orderBy: (s, { asc }) => [asc(s.rank)] } },
			extras: { homographs: homographCount(entries).as("homographs") },
		})
		.then((entry) => (entry ? withFrequency(entry) : null));
}

/** Another entry spelled the same way, as the detail page's "Also spelled" line names it. */
export type Homograph = Pick<
	Entry,
	"id" | "lemma" | "homonym" | "partOfSpeech"
> & {
	meaningEn: string | null;
};

export type EntryPage = ShownEntry & { siblings: Array<Homograph> };

async function findSiblings(entry: Entry): Promise<Array<Homograph>> {
	const rows = await db.query.entries.findMany({
		where: and(eq(entries.lemma, entry.lemma), ne(entries.id, entry.id)),
		columns: { id: true, lemma: true, homonym: true, partOfSpeech: true },
		with: {
			senses: {
				columns: { meaningEn: true },
				orderBy: (s, { asc }) => [asc(s.rank)],
				limit: 1,
			},
		},
		orderBy: [entries.homonym],
	});

	return rows.map(({ senses, ...row }) => ({
		...row,
		meaningEn: senses[0]?.meaningEn ?? null,
	}));
}

/**
 * Looks an entry up by its URL key: the exact macron form and which homograph
 * it is. lemma_plain would not do here, since malum and mālum share it, and
 * lemma alone would not either, since cum¹ and cum² share that. Brings the
 * other cums along, for the page's "Also spelled" line.
 */
export const getEntry = createServerFn({ method: "GET" })
	.validator((input: unknown) => {
		const raw = (
			typeof input === "object" && input !== null ? input : {}
		) as Record<string, unknown>;

		return {
			lemma: typeof raw.lemma === "string" ? raw.lemma.normalize("NFC") : "",
			homonym:
				typeof raw.homonym === "number" &&
				Number.isInteger(raw.homonym) &&
				raw.homonym > 0
					? raw.homonym
					: 0,
		};
	})
	.handler(async ({ data: { lemma, homonym } }): Promise<EntryPage | null> => {
		if (lemma === "" || homonym === 0) {
			return null;
		}

		const entry = await findEntry(
			and(eq(entries.lemma, lemma), eq(entries.homonym, homonym)),
		);
		if (!entry) {
			return null;
		}

		// Only asked when there is someone to find, which is almost never.
		const siblings = entry.homographs > 1 ? await findSiblings(entry) : [];
		return { ...entry, siblings };
	});

/** The admin desk's lookup: the id survives a rename, the URL key does not. */
export const getEntryById = createServerFn({ method: "GET" })
	.validator((id: unknown) =>
		typeof id === "number" && Number.isInteger(id) && id > 0 ? id : 0,
	)
	.handler(
		async ({ data: id }): Promise<ShownEntry | null> =>
			id === 0 ? null : findEntry(eq(entries.id, id)),
	);

/**
 * Total number of lemmas, for the "search N words" hint on the home page. Every
 * row is one word, so a plain COUNT(*) is the whole story.
 */
export const getEntryCount = createServerFn({ method: "GET" }).handler(
	async (): Promise<number> => {
		const [row] = await db.select({ total: count() }).from(entries);
		return row?.total ?? 0;
	},
);
