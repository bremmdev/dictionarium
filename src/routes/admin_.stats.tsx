import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Heading } from "#/components/Heading";
import { Table } from "#/components/Table";
import { getAnalyticsSummary } from "#/server/analytics";
import { getIsAdmin } from "#/server/auth";
import { DEFAULT_PERIOD, parsePeriod, PERIODS } from "#/utils/analytics/rules";
import { homonymLabel } from "#/utils/entries/links";
import {
	type Day,
	DEADLINE,
	PACE_WEEKS,
	toDate,
	type V1Progress,
	WEEKLY_TARGET,
} from "#/utils/progress/rules";

// "admin_" rather than "admin": the trailing underscore opts this route out of
// nesting, so it serves /admin/stats without turning the existing /admin page
// into a layout that would need an <Outlet /> it has no other use for.
export const Route = createFileRoute("/admin_/stats")({
	// UX only, exactly as on /admin. What actually protects the numbers is
	// authMiddleware on getAnalyticsSummary — the RPC is reachable directly,
	// whatever page the caller claims to be on.
	beforeLoad: async () => {
		if (!(await getIsAdmin())) {
			throw redirect({ to: "/login" });
		}
	},
	// The period lives in the URL for the same reason the search query does:
	// it makes the view bookmarkable, shareable and back-button-correct without
	// a line of state management. parsePeriod never throws — a mangled ?days=
	// falls back rather than 400ing a dashboard.
	//
	// The default is dropped rather than written out, so a bare /admin/stats
	// stays bare instead of the router redirecting every visit to ?days=30 —
	// the same reason the home route drops an empty q.
	validateSearch: (search: Record<string, unknown>): { days?: number } => {
		const days = parsePeriod(search.days);
		return days === DEFAULT_PERIOD ? {} : { days };
	},
	loaderDeps: ({ search: { days } }) => ({ days: days ?? DEFAULT_PERIOD }),
	loader: ({ deps: { days } }) => getAnalyticsSummary({ data: days }),
	head: () => ({
		meta: [{ title: "Stats — Dictionarium Latinum" }],
	}),
	component: Stats,
});

/** A heading in Latin with its English gloss, the way the rest of the app sets them. */
function PanelHeading({ la, en }: { la: string; en: string }) {
	return (
		<Heading variant="h4" as="h2" lang="la">
			{la}
			<span className="sr-only" lang="en">{` (${en})`}</span>
		</Heading>
	);
}

/** One number, large, with what it counts underneath; `of` is what it is out of. */
function Figure({
	value,
	of,
	label,
}: {
	value: number | string;
	of?: number;
	label: string;
}) {
	return (
		<div className="rounded-lg border border-parchment-200 bg-parchment-100 px-4 py-3">
			<p className="font-bold text-3xl text-ink-900 tabular-nums">
				{value.toLocaleString()}
				{of !== undefined && (
					<span className="font-semibold text-ink-600 text-lg">
						{` of ${of.toLocaleString()}`}
					</span>
				)}
			</p>
			<p className="mt-1 font-semibold text-gold-600 text-label uppercase tracking-[0.18em]">
				{label}
			</p>
		</div>
	);
}

/**
 * A ranked list. Every panel here is the same two-column shape — a thing and how
 * often it happened — so the empty state is written once rather than four times.
 * An empty table is the normal state on the day this ships, and a bare frame
 * with no rows reads as broken.
 */
function TopTable({
	label,
	rows,
	empty,
	lang,
}: {
	label: string;
	rows: Array<{ key: string; n: number }>;
	empty: string;
	lang?: string;
}) {
	if (rows.length === 0) {
		return <p className="text-ink-600 italic">{empty}</p>;
	}

	return (
		<Table
			columns={[
				{ key: "subject", label },
				{ key: "n", label: "Times" },
			]}
			rows={rows.map((row) => ({
				id: row.key,
				cells: {
					subject: <span lang={lang}>{row.key}</span>,
					n: <span className="tabular-nums">{row.n.toLocaleString()}</span>,
				},
			}))}
		/>
	);
}

/** "25 February 2027"; a Day is a UTC midnight, so it is formatted in UTC. */
function formatDate(day: Day) {
	return toDate(day).toLocaleDateString("en-GB", {
		timeZone: "UTC",
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

/** "Monday 16 November". */
function formatWeekday(day: Day) {
	return toDate(day).toLocaleDateString("en-GB", {
		timeZone: "UTC",
		weekday: "long",
		day: "numeric",
		month: "long",
	});
}

function V1Panel({ v1 }: { v1: V1Progress }) {
	const pace = v1.pace.toLocaleString("en", { maximumFractionDigits: 1 });

	return (
		<section className="space-y-4">
			<div className="flex flex-wrap items-center gap-3">
				<PanelHeading la="Prōgressus" en="progress towards v1" />
				{v1.behind && (
					<span className="rounded-full border border-accent px-2 py-0.5 font-semibold text-accent text-label uppercase tracking-[0.18em]">
						Behind
					</span>
				)}
			</div>

			<div className="grid gap-3 sm:grid-cols-3">
				<Figure value={v1.filed} of={v1.total} label="Core filed" />
				<Figure value={v1.week.filed} of={v1.week.target} label="this week" />
				<Figure
					value={v1.projected ? formatDate(v1.projected) : "—"}
					label="projected v1"
				/>
			</div>

			<p className="text-ink-600 text-sm">
				{v1.remaining === 0
					? "Every Core word is filed: v1 is reached."
					: v1.projected === null
						? `Nothing was filed in the last ${PACE_WEEKS} weeks, so there is no pace to project from.`
						: `At ${pace} a week over the last ${PACE_WEEKS} weeks, the ${v1.remaining.toLocaleString()} Core words left are filed by ${formatDate(v1.projected)}.`}{" "}
				The deadline is {formatDate(DEADLINE)}. This week began{" "}
				{formatWeekday(v1.week.start)}, Amsterdam time; its target is set each
				month from what is left, and never below {WEEKLY_TARGET}.
			</p>
		</section>
	);
}

function PeriodPicker({ current }: { current: number }) {
	return (
		<nav aria-label="Reporting period" className="flex flex-wrap gap-2">
			{PERIODS.map((days) => (
				<Link
					key={days}
					to="/admin/stats"
					search={days === DEFAULT_PERIOD ? {} : { days }}
					aria-current={days === current ? "page" : undefined}
					className={`focus-ring rounded-full border px-3 py-1 font-semibold text-label uppercase tracking-[0.18em] ${
						days === current
							? "border-accent bg-parchment-100 text-accent"
							: "border-parchment-300 bg-parchment-50 text-gold-600 hover:border-accent hover:text-accent"
					}`}
				>
					{days} days
				</Link>
			))}
		</nav>
	);
}

function Stats() {
	const summary = Route.useLoaderData();
	const { wordsAdded, searches, views, untimedWords, days, v1 } = summary;

	return (
		<section className="mx-auto max-w-4xl space-y-12 px-4 sm:px-8 py-12 md:py-16">
			<Heading variant="h2" as="h1">
				Stats
			</Heading>

			<V1Panel v1={v1} />

			<div className="space-y-4">
				<p className="text-ink-600">
					Counted in this dictionary&rsquo;s own database, nowhere else. The
					window is the last {days} days, rolling — not calendar days, so no
					timezone is involved.
				</p>
				<PeriodPicker current={days} />
			</div>

			<div className="grid gap-3 sm:grid-cols-3">
				<Figure value={wordsAdded.total} label="words added" />
				<Figure value={searches.total} label="searches" />
				<Figure value={views.total} label="words read" />
			</div>

			<section className="space-y-4">
				<PanelHeading la="Verba addita" en="words added" />

				<TopTable
					label="Part of speech"
					rows={wordsAdded.byPartOfSpeech.map((row) => ({
						key: row.partOfSpeech,
						n: row.n,
					}))}
					empty="No words filed in this period."
				/>

				{untimedWords > 0 && (
					<p className="text-ink-600 text-sm">
						{untimedWords.toLocaleString()} older{" "}
						{untimedWords === 1 ? "word carries" : "words carry"} no filing date
						and {untimedWords === 1 ? "is" : "are"} never counted here — they
						were filed before the dictionary started keeping one.
					</p>
				)}
			</section>

			<section className="space-y-4">
				<PanelHeading la="Quaesīta" en="what was searched for" />
				<p className="text-ink-600 text-sm">
					{searches.total.toLocaleString()} searches over{" "}
					{searches.distinct.toLocaleString()} distinct terms. A repeat of the
					same search within a minute is served from the router&rsquo;s cache
					and never reaches the database, so this is a floor, not a total.
				</p>
				<TopTable
					label="Term"
					lang="la"
					rows={searches.top.map((row) => ({ key: row.query, n: row.n }))}
					empty="No searches recorded in this period."
				/>
			</section>

			<section className="space-y-4">
				<PanelHeading la="Verba dēsīderāta" en="words wanted but missing" />
				<p className="text-ink-600 text-sm">
					Searches that came back empty — a list of words to file, in the order
					people asked for them.
				</p>
				<TopTable
					label="Term"
					lang="la"
					rows={searches.wanted.map((row) => ({ key: row.query, n: row.n }))}
					empty="Every search in this period found something."
				/>
			</section>

			<section className="space-y-4">
				<PanelHeading la="Verba lecta" en="words read" />
				<TopTable
					label="Word"
					lang="la"
					rows={views.top.map((row) => ({ key: homonymLabel(row), n: row.n }))}
					empty="No detail pages visited in this period."
				/>
			</section>

			<p className="text-ink-600 text-sm">
				Your own visits are not counted while you are logged in, and requests
				that name themselves as crawlers are dropped. A user agent is
				self-reported, so these are page views, never people.
			</p>
		</section>
	);
}
