import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { grammarLabel } from "#/components/search/EntryCard";
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
		<article className="mx-auto max-w-3xl py-8 space-y-6">
			<BackLink />

			<header className="border-parchment-200 border-b pb-4">
				<h2 className="font-bold text-4xl text-ink-900" lang="la">
					{entry.lemma}
				</h2>
				<p className="mt-2 text-ink-500 text-sm uppercase tracking-[0.2em]">
					{grammarLabel(entry)}
				</p>
			</header>

			{entry.principalParts && (
				<section>
					<h3 className="font-bold text-ink-900 text-lg">Principal parts</h3>
					<p className="mt-1 text-ink-700 text-xl italic" lang="la">
						{entry.principalParts}
					</p>
				</section>
			)}

			<section>
				<h3 className="font-bold text-ink-900 text-lg">Meaning</h3>
				<p className="mt-1 text-ink-900 text-xl">{entry.meaningEn}</p>
			</section>

			{entry.notes && (
				<section>
					<h3 className="font-bold text-ink-900 text-lg">Notes</h3>
					<p className="mt-1 border-accent border-l-2 pl-3 text-ink-700">
						{entry.notes}
					</p>
				</section>
			)}
		</article>
	);
}

function NotFound() {
	const { lemma } = Route.useParams();

	return (
		<div className="mx-auto max-w-3xl py-8 space-y-4 text-center">
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
