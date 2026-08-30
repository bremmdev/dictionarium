import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
	meaningEn: text("meaning_en").notNull(),
	notes: text("notes"),
});

export type Entry = typeof entries.$inferSelect;
