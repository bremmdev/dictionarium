import { Tooltip, TooltipContent, TooltipTrigger } from "@bremmdev/m7kit";
import { createFileRoute } from "@tanstack/react-router";
import { Info } from "lucide-react";
import helmet from "#/assets/helmet-sketch.svg";
import vexillum from "#/assets/vexillum-sketch.svg";
import { Banner } from "#/components/Banner";
import { Heading } from "#/components/Heading";
import { LatinWord } from "#/components/LatinWord";
import {
	Demonstratives,
	IntensiveAndIdentity,
	PersonalPronouns,
	Possessives,
	Pronominal,
} from "#/components/pronouns/Pronouns";
import { type Section, SectionNav } from "#/components/SectionNav";

const SECTIONS: Section[] = [
	{
		id: "pronominal",
		label: "Dēclīnātiō prōnōminālis",
		gloss: "the pronominal declension",
	},
	{ id: "personal", label: "Persōnālia", gloss: "personal pronouns" },
	{ id: "possessives", label: "Possessīva", gloss: "possessives" },
	{ id: "demonstratives", label: "Dēmōnstrātīva", gloss: "demonstratives" },
	{ id: "identity", label: "Ipse et īdem", gloss: "self and same" },
];

export const Route = createFileRoute("/grammar/pronouns")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{
				title: "Pronouns — Dictionarium Latinum",
			},
			{
				name: "description",
				content:
					"The Latin pronouns in full, with macrons: ego, tū and suī with their possessives, the demonstratives hic, iste, ille and is, and ipse and īdem.",
			},
		],
	}),
});

function PronounsBanner() {
	return (
		<Banner
			illustrations={[{ src: helmet }, { src: vexillum }]}
			content={
				<>
					<div className="flex items-center justify-center gap-4 md:justify-start">
						<Heading variant="h1" lang="la">
							Prōnōmina.
						</Heading>
						<Tooltip hoverDelay={200} touchBehavior="tap">
							<TooltipTrigger className="my-0 rounded-full bg-parchment-50 p-2 text-gold-600 transition-colors hover:border-accent hover:bg-parchment-100 hover:text-accent">
								<Info size={20} aria-hidden="true" />
								<span className="sr-only">
									What does <span lang="la">Prōnōmina</span> mean?
								</span>
							</TooltipTrigger>
							<TooltipContent
								placement="bottom right"
								className="w-72 p-3 text-left text-base shadow-md shadow-ink-900/10"
							>
								<p className="text-ink-700 leading-relaxed">
									<span className="font-semibold text-ink-900">
										&ldquo;Pronouns.&rdquo;
									</span>{" "}
									From <span lang="la">prō nōmine</span>,{" "}
									<em>in place of a noun</em>: words that stand where a noun
									would.
								</p>
							</TooltipContent>
						</Tooltip>
					</div>
					<p className="mx-auto mt-6 text-lg leading-relaxed md:mx-0 md:text-xl max-w-[80%]">
						Small words that point, refer back and stand in for nouns, and among
						the commonest in any Latin text. Most of them share one pattern,
						starting with <LatinWord>ille</LatinWord>, <em>that</em>.
					</p>
				</>
			}
		/>
	);
}

function RouteComponent() {
	return (
		<>
			<PronounsBanner />
			<SectionNav sections={SECTIONS} />
			<div className="mx-auto max-w-page-width space-y-8 md:space-y-16 py-16 md:py-24">
				<Pronominal />
				<PersonalPronouns />
				<Possessives />
				<Demonstratives />
				<IntensiveAndIdentity />
			</div>
		</>
	);
}
