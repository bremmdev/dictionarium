import { Tooltip, TooltipContent, TooltipTrigger } from "@bremmdev/m7kit";
import { createFileRoute } from "@tanstack/react-router";
import { Info } from "lucide-react";
import scroll from "#/assets/scroll-sketch.svg";
import templum from "#/assets/temple-sketch.svg";
import { Banner } from "#/components/Banner";
import { Heading } from "#/components/Heading";
import { Search } from "#/components/search/Search";
import { getEntryCount, searchEntries } from "#/server/search";

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
	loader: async ({ deps: { q } }) => {
		const [results, total] = await Promise.all([
			searchEntries({ data: q }),
			getEntryCount(),
		]);

		return { results, total };
	},
	// Cache helps when users click back/forward in their browser or refresh the page.
	staleTime: 60_000,
	component: Home,
});

function HomeBanner() {
	return (
		<Banner
			illustrations={[{ src: scroll }, { src: templum }]}
			content={
				<>
					<p className="text-gold-600 text-sm font-medium uppercase tracking-[0.32em] md:text-base">
						A dictionary for the Latin student
					</p>
					<div className="mt-6 flex items-center justify-center gap-4 md:justify-start">
						<Heading variant="h1" lang="la">
							Verba sub manū.
						</Heading>
						<Tooltip hoverDelay={200} touchBehavior="tap">
							<TooltipTrigger className="my-0 rounded-full bg-parchment-50 p-2 text-gold-600 transition-colors hover:border-accent hover:bg-parchment-100 hover:text-accent">
								<Info size={20} aria-hidden="true" />
								<span className="sr-only">
									What does <span lang="la">Verba sub manū</span> mean?
								</span>
							</TooltipTrigger>
							<TooltipContent
								placement="bottom right"
								className="w-72 p-3 text-left text-base shadow-md shadow-ink-900/10"
							>
								<p className="text-ink-700 leading-relaxed">
									<span className="font-semibold text-ink-900">
										&ldquo;Words at hand&rdquo; or &ldquo;words within
										reach.&rdquo;
									</span>{" "}
									The macron on <span className="text-accent">ū</span> marks a
									long vowel — length alone can tell two words apart.
								</p>
							</TooltipContent>
						</Tooltip>
					</div>
					<p className="mx-auto mt-6 text-lg leading-relaxed md:mx-0 md:text-xl max-w-[80%]">
						Look up any Latin word and read its principal parts, its part of
						speech, and its senses in order of use. Explore meaning, usage and
						more.
					</p>
				</>
			}
		/>
	);
}

function Home() {
	return (
		<>
			<HomeBanner />

			<section className="mx-auto max-w-5xl px-8 py-16 md:py-24 space-y-8">
				<Heading
					variant="h2"
					className="mx-auto text-center uppercase tracking-wide"
					lang="la"
				>
					Quaere verba latīna
				</Heading>
				<Search />
			</section>
		</>
	);
}
