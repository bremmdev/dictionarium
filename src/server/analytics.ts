import { createServerFn } from "@tanstack/react-start";

import { type AnalyticsSummary, summarize } from "#/db/analytics";
import { authMiddleware } from "#/server/auth";
import { recordView } from "#/server/recording";
import { parsePeriod } from "#/utils/analytics/rules";

/**
 * The two analytics RPCs, and nothing else.
 *
 * Kept bare deliberately: the client bundles this module for its stubs, so
 * anything living here that is not a server function would carry its imports
 * into the browser. The write path is in `recording.ts`, the queries in
 * `#/db/analytics` — both reached only from the handlers below, and both
 * stripped from the client build with them.
 */

/**
 * One visit to a word's detail page.
 */
export const recordEntryView = createServerFn({ method: "POST" })
	.validator((lemma: unknown) =>
		typeof lemma === "string" ? lemma.trim().normalize("NFC") : "",
	)
	.handler(({ data: lemma }) => recordView(lemma));

/**
 * The dashboard's one round trip.
 *
 * `authMiddleware` is what actually protects these numbers. The route's
 * `beforeLoad` guard is a redirect for humans — this RPC is reachable directly,
 * whatever page the caller claims to be on. Same reasoning as createEntry.
 */
export const getAnalyticsSummary = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(parsePeriod)
	.handler(({ data: days }): AnalyticsSummary => summarize(days));
