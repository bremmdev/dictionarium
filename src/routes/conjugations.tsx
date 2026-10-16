import { Tooltip, TooltipContent, TooltipTrigger } from "@bremmdev/m7kit";
import { createFileRoute } from "@tanstack/react-router";
import { Info } from "lucide-react";
import toga from "#/assets/toga-sketch.svg";
import wreath from "#/assets/wreath-sketch.svg";
import { Banner } from "#/components/Banner";
import { Endings } from "#/components/conjugations/Endings";
import { Filing } from "#/components/conjugations/Filing";
import { Paradigms } from "#/components/conjugations/Paradigms";
import { Persons } from "#/components/conjugations/Persons";
import { Translating } from "#/components/conjugations/Translating";
import { Heading } from "#/components/Heading";
import { type Section, SectionNav } from "#/components/SectionNav";

const SECTIONS: Section[] = [
	{ id: "persons", label: "Persōnae", gloss: "persons" },
	{ id: "filing", label: "Filing a verb" },
	{ id: "conjugations", label: "The conjugations" },
	{ id: "translating", label: "Translating" },
	{ id: "endings", label: "Terminātiōnēs", gloss: "endings" },
];

export const Route = createFileRoute("/conjugations")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{
				title: "Conjugations — Dictionarium Latinum",
			},
			{
				name: "description",
				content:
					"The Latin verb conjugations: every person, singular and plural, with macrons.",
			},
		],
	}),
});

function ConjugationsBanner() {
	return (
		<Banner
			illustrations={[{ src: wreath }, { src: toga }]}
			content={
				<>
					<div className="flex items-center justify-center gap-4 md:justify-start">
						<Heading variant="h1" lang="la">
							Coniugātiōnēs.
						</Heading>
						<Tooltip hoverDelay={200} touchBehavior="tap">
							<TooltipTrigger className="my-0 rounded-full bg-parchment-50 p-2 text-gold-600 transition-colors hover:border-accent hover:bg-parchment-100 hover:text-accent">
								<Info size={20} aria-hidden="true" />
								<span className="sr-only">
									What does <span lang="la">Coniugātiōnēs</span> mean?
								</span>
							</TooltipTrigger>
							<TooltipContent
								placement="bottom right"
								className="w-72 p-3 text-left text-base shadow-md shadow-ink-900/10"
							>
								<p className="text-ink-700 leading-relaxed">
									<span className="font-semibold text-ink-900">
										&ldquo;Conjugations.&rdquo;
									</span>{" "}
									Literally a <em>yoking together</em> — person, number and
									tense, all harnessed to one stem.
								</p>
							</TooltipContent>
						</Tooltip>
					</div>
					<p className="mx-auto mt-6 text-lg leading-relaxed md:mx-0 md:text-xl max-w-[80%]">
						A Latin verb changes its ending for who is acting and when. Learn
						the five patterns those endings fall into, and read any regular verb
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
			<ConjugationsBanner />
			<SectionNav sections={SECTIONS} />
			<div className="mx-auto max-w-page-width space-y-8 md:space-y-16 py-16 md:py-24">
				<Persons />
				<Filing />
				<Paradigms />
				<Translating />
				<Endings />
			</div>
		</>
	);
}
