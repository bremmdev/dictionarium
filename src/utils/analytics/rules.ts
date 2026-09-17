/**
 * What counts as a period, and how a timestamp is written down.
 *
 * Extracted rather than inlined because there are three callers that must agree:
 * the dashboard route validates the period out of the URL, the server function
 * validates it again off the wire, and the schema stamps timestamps in the same
 * unit the queries later compare against.
 */

/**
 * Unix *seconds*, not milliseconds and not a JS Date.
 *
 * SQLite has no date type, so a timestamp is whatever integer we agree on.
 * Seconds is the unit every SQLite date function already expects — `date(x,
 * 'unixepoch')` reads this directly.
 */
export function nowSeconds(): number {
	return Math.floor(Date.now() / 1000);
}

/**
 * The windows the dashboard offers. A closed set rather than a free integer
 */
export const PERIODS = [7, 30, 90, 365] as const;

export type Period = (typeof PERIODS)[number];

export const DEFAULT_PERIOD: Period = 30;

export function isPeriod(value: number): value is Period {
	return (PERIODS as ReadonlyArray<number>).includes(value);
}

export function parsePeriod(input: unknown): Period {
	const days = typeof input === "string" ? Number(input) : input;
	return typeof days === "number" && isPeriod(days) ? days : DEFAULT_PERIOD;
}

/** The oldest timestamp still inside `days`, in the same unit as `nowSeconds`. */
export function cutoff(days: number, from: number = nowSeconds()): number {
	return from - days * 24 * 60 * 60;
}

/** How many rows a "top" list shows. Long enough to be useful, short enough to read. */
export const TOP_N = 10;

/**
 * Crawlers, previewers and scripts, by user agent.
 *
 * This is needed because counting happens on the server, which is what lets a
 * shared link, an SSR first paint and a reader without JavaScript all count —
 * and means a crawler counts too.
 * 
 * A user-agent string is self-reported, so this is a heuristic and nothing more
 * — it catches the honest majority and misses anything that would rather not be
 * caught. The numbers this feature reports are page views, never people.
 */
const BOT_AGENT =
	/bot\b|bots?\/|crawler|crawling|spider|slurp|archiver|facebookexternalhit|whatsapp|telegram|discord|slackbot|embedly|pinterest|redditbot|applebot|yandex|baiduspider|duckduckbot|semrush|ahrefs|mj12|dotbot|petalbot|bytespider|gptbot|claudebot|ccbot|perplexity|headlesschrome|phantomjs|puppeteer|playwright|python-requests|curl\/|wget|go-http-client|okhttp|scrapy|axios|node-fetch|lighthouse|pingdom|uptimerobot/i;

export function isBotAgent(userAgent: string | undefined): boolean {
	if (!userAgent) {
		return true;
	}
	return BOT_AGENT.test(userAgent);
}
