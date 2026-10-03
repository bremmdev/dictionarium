import { Tooltip, TooltipContent, TooltipTrigger } from "@bremmdev/m7kit";
import { createFileRoute } from "@tanstack/react-router";
import { Info } from "lucide-react";
import bust from "#/assets/bust-sketch.svg";
import scroll from "#/assets/scroll-sketch.svg";
import { Banner } from "#/components/Banner";
import { Heading } from "#/components/Heading";
import type { Proverb } from "#/db/schema";
import { listProverbs } from "#/server/proverbs";
import { ANONYMOUS } from "#/utils/proverbs/rules";

export const Route = createFileRoute("/proverbs")({
	loader: async () => {
		const proverbs = await listProverbs();

		// A server function whose response carries no result resolves to
		// undefined instead of throwing — see the home route.
		if (!Array.isArray(proverbs)) {
			throw new Error(
				"The server did not answer with the proverbs. It may be restarting — try again in a moment.",
			);
		}

		return { proverbs };
	},
	staleTime: 60_000,
	component: RouteComponent,
	head: () => ({
		meta: [
			{
				title: "Proverbs — Dictionarium Latinum",
			},
			{
				name: "description",
				content:
					"Latin proverbs and sayings with their translations, meanings and sources, by author.",
			},
		],
	}),
});

/**
 * The proverbs as runs by author, in the order listProverbs sorted them. Runs
 * rather than a lookup, so the order the server chose — anonymous last — is the
 * order the page shows without being decided twice.
 */
function byAuthor(proverbs: Array<Proverb>) {
	const groups: Array<{ author: string; proverbs: Array<Proverb> }> = [];

	for (const proverb of proverbs) {
		const last = groups.at(-1);
		if (last?.author === proverb.author) {
			last.proverbs.push(proverb);
		} else {
			groups.push({ author: proverb.author, proverbs: [proverb] });
		}
	}

	return groups;
}

/** Stored lowercase like the rest of the vocabularies; the UI capitalizes. */
function authorLabel(author: string) {
	return author === ANONYMOUS ? "Anonymous" : author;
}

function ProverbsBanner() {
	return (
		<Banner
			illustrations={[{ src: scroll }, { src: bust }]}
			content={
				<>
					<div className="flex items-center justify-center gap-4 md:justify-start">
						<Heading variant="h1" lang="la">
							Prōverbia.
						</Heading>
						<Tooltip hoverDelay={200} touchBehavior="tap">
							<TooltipTrigger className="my-0 rounded-full bg-parchment-50 p-2 text-gold-600 transition-colors hover:border-accent hover:bg-parchment-100 hover:text-accent">
								<Info size={20} aria-hidden="true" />
								<span className="sr-only">
									What does <span lang="la">Prōverbia</span> mean?
								</span>
							</TooltipTrigger>
							<TooltipContent
								placement="bottom right"
								className="w-72 p-3 text-left text-base shadow-md shadow-ink-900/10"
							>
								<p className="text-ink-700 leading-relaxed">
									<span className="font-semibold text-ink-900">
										&ldquo;Proverbs.&rdquo;
									</span>{" "}
									From <span lang="la">prō</span> and{" "}
									<span lang="la">verbum</span>: a word put forward, the saying
									everyone already knows.
								</p>
							</TooltipContent>
						</Tooltip>
					</div>
					<p className="mx-auto mt-6 text-lg leading-relaxed md:mx-0 md:text-xl max-w-[80%]">
						Sayings the Romans left behind, by author: what each one says, what
						it is used to mean, and where it is found.
					</p>
				</>
			}
		/>
	);
}

function ProverbCard({ proverb }: { proverb: Proverb }) {
	return (
		<li className="space-y-2 px-4 py-3">
			<blockquote className="space-y-1">
				<p className="font-bold text-ink-900 text-xl" lang="la">
					{proverb.textLa}
				</p>
				<p className="text-ink-700 italic">
					&ldquo;{proverb.translationEn}&rdquo;
				</p>
			</blockquote>

			{(proverb.meaningEn || proverb.source || proverb.notes) && (
				<dl className="space-y-1 text-base">
					{proverb.meaningEn && (
						<div>
							<dt className="inline font-semibold text-gold-600 text-xs uppercase tracking-[0.18em]">
								Meaning
							</dt>{" "}
							<dd className="inline text-ink-700">{proverb.meaningEn}</dd>
						</div>
					)}
					{proverb.source && (
						<div>
							<dt className="inline font-semibold text-gold-600 text-xs uppercase tracking-[0.18em]">
								Source
							</dt>{" "}
							<dd className="inline text-ink-700">{proverb.source}</dd>
						</div>
					)}
					{proverb.notes && (
						<div>
							<dt className="inline font-semibold text-gold-600 text-xs uppercase tracking-[0.18em]">
								Notes
							</dt>{" "}
							<dd className="inline text-ink-600">{proverb.notes}</dd>
						</div>
					)}
				</dl>
			)}
		</li>
	);
}

function RouteComponent() {
	const { proverbs } = Route.useLoaderData();
	const groups = byAuthor(proverbs);

	return (
		<>
			<ProverbsBanner />
			<section className="mx-auto max-w-3xl space-y-12 px-4 sm:px-8 py-16 md:py-24">
				{groups.length === 0 ? (
					<p className="text-center text-ink-600 text-lg">
						No proverbs have been filed yet.
					</p>
				) : (
					groups.map(({ author, proverbs }, i) => (
						<section
							key={author}
							aria-labelledby={`author-${i}`}
							className="space-y-4"
						>
							<Heading
								id={`author-${i}`}
								variant="h3"
								as="h2"
								className="border-parchment-300 border-b pb-2"
							>
								{authorLabel(author)}
							</Heading>
							{/* The search results' list, so a proverb reads as the same kind
							    of row an entry does. */}
							<ul className="divide-y divide-parchment-200 rounded-sm border border-parchment-200 bg-surface-subtle/50">
								{proverbs.map((proverb) => (
									<ProverbCard key={proverb.id} proverb={proverb} />
								))}
							</ul>
						</section>
					))
				)}
			</section>
		</>
	);
}
