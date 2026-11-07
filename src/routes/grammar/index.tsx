import { Tooltip, TooltipContent, TooltipTrigger } from "@bremmdev/m7kit";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Info } from "lucide-react";
import acanthus from "#/assets/acanthus-sketch.svg";
import arch from "#/assets/arch-sketch.svg";
import { Banner } from "#/components/Banner";
import { GRAMMAR_TOPICS } from "#/components/grammar/topics";
import { Heading } from "#/components/Heading";

export const Route = createFileRoute("/grammar/")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{
				title: "Grammar — Dictionarium Latinum",
			},
			{
				name: "description",
				content:
					"Latin grammar with macrons: the declensions, the conjugations and the irregular verbs.",
			},
		],
	}),
});

function GrammarBanner() {
	return (
		<Banner
			illustrations={[{ src: acanthus }, { src: arch }]}
			content={
				<>
					<div className="flex items-center justify-center gap-4 md:justify-start">
						<Heading variant="h1" lang="la">
							Grammatica.
						</Heading>
						<Tooltip hoverDelay={200} touchBehavior="tap">
							<TooltipTrigger className="my-0 rounded-full bg-parchment-50 p-2 text-gold-600 transition-colors hover:border-accent hover:bg-parchment-100 hover:text-accent">
								<Info size={20} aria-hidden="true" />
								<span className="sr-only">
									What does <span lang="la">Grammatica</span> mean?
								</span>
							</TooltipTrigger>
							<TooltipContent
								placement="bottom right"
								className="w-72 p-3 text-left text-base shadow-md shadow-ink-900/10"
							>
								<p className="text-ink-700 leading-relaxed">
									<span className="font-semibold text-ink-900">
										&ldquo;Grammar.&rdquo;
									</span>{" "}
									From the Greek for <em>the art of letters</em>: knowing how
									written words are put together.
								</p>
							</TooltipContent>
						</Tooltip>
					</div>
					<p className="mx-auto mt-6 text-lg leading-relaxed md:mx-0 md:text-xl max-w-[80%]">
						How Latin words change their endings, and what those endings tell
						you. Start with the nouns or the verbs.
					</p>
				</>
			}
		/>
	);
}

function RouteComponent() {
	return (
		<>
			<GrammarBanner />
			<div className="mx-auto max-w-page-width px-4 sm:px-8 py-16 md:py-24">
				<ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{GRAMMAR_TOPICS.map(({ to, label, description, Icon }) => (
						<li key={to}>
							<Link
								to={to}
								className="focus-ring flex h-full items-center gap-4 rounded-2xl border border-parchment-200 bg-parchment-50 p-5 hover:bg-parchment-100"
							>
								<span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-parchment-300 bg-parchment-50 text-accent">
									<Icon aria-hidden="true" className="h-6 w-6" />
								</span>
								<span>
									<span className="block font-semibold text-accent text-lg leading-snug">
										{label}
									</span>
									<span className="block text-ink-700 italic leading-snug">
										{description}
									</span>
								</span>
							</Link>
						</li>
					))}
				</ul>
			</div>
		</>
	);
}
