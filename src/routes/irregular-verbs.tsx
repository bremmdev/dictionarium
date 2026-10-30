import { Tooltip, TooltipContent, TooltipTrigger } from "@bremmdev/m7kit";
import { createFileRoute } from "@tanstack/react-router";
import { Info } from "lucide-react";
import aquila from "#/assets/aquila-sketch.svg";
import mosaic from "#/assets/mosaic-sketch.svg";
import { Banner } from "#/components/Banner";
import { Heading } from "#/components/Heading";
import { IrregularVerbs } from "#/components/irregular-verbs/IrregularVerbs";
import { LatinWord } from "#/components/LatinWord";

export const Route = createFileRoute("/irregular-verbs")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{
				title: "Irregular verbs — Dictionarium Latinum",
			},
			{
				name: "description",
				content:
					"The Latin irregular verbs in full, with macrons: sum and its compounds.",
			},
		],
	}),
});

function IrregularVerbsBanner() {
	return (
		<Banner
			illustrations={[{ src: aquila }, { src: mosaic }]}
			content={
				<>
					<div className="flex items-center justify-center gap-4 md:justify-start">
						<Heading variant="h1" lang="la">
							Verba anōmala.
						</Heading>
						<Tooltip hoverDelay={200} touchBehavior="tap">
							<TooltipTrigger className="my-0 rounded-full bg-parchment-50 p-2 text-gold-600 transition-colors hover:border-accent hover:bg-parchment-100 hover:text-accent">
								<Info size={20} aria-hidden="true" />
								<span className="sr-only">
									What does <span lang="la">Verba anōmala</span> mean?
								</span>
							</TooltipTrigger>
							<TooltipContent
								placement="bottom right"
								className="w-72 p-3 text-left text-base shadow-md shadow-ink-900/10"
							>
								<p className="text-ink-700 leading-relaxed">
									<span className="font-semibold text-ink-900">
										&ldquo;Irregular verbs.&rdquo;
									</span>{" "}
									<span lang="la">Anōmalus</span> is borrowed from Greek and
									means <em>uneven</em>: verbs that do not keep to the pattern.
								</p>
							</TooltipContent>
						</Tooltip>
					</div>
					<p className="mx-auto mt-6 text-lg leading-relaxed md:mx-0 md:text-xl max-w-[80%]">
						A few verbs follow none of the five conjugations, and they are the
						ones you meet most often. Each one is set out here in full, starting
						with <LatinWord>sum</LatinWord>, <em>I am</em>.
					</p>
				</>
			}
		/>
	);
}

function RouteComponent() {
	return (
		<>
			<IrregularVerbsBanner />
			<div className="mx-auto max-w-page-width space-y-8 md:space-y-16 py-16 md:py-24">
				<IrregularVerbs />
			</div>
		</>
	);
}
