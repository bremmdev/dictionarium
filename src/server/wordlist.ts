import { createServerFn } from "@tanstack/react-start";

import { findWordList } from "#/db/wordlist";
import { authMiddleware } from "#/server/auth";
import { parseWordListSearch } from "#/utils/wordlist/rules";

/** Kept bare, like analytics.ts: the query lives in #/db/wordlist. */
export const listEntries = createServerFn({ method: "GET" })
	.validator(parseWordListSearch)
	.handler(({ data }) => findWordList(data, false));

/** The same list, narrowed to the words the admin finds hard to remember. */
export const listDifficultEntries = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(parseWordListSearch)
	.handler(({ data }) => findWordList(data, true));
