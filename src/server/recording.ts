import { eq } from "drizzle-orm";

import { db } from "#/db";
import { entries, searchEvents, viewEvents } from "#/db/schema";
import { isUncounted } from "#/server/visitor";

/**
 * The analytics write path.
 *
 * Separate from `src/server/analytics.ts` on purpose, and the reason is a build
 * constraint rather than taste: that module exports server functions, so the
 * client bundles it to keep their RPC stubs. A plain exported function sitting
 * beside them would drag its imports — `#/db`, and through `visitor.ts` the
 * server-only request helpers — into the browser build, which the import
 * protection plugin refuses outright. Everything here is reached only from
 * inside handlers, so it is stripped from the client graph along with them.
 */

/**
 * Every analytics write goes through here.
 *
 * An analytics failure must never be the reason a word cannot be read. Same
 * posture as `scheduleBackups` in src/db/backup.ts: loud in the log, invisible
 * on the page. The callback is synchronous because better-sqlite3 is — there is
 * no promise here to swallow, so a `catch` really does catch everything.
 */
function record(what: string, write: () => void): void {
	try {
		write();
	} catch (err) {
		console.error(`analytics: could not record ${what}.`, err);
	}
}

/**
 * One executed search. Called from `searchEntries`, which has already normalized
 * the query and knows how many rows came back.
 *
 * Not a server function: the search RPC is already on the server when it calls
 * this, and wrapping it in a second one would put an HTTP hop in the middle of
 * a function call.
 */
export async function recordSearch(
	query: string,
	resultCount: number,
): Promise<void> {
	if (await isUncounted()) {
		return;
	}

	record("a search", () => {
		db.insert(searchEvents).values({ query, resultCount }).run();
	});
}

/**
 * One visit to a word's detail page.
 *
 * Checks that the lemma is a word we actually have: the loader only ever calls
 * this with an entry it just read, so the check costs one indexed lookup on the
 * happy path, and it is the only thing standing between the most-read list and
 * anyone who feels like POSTing nonsense at the public endpoint.
 */
export async function recordView(lemma: string): Promise<void> {
	if (lemma === "" || (await isUncounted())) {
		return;
	}

	record("a page view", () => {
		const known = db
			.select({ id: entries.id })
			.from(entries)
			.where(eq(entries.lemma, lemma))
			.get();

		if (!known) {
			return;
		}

		db.insert(viewEvents).values({ lemma }).run();
	});
}
