import { createServerFn } from "@tanstack/react-start";
import { count, eq, like, sql } from "drizzle-orm";
import { db } from "#/db";
import { entries } from "#/db/schema";

export type Entry = typeof entries.$inferSelect;

/** Below this we don't bother the database — a single letter matches half the dictionary. */
export const MIN_QUERY_LENGTH = 2;

const MAX_RESULTS = 25;

/**
 * "vīlla" -> "villa". Decomposing to NFD turns a macron into its own combining
 * mark, so dropping every mark strips it without touching the base letter. This
 * has to match how lemma_plain was written by the seed script, or lookups
 * silently miss.
 */
function stripMacrons(value: string) {
	return value
		.normalize("NFD")
		.replace(/\p{M}/gu, "")
		.normalize("NFC")
		.toLowerCase();
}

export const searchEntries = createServerFn({ method: "GET" })
	.validator((q: unknown) => (typeof q === "string" ? q.trim() : ""))
	.handler(async ({ data: q }): Promise<Array<Entry>> => {
		if (q.length < MIN_QUERY_LENGTH) {
			return [];
		}

		const key = stripMacrons(q);

		return (
			db
				.select()
				.from(entries)
				.where(like(entries.lemmaPlain, `%${key}%`))
				// Words that start with the query are what the user almost always
				// wants, so rank those above the ones that merely contain it.
				.orderBy(
					sql`case when ${entries.lemmaPlain} like ${`${key}%`} then 0 else 1 end`,
					entries.lemmaPlain,
				)
				.limit(MAX_RESULTS)
		);
	});

/**
 * Looks an entry up by its exact macron form, which is the URL key for the
 * detail page. lemma carries a UNIQUE constraint, so at most one row matches —
 * lemma_plain would not do here, since malum and mālum share it.
 */
export const getEntryByLemma = createServerFn({ method: "GET" })
	.validator((lemma: unknown) => (typeof lemma === "string" ? lemma : ""))
	.handler(async ({ data: lemma }): Promise<Entry | null> => {
		if (lemma === "") {
			return null;
		}

		const [entry] = await db
			.select()
			.from(entries)
			.where(eq(entries.lemma, lemma.normalize("NFC")))
			.limit(1);

		return entry ?? null;
	});

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
