import { getRequestHeader } from "@tanstack/react-start/server";

import { useAppSession } from "#/server/session";
import { isBotAgent } from "#/utils/analytics/rules";

/**
 * Who does not appear in the numbers.
 *
 * Its own module for the same reason `session.ts` is separate from `auth.ts`:
 * `@tanstack/react-start/server` is server-only, and a module that imports it
 * must never end up in the client bundle. `analytics.ts` does end up there —
 * it exports a server function, and the client keeps a stub of that — so the
 * request-reading lives here, where only handlers reach it and the import is
 * dropped from the client graph along with them.
 */

/**
 * Never throws. `useAppSession` does, when ADMIN_SESSION_SECRET is missing or
 * short, and there is no request context at all when a script imports this.
 * Neither is a reason to break the page being counted — and "not the admin" is
 * the answer that keeps counting rather than silently stopping.
 */
async function isAdminCaller(): Promise<boolean> {
	try {
		// useAppSession is the session helper from @tanstack/react-start/server,
		// not a React hook — it reads the request's cookie. Biome matches it on
		// the "use" prefix alone, and the rule only fires because the call sits
		// inside a try, which is exactly what this function is for.
		// biome-ignore lint/correctness/useHookAtTopLevel: not a React hook, see above
		return (await useAppSession()).data.isAdmin === true;
	} catch {
		return false;
	}
}

/**
 * Whether this request should be left out of the numbers entirely.
 *
 * Two exclusions, both of which quietly dominate the figures without them: you,
 * and crawlers. You browsing your own dictionary is not traffic — without the
 * session check the most-read list is largely a record of the last word you
 * edited. Crawlers are the price of counting on the server, which is also what
 * lets a shared link and a reader without JavaScript count at all.
 */
export async function isUncounted(): Promise<boolean> {
	let userAgent: string | undefined;
	try {
		userAgent = getRequestHeader("user-agent");
	} catch {
		// No request context: a script, not a reader. isBotAgent says the same
		// thing about a missing agent, so fall through rather than special-case.
	}

	if (isBotAgent(userAgent)) {
		return true;
	}

	return isAdminCaller();
}
