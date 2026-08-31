import { createServerFn } from "@tanstack/react-start";
import { count, eq, like, sql } from "drizzle-orm";

import { db } from "#/db";
import { type EntryWithSenses, entries } from "#/db/schema";
import {
	MAX_RESULTS,
	MIN_QUERY_LENGTH,
	normalizeLemma,
} from "#/utils/search/rules";

export const searchEntries = createServerFn({ method: "GET" })
	.validator((q: unknown) => (typeof q === "string" ? q.trim() : ""))
	.handler(async ({ data: q }): Promise<Array<EntryWithSenses>> => {
		// Shape first, size second. Measuring raw input tells you how much arrived, never what is in it.
		const key = normalizeLemma(q);
		if (key.length < MIN_QUERY_LENGTH) {
			return [];
		}

		return db.query.entries.findMany({
			where: like(entries.lemmaPlain, `%${key}%`),
			// Words that start with the query are what the user almost always
			// wants, so rank those above the ones that merely contain it.
			orderBy: [
				sql`case when ${entries.lemmaPlain} like ${`${key}%`} then 0 else 1 end`,
				entries.lemmaPlain,
			],
			// rank is the dictionary order of an entry's senses, so it is the display order too.
			with: { senses: { orderBy: (s, { asc }) => [asc(s.rank)] } },
			limit: MAX_RESULTS,
		});
	});

/**
 * Looks an entry up by its exact macron form, which is the URL key for the
 * detail page. lemma carries a UNIQUE constraint, so at most one row matches —
 * lemma_plain would not do here, since malum and mālum share it.
 */
export const getEntryByLemma = createServerFn({ method: "GET" })
	.validator((lemma: unknown) => (typeof lemma === "string" ? lemma : ""))
	.handler(async ({ data: lemma }): Promise<EntryWithSenses | null> => {
		if (lemma === "") {
			return null;
		}

		const entry = await db.query.entries.findFirst({
			where: eq(entries.lemma, lemma.normalize("NFC")),
			with: { senses: { orderBy: (s, { asc }) => [asc(s.rank)] } },
		});

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
