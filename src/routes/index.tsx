import { createFileRoute } from "@tanstack/react-router";
import { Search } from "#/components/search/Search";
import { searchEntries } from "#/server/search";

export const Route = createFileRoute("/")({
	// q is optional so that a bare "/" stays a bare "/". If this always returned
	// a q, the router would 307 every visitor to "/?q=" to normalise the URL.
	validateSearch: (search: Record<string, unknown>): { q?: string } => {
		const q = typeof search.q === "string" ? search.q.trim() : "";
		return q === "" ? {} : { q };
	},
	loaderDeps: ({ search: { q } }) => {
		return {
			q: q ?? "",
		};
	},
	loader: ({ deps: { q } }) => searchEntries({ data: q }),
	// Cache helps when users click back/forward in their browser or refresh the page.
	staleTime: 60_000,
	component: Home,
});

function Home() {
	return (
		<section className="mx-auto max-w-5xl py-8 space-y-8">
			<h2
				className="text-3xl md:text-4xl uppercase tracking-wide mx-auto text-center"
				lang="la"
			>
				Quaere verba latīna
			</h2>
			<Search />
		</section>
	);
}
