import { createServerFn } from "@tanstack/react-start";
import { asc, eq, sql } from "drizzle-orm";

import { db } from "#/db";
import { type Proverb, proverbs } from "#/db/schema";
import { authMiddleware } from "#/server/auth";
import { ANONYMOUS, parseProverbDraft } from "#/utils/proverbs/rules";

/**
 * Every proverb on file, for the desk's edit picker. Whole rows, because picking
 * one fills the form from what is already here rather than asking again.
 */
export const getProverbs = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(
		async (): Promise<Array<Proverb>> =>
			db.select().from(proverbs).orderBy(asc(proverbs.textPlain)),
	);

/**
 * Every proverb, for the public /proverbs page: by author, A to Z, and by text
 * within an author. ANONYMOUS goes last 
 */
export const listProverbs = createServerFn({ method: "GET" }).handler(
	async (): Promise<Array<Proverb>> =>
		db
			.select()
			.from(proverbs)
			.orderBy(
				sql`${proverbs.author} = ${ANONYMOUS}`,
				sql`${proverbs.author} collate nocase`,
				asc(proverbs.textPlain),
			),
);

/** createEntry's counterpart. The validator is the gate here too. */
export const createProverb = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(parseProverbDraft)
	.handler(async ({ data }) =>
		db.transaction((tx) => {
			// The same proverb filed twice is the same letters, whatever the
			// macrons and commas say: "Veni, vidi, vici" is Vēnī, vīdī, vīcī typed
			// in a hurry. So the clash is looked for on text_plain, which also
			// covers the exact match the UNIQUE on text_la stops.
			const clash = tx
				.select({ id: proverbs.id, textLa: proverbs.textLa })
				.from(proverbs)
				.where(eq(proverbs.textPlain, data.textPlain))
				.get();

			if (clash) {
				throw new Error(`“${clash.textLa}” is already filed.`);
			}

			tx.insert(proverbs).values(data).run();

			return { textLa: data.textLa };
		}),
	);

/**
 * The id travels beside the draft, as it does for updateEntry: the Latin is one
 * of the things an edit may change, so it cannot say which row is being changed.
 */
export const updateProverb = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input: unknown) => {
		const raw = (
			typeof input === "object" && input !== null ? input : {}
		) as Record<string, unknown>;

		const id = raw.id;

		if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
			throw new Error("That edit does not say which proverb it belongs to.");
		}

		return { id, draft: parseProverbDraft(raw) };
	})
	.handler(async ({ data: { id, draft } }) =>
		db.transaction((tx) => {
			const existing = tx
				.select({ id: proverbs.id })
				.from(proverbs)
				.where(eq(proverbs.id, id))
				.get();

			if (!existing) {
				throw new Error("That proverb is no longer on file.");
			}

			// Looked for on text_plain, as on a create. A proverb keeping its own
			// text is not a clash with itself.
			const clash = tx
				.select({ id: proverbs.id, textLa: proverbs.textLa })
				.from(proverbs)
				.where(eq(proverbs.textPlain, draft.textPlain))
				.get();

			if (clash && clash.id !== id) {
				throw new Error(`“${clash.textLa}” is already filed.`);
			}

			tx.update(proverbs).set(draft).where(eq(proverbs.id, id)).run();

			return { textLa: draft.textLa };
		}),
	);
