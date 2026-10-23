import { Button, useAnnounce } from "@bremmdev/m7kit";
import {
	createFileRoute,
	Link,
	redirect,
	useRouter,
} from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Heading } from "#/components/Heading";
import { TextLink } from "#/components/TextLink";
import { getIsAdmin } from "#/server/auth";
import { getHealth, keepAsFiled, reopen } from "#/server/health";
import type { EntryRef } from "#/utils/entries/links";
import { entryLink, homonymLabel } from "#/utils/entries/links";
import type { CheckId, Problem } from "#/utils/health/checks";
import type { Disagreement } from "#/utils/health/lila";

// "admin_" for the same reason as admin_.stats.tsx: /admin/health without nesting.
export const Route = createFileRoute("/admin_/health")({
	// UX only: authMiddleware on getHealth is what protects the report.
	beforeLoad: async () => {
		if (!(await getIsAdmin())) {
			throw redirect({ to: "/login" });
		}
	},
	loader: () => getHealth(),
	component: Health,
});

/** A heading in Latin with its English gloss, as on /admin/stats. */
function PanelHeading({ la, en }: { la: string; en: string }) {
	return (
		<Heading variant="h4" as="h2" lang="la">
			{la}
			<span className="sr-only" lang="en">{` (${en})`}</span>
		</Heading>
	);
}

const ABOUT: Record<CheckId, string> = {
	lemmas:
		"Each word's search key, its spelling without macrons, matches the word as filed.",
	homonyms: "Words spelled alike are numbered 1, 2, 3… with no gaps.",
	senses:
		"Every word has at least one meaning, numbered 1, 2, 3… with none left blank.",
	inflection:
		"Words that inflect give their declension or conjugation and their principal parts; words that don't leave those fields empty.",
	governs:
		"Every preposition names the case it takes, and its meanings agree with it.",
};

function plural(n: number, one: string, many: string) {
	return `${n.toLocaleString()} ${n === 1 ? one : many}`;
}

/** cum² rather than cum, where it matters; the rest of `where` is English. */
function Where({ entry, where }: { entry: EntryRef; where: string }) {
	return (
		<>
			<Link
				{...entryLink(entry)}
				lang="la"
				className="focus-ring font-bold text-ink-900 hover:text-accent"
			>
				{homonymLabel({ ...entry, homographs: 1 })}
			</Link>
			<span className="text-ink-600">{where.slice(entry.lemma.length)}</span>
		</>
	);
}

function EditLink({ entry }: { entry: EntryRef }) {
	return (
		<TextLink to="/admin" search={{ id: entry.id }} className="text-sm">
			Edit
			<span className="sr-only" lang="la">
				{` ${homonymLabel({ ...entry, homographs: 1 })}`}
			</span>
		</TextLink>
	);
}

const ROW =
	"flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 py-3";

function ProblemList({ problems }: { problems: Array<Problem> }) {
	if (problems.length === 0) {
		return <p className="text-ink-600 italic">All clear.</p>;
	}

	return (
		<ul className="divide-y divide-parchment-200 border-parchment-200 border-y">
			{problems.map((p) => (
				<li key={`${p.where}: ${p.message}`} className={ROW}>
					<div className="min-w-0 flex-1">
						<Where entry={p.entry} where={p.where} />
						<p className="text-ink-700">{p.message}</p>
					</div>
					<EditLink entry={p.entry} />
				</li>
			))}
		</ul>
	);
}

function SecondOpinions({
	open,
	accepted,
}: {
	open: Array<Disagreement>;
	accepted: Array<Disagreement>;
}) {
	const router = useRouter();
	const announce = useAnnounce();
	const headingRef = useRef<HTMLDivElement>(null);
	const [pending, setPending] = useState<string | null>(null);

	const act = async (d: Disagreement, keep: boolean) => {
		const key = `${d.entry.id}-${d.field}`;
		if (pending) return;
		setPending(key);
		const word = homonymLabel({ ...d.entry, homographs: 1 });

		try {
			await (keep ? keepAsFiled : reopen)({
				data: { id: d.entry.id, field: d.field },
			});
			await router.invalidate();
			// The row has gone, so focus would fall to the page: hold it here.
			headingRef.current?.focus();
			announce(
				keep
					? `${word} is kept as filed, under Accepted.`
					: `${word} is back among the second opinions.`,
			);
		} catch (err) {
			announce(
				err instanceof Error && err.message
					? err.message
					: `Could not save that for ${word}. Try again.`,
				{ politeness: "assertive" },
			);
		} finally {
			setPending(null);
		}
	};

	const button = (d: Disagreement, keep: boolean) => {
		const key = `${d.entry.id}-${d.field}`;
		return (
			<Button
				variant="secondary"
				className="text-sm"
				isLoading={pending === key}
				onClick={() => act(d, keep)}
			>
				{keep ? "Fine as filed" : "Undo"}
				<span className="sr-only" lang="la">
					{` ${homonymLabel({ ...d.entry, homographs: 1 })}`}
				</span>
			</Button>
		);
	};

	return (
		<section className="space-y-4">
			<div ref={headingRef} tabIndex={-1} className="outline-none">
				<PanelHeading la="Alia sententia" en="a second opinion" />
			</div>
			<p className="text-ink-600 text-sm italic">
				Where LiLa files a word under another class or gender.
			</p>
			<p className="text-ink-600 text-sm">
				LiLa is the lexicon behind the frequency badges. These are not errors:
				LiLa files <i lang="la">ferō</i> as irregular, this dictionary as 3rd
				conjugation, and both are defensible. Mark one fine as filed and it
				stays hidden until the word or LiLa changes.
			</p>

			{open.length === 0 ? (
				<p className="text-ink-600 italic">LiLa agrees with every word.</p>
			) : (
				<ul className="divide-y divide-parchment-200 border-parchment-200 border-y">
					{open.map((d) => (
						<li key={`${d.entry.id}-${d.field}`} className={ROW}>
							<div className="min-w-0 flex-1">
								<Where entry={d.entry} where={d.where} />
								<p className="text-ink-700">{d.message}</p>
							</div>
							<div className="flex items-center gap-4">
								<EditLink entry={d.entry} />
								{button(d, true)}
							</div>
						</li>
					))}
				</ul>
			)}

			{accepted.length > 0 && (
				<details className="group">
					<summary className="focus-ring cursor-pointer font-semibold text-gold-600 text-sm uppercase tracking-[0.18em]">
						Accepted ({accepted.length})
					</summary>
					<ul className="mt-3 divide-y divide-parchment-200 border-parchment-200 border-y">
						{accepted.map((d) => (
							<li key={`${d.entry.id}-${d.field}`} className={ROW}>
								<div className="min-w-0 flex-1">
									<Where entry={d.entry} where={d.where} />
									<p className="text-ink-700">{d.message}</p>
								</div>
								{button(d, false)}
							</li>
						))}
					</ul>
				</details>
			)}
		</section>
	);
}

function Health() {
	const report = Route.useLoaderData();
	const errors = report.checks.reduce((n, c) => n + c.problems.length, 0);

	return (
		<section className="mx-auto max-w-4xl space-y-12 px-4 sm:px-8 py-12 md:py-16">
			<div className="space-y-4">
				<Heading variant="h2" as="h1">
					Health
				</Heading>
				<p className="text-ink-600">
					Every check below ran just now, against this server&rsquo;s database:
					the same rules as <code>npm run check</code>, over{" "}
					{plural(report.entries, "entry", "entries")}.
				</p>
				<p className="font-semibold text-ink-900">
					{plural(errors, "error", "errors")} ·{" "}
					{plural(report.open.length, "second opinion", "second opinions")}
				</p>
			</div>

			{report.checks.map((check) => (
				<section key={check.id} className="space-y-4">
					<PanelHeading la={check.la} en={check.en} />
					<p className="text-ink-600 text-sm italic">{ABOUT[check.id]}</p>
					<ProblemList problems={check.problems} />
				</section>
			))}

			<SecondOpinions open={report.open} accepted={report.accepted} />
		</section>
	);
}
