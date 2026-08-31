import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import abacus from "#/assets/abacus-sketch.svg";
import acanthus from "#/assets/acanthus-sketch.svg";
import aqueduct from "#/assets/aqueduct-sketch.svg";
import arch from "#/assets/arch-sketch.svg";
import bust from "#/assets/bust-sketch.svg";
import column from "#/assets/column-sketch.svg";
import lamp from "#/assets/lamp-sketch.svg";
import scroll from "#/assets/scroll-sketch.svg";
import sundial from "#/assets/sundial-sketch.svg";
import temple from "#/assets/temple-sketch.svg";
import { Banner } from "#/components/Banner";
import { Heading } from "#/components/Heading";
import { grammarFacts } from "#/components/search/EntryCard";
import type { Entry, EntryWithSenses } from "#/db/schema";
import { getEntryByLemma } from "#/server/search";

export const Route = createFileRoute("/verbum/$lemma")({
	// q is only carried so the back link can restore the search the user came
	// from. It is optional, so a bare /verbum/ambulō stays a bare URL.
	validateSearch: (search: Record<string, unknown>): { q?: string } => {
		const q = typeof search.q === "string" ? search.q.trim() : "";
		return q === "" ? {} : { q };
	},
	loader: async ({ params: { lemma } }) => {
		const entry = await getEntryByLemma({ data: lemma });

		if (!entry) {
			throw notFound();
		}

		return entry;
	},
	component: WordDetail,
	notFoundComponent: NotFound,
});

/**
 * One illustration per part of speech, so a word looks the same way twice and
 * the page has something to carry when the entry itself is three lines long.
 * The pairings are meant rather than decorative: an arch joins two piers the
 * way a conjunction joins two clauses, an aqueduct carries across, acanthus
 * ornaments what it grows on, a sundial marks the time a verb is tensed for.
 */
const ILLUSTRATIONS: Record<string, string> = {
	adjective: acanthus,
	adverb: lamp,
	conjunction: arch,
	noun: column,
	numeral: abacus,
	preposition: aqueduct,
	pronoun: bust,
	"proper noun": temple,
	verb: sundial,
};

/**
 * The part of speech in the language the page is about. It fills the eyebrow
 * slot the banner on the home page uses, and a Latin dictionary may as well
 * name its own parts of speech in Latin.
 */
const LATIN_PART_OF_SPEECH: Record<string, string> = {
	adjective: "adiectīvum",
	adverb: "adverbium",
	conjunction: "coniūnctiō",
	noun: "nōmen",
	numeral: "numerus",
	preposition: "praepositiō",
	pronoun: "prōnōmen",
	"proper noun": "nōmen proprium",
	verb: "verbum",
};

function BackLink() {
	const { q } = Route.useSearch();

	return (
		<Link
			to="/"
			search={q === undefined ? {} : { q }}
			className="focus-ring inline-flex items-center gap-2 text-accent"
		>
			<ArrowLeft className="h-4 w-4" aria-hidden="true" />
			{q === undefined ? "Back to search" : `Back to results for “${q}”`}
		</Link>
	);
}

/** The grammar as separate pills, so "noun" and "2nd decl." read as two facts. */
function GrammarChips({ entry }: { entry: Entry }) {
	return (
		<ul className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
			{grammarFacts(entry).map((fact) => (
				<li
					key={fact}
					className="rounded-full border border-parchment-300 bg-parchment-50 px-3 py-1 font-semibold text-gold-600 text-xs uppercase tracking-[0.18em]"
				>
					{fact}
				</li>
			))}
		</ul>
	);
}

function WordBanner({ entry }: { entry: EntryWithSenses }) {
	const [core] = entry.senses;

	return (
		<Banner
			illustrations={[
				{
					src: ILLUSTRATIONS[entry.partOfSpeech] ?? scroll,
					className: "w-40 -rotate-6 select-none md:w-56",
				},
			]}
			content={
				<>
					<BackLink />

					<p
						className="mt-6 font-medium text-gold-600 text-sm uppercase tracking-[0.32em] md:text-base"
						lang="la"
					>
						{LATIN_PART_OF_SPEECH[entry.partOfSpeech] ?? entry.partOfSpeech}
					</p>

					{/* The lemma is the page's h1 and now sits in a banner, so it takes
					    the display step of the scale rather than the section one. */}
					<Heading variant="h1" className="mt-3 font-bold" lang="la">
						{entry.lemma}
					</Heading>

					<GrammarChips entry={entry} />

					{/* A dictionary leads with the core sense on the headword line; the
					    numbered senses below only appear when there is more than one. */}
					{core && (
						<p className="mt-6 text-ink-900 text-2xl leading-relaxed md:text-3xl">
							{core.meaningEn}
						</p>
					)}
				</>
			}
		/>
	);
}

/** The four verb parts in the order every dictionary files them. */
const VERB_PART_LABELS = ["present", "infinitive", "perfect", "supine"];

/**
 * principal_parts is one string because that is how a dictionary prints it, but
 * the pieces are separate facts and worth labelling. Only the shapes we can
 * name are split; anything else is shown whole rather than mislabelled.
 */
function partLabels(entry: Entry, count: number) {
	if (entry.partOfSpeech === "verb" && count === 4) {
		return VERB_PART_LABELS;
	}

	if (entry.partOfSpeech.endsWith("noun") && count === 1) {
		return ["genitive"];
	}

	return null;
}

function PrincipalParts({ entry }: { entry: EntryWithSenses }) {
	if (!entry.principalParts) {
		return null;
	}

	const split = entry.principalParts
		.split(",")
		.map((part) => part.trim())
		.filter(Boolean);

	const labels = partLabels(entry, split.length);
	const parts = labels ? split : [entry.principalParts];

	return (
		<section>
			<Heading variant="h2">Principal parts</Heading>

			<ol className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-6">
				{parts.map((part, i) => (
					<li
						key={part}
						className="rounded-lg border border-parchment-200 bg-parchment-100 px-4 py-3"
					>
						<p className="font-semibold text-gold-600 text-xs uppercase tracking-[0.18em]">
							{labels?.[i] ?? "form"}
						</p>
						<p className="mt-1 text-ink-900 text-xl italic" lang="la">
							{part}
						</p>
					</li>
				))}
			</ol>
		</section>
	);
}

/**
 * Every sense the word has, in rank order. The core one is the banner's lede
 * as well, the way a dictionary prints the headword gloss and then numbers the
 * senses underneath — a word with a single sense has nothing to add here, so
 * the section is skipped rather than repeating that one line.
 *
 * Each row shows its own rank rather than leaning on a list marker, so the
 * numbering matches the senses table and a gap in it shows up as a gap instead
 * of being silently renumbered. That number is content, not decoration: it is
 * how a dictionary refers to a sense, so it stays readable to a screen reader.
 */
function Meanings({ entry }: { entry: EntryWithSenses }) {
	const senses = entry.senses;

	if (senses.length < 2) {
		return null;
	}

	return (
		<section>
			<Heading variant="h2">Meanings</Heading>

			<ol className="mt-3 space-y-3 mt-6">
				{senses.map((sense) => (
					<li
						key={sense.id}
						className="flex gap-4 rounded-lg border border-parchment-200 bg-parchment-100 p-4"
					>
						<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-300 font-bold text-ink-900 text-sm tabular-nums">
							{sense.rank}
						</span>

						<div>
							<p className="text-ink-900 text-xl">
								{sense.usage && (
									<span className="mr-2 rounded-full border border-parchment-300 px-2 py-0.5 align-middle text-ink-500 text-xs uppercase tracking-[0.18em]">
										{sense.usage}
									</span>
								)}
								{sense.meaningEn}
							</p>

							{sense.exampleLa && (
								<p className="mt-2 text-ink-700 italic" lang="la">
									{sense.exampleLa}
								</p>
							)}
							{sense.exampleEn && (
								<p className="text-ink-500">&ldquo;{sense.exampleEn}&rdquo;</p>
							)}
						</div>
					</li>
				))}
			</ol>
		</section>
	);
}

function WordDetail() {
	const entry = Route.useLoaderData();

	return (
		<article>
			<WordBanner entry={entry} />

			{/* The outer container matches the banner's, so the body starts on the
			    same left edge as the lemma; the inner one keeps prose to a measure
			    rather than letting it run the full 90rem. */}
			<div className="mx-auto max-w-page-width px-8 py-12 md:py-16">
				<div className="max-w-4xl space-y-10">
					<PrincipalParts entry={entry} />
					<Meanings entry={entry} />

					{entry.notes && (
						<section>
							<Heading variant="h4" as="h2">
								Notes
							</Heading>
							<p className="mt-3 border-accent border-l-2 bg-parchment-100 px-4 py-3 text-ink-700">
								{entry.notes}
							</p>
						</section>
					)}
				</div>
			</div>
		</article>
	);
}

function NotFound() {
	const { lemma } = Route.useParams();

	return (
		<div className="mx-auto max-w-3xl px-8 py-16 md:py-24 space-y-4 text-center">
			<Heading
				variant="h3"
				as="h1"
				className="font-bold text-accent!"
				lang="la"
			>
				Nihil inventum.
			</Heading>
			<p className="text-ink-500 text-lg">
				No entry for &ldquo;<span lang="la">{lemma}</span>&rdquo;.
			</p>
			<Link to="/" search={{}} className="focus-ring inline-block text-accent">
				Back to search
			</Link>
		</div>
	);
}
