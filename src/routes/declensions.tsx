import { Tooltip, TooltipContent, TooltipTrigger } from "@bremmdev/m7kit";
import { createFileRoute } from "@tanstack/react-router";
import { Info } from "lucide-react";
import column from "#/assets/column-sketch.svg";
import tablet from "#/assets/tablet-sketch.svg";
import { Banner } from "#/components/Banner";
import { Adjectives } from "#/components/declensions/Adjectives";
import { Cases } from "#/components/declensions/Cases";
import { Endings } from "#/components/declensions/Endings";
import { Paradigms } from "#/components/declensions/Paradigms";
import { SectionNav } from "#/components/declensions/SectionNav";
import { Stems } from "#/components/declensions/Stems";
import { Heading } from "#/components/Heading";

export const Route = createFileRoute("/declensions")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{
				title: "Declensions — Dictionarium Latinum",
			},
			{
				name: "description",
				content:
					"The five Latin noun declensions in full: every case, singular and plural, with macrons.",
			},
		],
	}),
});

function DeclensionsBanner() {
	return (
		<Banner
			illustrations={[{ src: column }, { src: tablet }]}
			content={
				<>
					<div className="flex items-center justify-center gap-4 md:justify-start">
						<Heading variant="h1" lang="la">
							Dēclīnātiōnēs.
						</Heading>
						<Tooltip hoverDelay={200} touchBehavior="tap">
							<TooltipTrigger className="my-0 rounded-full bg-parchment-50 p-2 text-gold-600 transition-colors hover:border-accent hover:bg-parchment-100 hover:text-accent">
								<Info size={20} aria-hidden="true" />
								<span className="sr-only">
									What does <span lang="la">Dēclīnātiōnēs</span> mean?
								</span>
							</TooltipTrigger>
							<TooltipContent
								placement="bottom right"
								className="w-72 p-3 text-left text-base shadow-md shadow-ink-900/10"
							>
								<p className="text-ink-700 leading-relaxed">
									<span className="font-semibold text-ink-900">
										&ldquo;Declensions.&rdquo;
									</span>{" "}
									Literally a <em>bending away</em> — the endings lean the word
									into whatever job the sentence gives it.
								</p>
							</TooltipContent>
						</Tooltip>
					</div>
					<p className="mx-auto mt-6 text-lg leading-relaxed md:mx-0 md:text-xl max-w-[80%]">
						A Latin noun changes its ending for every job it does in a sentence.
						Learn the five patterns those endings fall into, and read any noun
						in the dictionary.
					</p>
				</>
			}
		/>
	);
}

function RouteComponent() {
	return (
		<>
			<DeclensionsBanner />
			<SectionNav />
			<div className="mx-auto max-w-page-width space-y-8 md:space-y-16 py-16 md:py-24">
				<Cases />
				<Stems />
				<Paradigms />
				<Endings />
				<Adjectives />
			</div>
		</>
	);
}
