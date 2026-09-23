import { Tooltip, TooltipContent, TooltipTrigger } from "@bremmdev/m7kit";
import { createFileRoute } from "@tanstack/react-router";
import { Info } from "lucide-react";
import lamp from "#/assets/lamp-sketch.svg";
import tablet from "#/assets/tablet-sketch.svg";
import { Banner } from "#/components/Banner";
import { Heading } from "#/components/Heading";
import { WordListBuilder } from "#/components/wordlist/WordListBuilder";
import { listEntries } from "#/server/wordlist";
import { parseWordListSearch } from "#/utils/wordlist/rules";

export const Route = createFileRoute("/word-list")({
	// The same parser the RPC validates with, so the URL never holds a filter
	// the server would throw away.
	validateSearch: parseWordListSearch,
	loaderDeps: ({ search }) => search,
	loader: async ({ deps }) => {
		const list = await listEntries({ data: deps });

		// A server function whose response carries no result resolves to
		// undefined instead of throwing — see the home route.
		if (!Array.isArray(list?.entries)) {
			throw new Error(
				"The server did not answer with a word list. It may be restarting — try again in a moment.",
			);
		}

		return list;
	},
	staleTime: 60_000,
	component: RouteComponent,
	head: () => ({
		meta: [
			{
				title: "Word lists — Dictionarium Latinum",
			},
			{
				name: "description",
				content:
					"Build a list of Latin words by part of speech, declension, conjugation and starting letter.",
			},
		],
	}),
});

function WordListBanner() {
	return (
		<Banner
			illustrations={[{ src: tablet }, { src: lamp }]}
			content={
				<>
					<div className="flex items-center justify-center gap-4 md:justify-start">
						<Heading variant="h1" lang="la">
							Index verbōrum.
						</Heading>
						<Tooltip hoverDelay={200} touchBehavior="tap">
							<TooltipTrigger className="my-0 rounded-full bg-parchment-50 p-2 text-gold-600 transition-colors hover:border-accent hover:bg-parchment-100 hover:text-accent">
								<Info size={20} aria-hidden="true" />
								<span className="sr-only">
									What does <span lang="la">Index verbōrum</span> mean?
								</span>
							</TooltipTrigger>
							<TooltipContent
								placement="bottom right"
								className="w-72 p-3 text-left text-base shadow-md shadow-ink-900/10"
							>
								<p className="text-ink-700 leading-relaxed">
									<span className="font-semibold text-ink-900">
										&ldquo;A list of words.&rdquo;
									</span>{" "}
									To a Roman, an <span lang="la">index</span> was anything that
									points the way: the forefinger, an informer, or the tag hung
									from a scroll to name what was inside.
								</p>
							</TooltipContent>
						</Tooltip>
					</div>
					<p className="mx-auto mt-6 text-lg leading-relaxed md:mx-0 md:text-xl max-w-[80%]">
						Build your own word list. Pick a part of speech, narrow it to a
						declension or conjugation, and choose the letters the words start
						with.
					</p>
				</>
			}
		/>
	);
}

function RouteComponent() {
	return (
		<>
			<WordListBanner />
			<section className="mx-auto max-w-5xl px-4 sm:px-8 py-16 md:py-24 space-y-8">
				<WordListBuilder />
			</section>
		</>
	);
}
