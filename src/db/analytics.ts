import { and, count, countDistinct, desc, eq, gte, isNull } from "drizzle-orm";

import { db } from "#/db";
import { entries, searchEvents, viewEvents } from "#/db/schema";
import {
	cutoff,
	nowSeconds,
	type Period,
	TOP_N,
} from "#/utils/analytics/rules";

/**
 * Reading the event log back. Queries only — nothing here knows about a
 * request, which is what lets it run against a database from a script.
 */

export type AnalyticsSummary = {
	days: Period;
	/** Unix seconds, so the page can say how fresh the answer is. */
	generatedAt: number;
	wordsAdded: {
		total: number;
		byPartOfSpeech: Array<{ partOfSpeech: string; n: number }>;
	};
	/** Rows with created_at IS NULL — the corpus that predates counting. */
	untimedWords: number;
	searches: {
		total: number;
		distinct: number;
		top: Array<{ query: string; n: number }>;
		wanted: Array<{ query: string; n: number }>;
	};
	views: {
		total: number;
		top: Array<{ lemma: string; n: number }>;
	};
};

/**
 * Every figure the dashboard shows, for one period.
 *
 * A plain function rather than the server function itself, so the queries can
 * be run against a database without a request around them — which is the only
 * way to check the aggregation SQL without a browser and a session. Exporting
 * it is not a hole: it is not an RPC, so nothing off the wire can reach it.
 *
 * Reads use the synchronous terminals (.all()/.get()) rather than `await`,
 * because better-sqlite3 is synchronous and there is nothing to wait for; it
 * also keeps the habit that vault/db.md's transaction rule depends on.
 */
export function summarize(days: Period): AnalyticsSummary {
	const since = cutoff(days);

	// "Verbs added" is one row of this; every other part of speech comes free,
	// which is why this groups rather than filtering to 'verb'.
	const byPartOfSpeech = db
		.select({ partOfSpeech: entries.partOfSpeech, n: count() })
		.from(entries)
		.where(gte(entries.createdAt, since))
		.groupBy(entries.partOfSpeech)
		.orderBy(desc(count()))
		.all();

	// NULL is excluded by `gte` above without being asked to be, so this is
	// reported separately rather than quietly rolled into "nothing added".
	const untimed = db
		.select({ n: count() })
		.from(entries)
		.where(isNull(entries.createdAt))
		.get();

	const searchTotals = db
		.select({ total: count(), distinct: countDistinct(searchEvents.query) })
		.from(searchEvents)
		.where(gte(searchEvents.createdAt, since))
		.get();

	const topSearches = db
		.select({ query: searchEvents.query, n: count() })
		.from(searchEvents)
		.where(gte(searchEvents.createdAt, since))
		.groupBy(searchEvents.query)
		.orderBy(desc(count()), searchEvents.query)
		.limit(TOP_N)
		.all();

	// The panel that pays for the feature: words people looked for and we do
	// not have. No third-party tool could produce this — it needs the result
	// count, which only the search handler ever sees.
	const wanted = db
		.select({ query: searchEvents.query, n: count() })
		.from(searchEvents)
		.where(
			and(gte(searchEvents.createdAt, since), eq(searchEvents.resultCount, 0)),
		)
		.groupBy(searchEvents.query)
		.orderBy(desc(count()), searchEvents.query)
		.limit(TOP_N)
		.all();

	const viewTotal = db
		.select({ total: count() })
		.from(viewEvents)
		.where(gte(viewEvents.createdAt, since))
		.get();

	const topViews = db
		.select({ lemma: viewEvents.lemma, n: count() })
		.from(viewEvents)
		.where(gte(viewEvents.createdAt, since))
		.groupBy(viewEvents.lemma)
		.orderBy(desc(count()), viewEvents.lemma)
		.limit(TOP_N)
		.all();

	return {
		days,
		generatedAt: nowSeconds(),
		wordsAdded: {
			total: byPartOfSpeech.reduce((sum, row) => sum + row.n, 0),
			byPartOfSpeech,
		},
		untimedWords: untimed?.n ?? 0,
		searches: {
			total: searchTotals?.total ?? 0,
			distinct: searchTotals?.distinct ?? 0,
			top: topSearches,
			wanted,
		},
		views: { total: viewTotal?.total ?? 0, top: topViews },
	};
}
