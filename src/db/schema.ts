import { relations } from "drizzle-orm";
import {
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const entries = sqliteTable("entries", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	// display form, with macrons: "labōrō"
	lemma: text("lemma").notNull().unique(),
	// search key, macrons stripped: "laboro"
	lemmaPlain: text("lemma_plain").notNull(),
	partOfSpeech: text("part_of_speech").notNull(), // 'verb' | 'noun' | 'adverb' | ...
	// verbs: "labōrō, labōrāre, labōrāvī, labōrātum"
	// nouns: the genitive, e.g. "puellae"
	principalParts: text("principal_parts"),
	gender: text("gender"), // nouns: 'm' | 'f' | 'n'
	declension: text("declension"), // nouns/adjectives: '1'..'5'
	conjugation: text("conjugation"), // verbs: '1'..'4' | 'irregular'
	notes: text("notes"),
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
