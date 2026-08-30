import { Tooltip, TooltipContent, TooltipTrigger } from "@bremmdev/m7kit";
import { createFileRoute } from "@tanstack/react-router";
import { Info } from "lucide-react";
import numeralC from "#/assets/C.svg";
import numeralD from "#/assets/D.svg";
import numeralI from "#/assets/I.svg";
import numeralL from "#/assets/L.svg";
import numeralM from "#/assets/M.svg";
import numeralV from "#/assets/V.svg";
import numeralX from "#/assets/X.svg";
import { Banner } from "#/components/Banner";
import { Heading } from "#/components/Heading";
import { Abacus } from "#/components/numbers/Abacus";
import { Counting } from "#/components/numbers/Counting";
import { NumberTheory } from "#/components/numbers/NumberTheory";

// Three to a row at a third of the column each, so the seven letters keep their
// columns at every width instead of being pinned to a pixel size — M ends up
// centred on its own. The tilt runs on a four-step cycle against the three
// columns, so no two rows lean the same way and the letters read as hand-set
// rather than as a font specimen.
const TILTS = [
	"-rotate-6 -translate-y-1",
	"rotate-4 translate-y-1",
	"-rotate-3 translate-y-1",
	"rotate-6 -translate-y-1",
];

const NUMERALS = [
	numeralI,
	numeralV,
	numeralX,
	numeralL,
	numeralC,
	numeralD,
	numeralM,
].map((src, i) => ({
	src,
	className: `max-h-16 md:max-h-20 basis-1/3 ${TILTS[i % TILTS.length]}`,
}));

export const Route = createFileRoute("/numbers")({
	component: RouteComponent,
});

function NumbersBanner() {
	return (
		<Banner
			illustrations={NUMERALS}
			content={
				<>
					<div className="flex items-center justify-center gap-4 md:justify-start">
						<Heading variant="h1" lang="la">
							Numerī Rōmānī.
						</Heading>
						<Tooltip hoverDelay={200} touchBehavior="tap">
							<TooltipTrigger className="my-0 rounded-full bg-parchment-50 p-2 text-gold-600 transition-colors hover:border-accent hover:bg-parchment-100 hover:text-accent">
								<Info size={20} aria-hidden="true" />
								<span className="sr-only">
									What does <span lang="la">Numerī Rōmānī</span> mean?
								</span>
							</TooltipTrigger>
							<TooltipContent
								placement="bottom right"
								className="w-72 p-3 text-left text-base shadow-md shadow-ink-900/10"
							>
								<p className="text-ink-700 leading-relaxed">
									<span className="font-semibold text-ink-900">
										&ldquo;Roman numbers.&rdquo;
									</span>{" "}
									The Romans counted with seven letters —{" "}
									<span className="text-accent">I V X L C D M</span> — and had
									no symbol at all for zero.
								</p>
							</TooltipContent>
						</Tooltip>
					</div>
					<p className="mx-auto mt-6 text-lg leading-relaxed md:mx-0 md:text-xl max-w-[80%]">
						Learn about Roman numerals, counting and additions. Convert any
						number to its Roman numeral and back, and read how the Romans said
						it.
					</p>
				</>
			}
		/>
	);
}

function RouteComponent() {
	return (
		<>
			<NumbersBanner />
			<div className="mx-auto max-w-page-width space-y-8 md:space-y-16 py-16 md:py-24">
				<NumberTheory />
				<Counting />
				<Abacus />
			</div>
		</>
	);
}
