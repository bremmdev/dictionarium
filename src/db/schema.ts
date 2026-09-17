import { relations } from "drizzle-orm";
import {
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { nowSeconds } from "../utils/analytics/rules";

export const entries = sqliteTable("entries", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	// display form, with macrons: "labōrō"
	lemma: text("lemma").notNull().unique(),
	// search key, macrons stripped: "laboro"
	lemmaPlain: text("lemma_plain").notNull(),
	partOfSpeech: text("part_of_speech").notNull(), // 'verb' | 'noun' | 'adverb' | ...
	// verbs: "labōrō, labōrāre, labōrāvī, labōrātum"
	// nouns: the genitive, e.g. "puellae"
	// adjectives: the other terminations, e.g. "ācer, ācris, ācre"
	principalParts: text("principal_parts"),
	gender: text("gender"), // nouns: 'm' | 'f' | 'n'
	declension: text("declension"), // nouns/adjectives: '1'..'5'
	// 3rd-declension adjectives: '1' | '2' | '3' — how many nominative
	// terminations it files with. NULL wherever the question does not apply.
	terminations: text("terminations"),
	conjugation: text("conjugation"), // verbs: '1'..'4' | 'irregular'
	notes: text("notes"),
	/**
	 * Nullable, and the NULLs are the point: NULL signifies 'added before we added analytics'
	 *
	 * Stamped in JS rather than by a DDL default because SQLite refuses a
	 * non-constant DEFAULT in ALTER TABLE ADD COLUMN — `DEFAULT (unixepoch())`
	 * is rejected outright there. The consequence: an insert that bypasses
	 * Drizzle (the sqlite3 CLI, Studio's row editor) gets NULL
	 */
	createdAt: integer("created_at").$defaultFn(nowSeconds),
});

export type Entry = typeof entries.$inferSelect;

export const senses = sqliteTable(
	"senses",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		entryId: integer("entry_id")
			.notNull()
			.references(() => entries.id, { onDelete: "cascade" }),
		/** 1 is the core meaning; the rest follow in dictionary order. */
		rank: integer("rank").notNull(),
		meaningEn: text("meaning_en").notNull(),
		/** 'military', 'poetic', 'vulgar' — a label on this sense only. */
		usage: text("usage"),
		exampleLa: text("example_la"),
		exampleEn: text("example_en"),
	},
	// One word cannot have two sense number 2s. Also what lets the seed be re-run idempotently.
	(t) => [uniqueIndex("senses_entry_rank_unique").on(t.entryId, t.rank)],
);

export const entriesRelations = relations(entries, ({ many }) => ({
	senses: many(senses),
}));

export const sensesRelations = relations(senses, ({ one }) => ({
	entry: one(entries, { fields: [senses.entryId], references: [entries.id] }),
}));

export type Sense = typeof senses.$inferSelect;

/** An entry with its senses attached, in rank order — what the detail page reads. */
export type EntryWithSenses = Entry & { senses: Array<Sense> };

/**
 * Analytics: two event logs, one row per thing that happened.
 *
 * Rows rather than rolled-up counters, because rows can be asked anything later
 *
 * Two tables rather than one polymorphic `events` table with a `type` column. A
 * search has a result count and a view does not, so sharing one table would
 * mean a column that is NULL for half its rows purely because of the sharing
 */
export const searchEvents = sqliteTable(
	"search_events",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		createdAt: integer("created_at").notNull().$defaultFn(nowSeconds),
		/**
		 * The normalized key, not what was typed. "Vīlla " and "villa" are one search, 
		 */
		query: text("query").notNull(),
		/** 0 is the interesting value: a word someone wanted and we do not have. */
		resultCount: integer("result_count").notNull(),
	},
	(t) => [index("search_events_created_at").on(t.createdAt)],
);

export const viewEvents = sqliteTable(
	"view_events",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		createdAt: integer("created_at").notNull().$defaultFn(nowSeconds),
		/**
		 * The macronned lemma — the URL key — as text, deliberately not a foreign
		 * key to entries.id. A view records which page was visited, and that fact
		 * does not stop being true when the word is deleted; 
		 * History should not change when the dictionary does.
		 */
		lemma: text("lemma").notNull(),
	},
	(t) => [
		index("view_events_created_at").on(t.createdAt),
		index("view_events_lemma").on(t.lemma),
	],
);

export type SearchEvent = typeof searchEvents.$inferSelect;
export type ViewEvent = typeof viewEvents.$inferSelect;
