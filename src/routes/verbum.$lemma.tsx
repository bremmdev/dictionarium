import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Heading } from "#/components/Heading";
import { grammarLabel } from "#/components/search/EntryCard";
import type { EntryWithSenses } from "#/db/schema";
import { getEntryByLemma } from "#/server/search";

export const Route = createFileRoute("/verbum/$lemma")({
	// q is only carried so the back link can restore the search the user came
	// from. It is optional, so a bare /verbum/ambulō stays a bare URL.
	validateSearch: (search: Record<string, unknown>): { q?: string } => {
		const q = typeof search.q === "string" ? search.q.trim() : "";
		return q === "" ? {} : { q };
	},
	loader: async ({ params: { lemma } }) => {
		const entry = await getEntryByLemma({ data: lemma });

		if (!entry) {
			throw notFound();
		}

		return entry;
	},
	component: WordDetail,
	notFoundComponent: NotFound,
});

function BackLink() {
	const { q } = Route.useSearch();

	return (
		<Link
			to="/"
			search={q === undefined ? {} : { q }}
			className="focus-ring inline-flex items-center gap-2 text-accent"
		>
			<ArrowLeft className="h-4 w-4" aria-hidden="true" />
			{q === undefined ? "Back to search" : `Back to results for “${q}”`}
		</Link>
	);
}

function WordDetail() {
	const entry = Route.useLoaderData();

	return (
		<article className="mx-auto max-w-page-width px-8 py-16 md:py-24 space-y-6">
			<BackLink />

			<header className="border-parchment-200 border-b pb-4">
				{/* The lemma is the page's h1, but it sits on a text page rather than
				    in a banner, so it takes the section step of the scale. */}
				<Heading variant="h2" as="h1" className="font-bold" lang="la">
					{entry.lemma}
				</Heading>
				<p className="mt-2 text-ink-500 text-sm uppercase tracking-[0.2em]">
					{grammarLabel(entry)}
				</p>
			</header>

			{entry.principalParts && (
				<section>
					<Heading variant="h4" as="h2">
						Principal parts
					</Heading>
					<p className="mt-1 text-ink-700 text-xl italic" lang="la">
						{entry.principalParts}
					</p>
				</section>
			)}

			<Meanings entry={entry} />

			{entry.notes && (
				<section>
					<Heading variant="h4" as="h2">
						Notes
					</Heading>
					<p className="mt-1 border-accent border-l-2 pl-3 text-ink-700">
						{entry.notes}
					</p>
				</section>
			)}
		</article>
	);
}

/**
 * The senses in rank order — a dictionary's numbered meanings. The rank is
 * printed rather than left to a list marker, so a gap in the ranks shows up as
 * a gap here instead of being silently renumbered.
 */
function Meanings({ entry }: { entry: EntryWithSenses }) {
	const senses = entry.senses;

	return (
		<section>
			<Heading variant="h4" as="h2">
				{senses.length > 1 ? "Meanings" : "Meaning"}
			</Heading>

			{/* entries.meaning_en is the one-line gloss every entry still carries;
			    it stands in for an entry whose senses have not been written yet. */}
			{senses.length === 0 ? (
				<p className="mt-1 text-ink-900 text-xl">{entry.meaningEn}</p>
			) : (
				<ol className="mt-2 space-y-4">
					{senses.map((sense) => (
						<li key={sense.id} className="flex gap-3">
							<span className="mt-1.5 font-semibold text-accent text-sm tabular-nums">
								{sense.rank}.
							</span>
							<div>
								<p className="text-ink-900 text-xl">
									{sense.usage && (
										<span className="mr-2 align-middle text-ink-500 text-xs uppercase tracking-[0.18em]">
											{sense.usage}
										</span>
									)}
									{sense.meaningEn}
								</p>

								{sense.exampleLa && (
									<p className="mt-1 text-ink-700 italic" lang="la">
										{sense.exampleLa}
									</p>
								)}
								{sense.exampleEn && (
									<p className="text-ink-500">
										&ldquo;{sense.exampleEn}&rdquo;
									</p>
								)}
							</div>
						</li>
					))}
				</ol>
			)}
		</section>
	);
}

function NotFound() {
	const { lemma } = Route.useParams();

	return (
		<div className="mx-auto max-w-3xl px-8 py-16 md:py-24 space-y-4 text-center">
			<p className="font-bold text-2xl text-accent" lang="la">
				Nihil inventum.
			</p>
			<p className="text-ink-500 text-lg">
				No entry for &ldquo;<span lang="la">{lemma}</span>&rdquo;.
			</p>
			<Link to="/" search={{}} className="focus-ring inline-block text-accent">
				Back to search
			</Link>
		</div>
	);
}
