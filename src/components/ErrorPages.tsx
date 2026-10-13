import { Tooltip, TooltipContent, TooltipTrigger } from "@bremmdev/m7kit";
import { ArrowLeft, Info } from "lucide-react";
import amphora from "#/assets/amphora-sketch.svg";
import gladius from "#/assets/gladius-sketch.svg";
import helmet from "#/assets/helmet-sketch.svg";
import vexillum from "#/assets/vexillum-sketch.svg";
import { Banner } from "#/components/Banner";
import { Heading } from "#/components/Heading";
import { TextLink } from "#/components/TextLink";

/*
 * The pages the router falls back to when a route has nothing more specific to
 * say — see src/router.tsx. They open with a banner like every other page, so
 * a wrong turn still looks like the dictionary.
 */

function HomeLink() {
	return (
		<TextLink to="/" search={{}} icon={ArrowLeft} className="mt-8">
			Back to the home page
		</TextLink>
	);
}

export function NotFoundPage() {
	return (
		<Banner
			illustrations={[{ src: amphora }, { src: vexillum }]}
			content={
				<>
					<p className="text-gold-600 text-sm font-medium uppercase tracking-[0.32em] md:text-base">
						404 · Page not found
					</p>
					<div className="mt-6 flex items-center justify-center gap-4 md:justify-start">
						<Heading variant="h1" lang="la">
							Hīc nihil est.
						</Heading>
						<Tooltip hoverDelay={200} touchBehavior="tap">
							<TooltipTrigger className="my-0 rounded-full bg-parchment-50 p-2 text-gold-600 transition-colors hover:border-accent hover:bg-parchment-100 hover:text-accent">
								<Info size={20} aria-hidden="true" />
								<span className="sr-only">
									What does <span lang="la">Hīc nihil est</span> mean?
								</span>
							</TooltipTrigger>
							<TooltipContent
								placement="bottom right"
								className="w-72 p-3 text-left text-base shadow-md shadow-ink-900/10"
							>
								<p className="text-ink-700 leading-relaxed">
									<span className="font-semibold text-ink-900">
										&ldquo;There is nothing here.&rdquo;
									</span>{" "}
									With a long <span className="text-accent">ī</span>,{" "}
									<span lang="la">hīc</span> is the adverb <em>here</em>.
									Without it, <span lang="la">hic</span> is the pronoun{" "}
									<em>this</em>.
								</p>
							</TooltipContent>
						</Tooltip>
					</div>
					<p className="mx-auto mt-6 text-lg leading-relaxed md:mx-0 md:text-xl max-w-[80%]">
						Looks like this page doesn't exist. Maybe the link is broken, or
						there's a typo in the address. Try searching for the word instead.
					</p>
					<HomeLink />
				</>
			}
		/>
	);
}

// The error itself is never shown: whatever it says is for the logs, not for
// someone looking up a word.
export function ErrorPage() {
	return (
		<Banner
			illustrations={[{ src: helmet }, { src: gladius }]}
			content={
				<>
					<p className="text-gold-600 text-sm font-medium uppercase tracking-[0.32em] md:text-base">
						Something went wrong
					</p>
					<div className="mt-6 flex items-center justify-center gap-4 md:justify-start">
						<Heading variant="h1" lang="la">
							Errāvimus.
						</Heading>
						<Tooltip hoverDelay={200} touchBehavior="tap">
							<TooltipTrigger className="my-0 rounded-full bg-parchment-50 p-2 text-gold-600 transition-colors hover:border-accent hover:bg-parchment-100 hover:text-accent">
								<Info size={20} aria-hidden="true" />
								<span className="sr-only">
									What does <span lang="la">Errāvimus</span> mean?
								</span>
							</TooltipTrigger>
							<TooltipContent
								placement="bottom right"
								className="w-72 p-3 text-left text-base shadow-md shadow-ink-900/10"
							>
								<p className="text-ink-700 leading-relaxed">
									<span className="font-semibold text-ink-900">
										&ldquo;We have gone astray.&rdquo;
									</span>{" "}
									<span lang="la">Errāre</span> is to wander as much as to err:
									to a Roman, a mistake was a wrong turn.
								</p>
							</TooltipContent>
						</Tooltip>
					</div>
					<p className="mx-auto mt-6 text-lg leading-relaxed md:mx-0 md:text-xl max-w-[80%]">
						Something broke on our end. Give it a moment and try reloading the
						page, or head back home and start over.
					</p>
					<HomeLink />
				</>
			}
		/>
	);
}
