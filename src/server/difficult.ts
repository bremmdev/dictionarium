import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

import { db } from "#/db";
import { difficultWords } from "#/db/schema";
import { authMiddleware } from "#/server/auth";

function entryId(id: unknown) {
	if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
		throw new Error("That does not say which entry it belongs to.");
	}
	return id;
}

/** Whether the admin has marked this word hard to remember. */
export const getIsDifficult = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(entryId)
	.handler(async ({ data: id }) => {
		const row = await db
			.select({ entryId: difficultWords.entryId })
			.from(difficultWords)
			.where(eq(difficultWords.entryId, id))
			.get();
		return row !== undefined;
	});

export const setDifficult = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input: unknown) => {
		const raw = (
			typeof input === "object" && input !== null ? input : {}
		) as Record<string, unknown>;
		return { id: entryId(raw.id), difficult: raw.difficult === true };
	})
	.handler(async ({ data: { id, difficult } }) => {
		if (difficult) {
			await db
				.insert(difficultWords)
				.values({ entryId: id })
				.onConflictDoNothing();
		} else {
			await db.delete(difficultWords).where(eq(difficultWords.entryId, id));
		}
		return { difficult };
	});
