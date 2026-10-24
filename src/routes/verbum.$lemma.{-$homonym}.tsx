import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useAnnounce,
} from "@bremmdev/m7kit";
import {
	createFileRoute,
	Link,
	notFound,
	redirect,
	useLoaderData,
	useRouter,
} from "@tanstack/react-router";
import { ArrowLeft, Bookmark, Info, Pencil, Search } from "lucide-react";
import { Fragment, useState } from "react";
import abacus from "#/assets/abacus-sketch.svg";
import acanthus from "#/assets/acanthus-sketch.svg";
import amphora from "#/assets/amphora-sketch.svg";
import aqueduct from "#/assets/aqueduct-sketch.svg";
import arch from "#/assets/arch-sketch.svg";
import bust from "#/assets/bust-sketch.svg";
import coin from "#/assets/coin-sketch.svg";
import column from "#/assets/column-sketch.svg";
import lamp from "#/assets/lamp-sketch.svg";
import lyre from "#/assets/lyre-sketch.svg";
import scroll from "#/assets/scroll-sketch.svg";
import sundial from "#/assets/sundial-sketch.svg";
import temple from "#/assets/temple-sketch.svg";
import { Banner } from "#/components/Banner";
import { frequencySource } from "#/components/FrequencyTag";
import { Heading } from "#/components/Heading";
import { Lemma } from "#/components/Lemma";
import { PrincipalPartList } from "#/components/PrincipalPartList";
import { grammarFacts } from "#/components/search/EntryCard";
import { SenseList } from "#/components/SenseList";
import { TextLink } from "#/components/TextLink";
import type { EntryWithSenses, ShownEntry } from "#/db/schema";
import { recordEntryView } from "#/server/analytics";
import { getIsDifficult, setDifficult } from "#/server/difficult";
import { type EntryPage, getEntry } from "#/server/search";
import { bandLabel } from "#/utils/entries/frequency";
import { entryLink, homonymLabel, parseHomonym } from "#/utils/entries/links";

export const Route = createFileRoute("/verbum/$lemma/{-$homonym}")({
	// q is only carried so the back link can restore the search the user came
	// from. It is optional, so a bare /verbum/ambulō stays a bare URL.
	validateSearch: (search: Record<string, unknown>): { q?: string } => {
		const q = typeof search.q === "string" ? search.q.trim() : "";
		return q === "" ? {} : { q };
	},
	// One URL per word: cum¹ is /verbum/cum, so /verbum/cum/1 is sent there.
	beforeLoad: ({ params: { lemma, homonym }, search }) => {
		if (homonym === "1") {
			throw redirect({
				...entryLink({ lemma, homonym: 1 }, search.q),
				statusCode: 301,
			});
		}
	},
	loader: async ({ params, cause, parentMatchPromise }) => {
		const homonym = parseHomonym(params.homonym);
		if (homonym === null) {
			throw notFound();
		}

		const entry = await getEntry({ data: { lemma: params.lemma, homonym } });

		if (!entry) {
			throw notFound();
		}

		// cause === "enter" is the entire visitor filter, we do not want to track preloads
		// Recording lives here rather than inside getEntry, so a read is never a visit
		if (cause === "enter") {
			recordEntryView({
				data: { lemma: entry.lemma, homonym: entry.homonym },
			}).catch(() => {});
		}

		// null for everyone but the admin, who is the only one it is asked for.
		const { loaderData: root } = await parentMatchPromise;
		const difficult = root?.isAdmin
			? await getIsDifficult({ data: entry.id })
			: null;

		return { ...entry, difficult };
	},
	// No loaderData when the loader threw notFound, so the URL's lemma names the miss.
	head: ({ loaderData, params }) => ({
		meta: loaderData
			? [
					{ title: `${homonymLabel(loaderData)} — Dictionarium Latinum` },
					{
						name: "description",
						content: `${loaderData.lemma} (${loaderData.partOfSpeech})${
							loaderData.senses[0]
								? `: ${loaderData.senses[0].meaningEn}`
								: ""
						}`,
					},
				]
			: [{ title: `“${params.lemma}” not found — Dictionarium Latinum` }],
	}),
	component: WordDetail,
	notFoundComponent: NotFound,
});

/**
 * One illustration per part of speech, so a word looks the same way twice and
 * the page has something to carry when the entry itself is three lines long.
 * The pairings are meant rather than decorative: an arch joins two piers the
 * way a conjunction joins two clauses, an aqueduct carries across, acanthus
 * ornaments what it grows on, a sundial marks the time a verb is tensed for, a
 * coin is small and never changes shape and still decides what everything
 * around it is worth, and a lyre sounds rather than says.
 */
const ILLUSTRATIONS: Record<string, string> = {
	adjective: acanthus,
	adverb: lamp,
	conjunction: arch,
	interjection: lyre,
	noun: column,
	numeral: abacus,
	particle: coin,
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
	interjection: "interiectiō",
	noun: "nōmen",
	numeral: "numerus",
	particle: "particula",
	preposition: "praepositiō",
	pronoun: "prōnōmen",
	"proper noun": "nōmen proprium",
	verb: "verbum",
};

function BackLink() {
	const { q } = Route.useSearch();

	return (
		<TextLink to="/" search={q === undefined ? {} : { q }} icon={ArrowLeft}>
			{q === undefined ? "Back to search" : `Back to results for “${q}”`}
		</TextLink>
	);
}

/**
 * The way from reading a word to correcting it, for the one person who can.
 *
 * Hiding it from everyone else is presentation, not protection: /admin has its
 * own guard, and updateEntry has authMiddleware — see vault/auth.md. The
 * session comes from the root loader, which is already fetched and cached, so
 * this costs no request of its own.
 */
function EditLink({ entry }: { entry: EntryWithSenses }) {
	const root = useLoaderData({ from: "__root__" });

	if (!root?.isAdmin) {
		return null;
	}

	return (
		<Link
			to="/admin"
			search={{ id: entry.id }}
			className="focus-ring inline-flex items-center gap-2 rounded-full border border-parchment-300 bg-parchment-50 px-4 py-1.5 font-semibold text-gold-600 text-xs uppercase tracking-[0.18em] hover:border-accent hover:text-accent"
			lang="la"
		>
			<Pencil className="h-3.5 w-3.5" aria-hidden="true" />
			Ēmendā
			<span className="sr-only" lang="en">
				{" (edit this entry)"}
			</span>
		</Link>
	);
}

/**
 * The admin's mark on a word they find hard to remember, gathered on
 * /word-list?difficult=true. Hidden from everyone else as EditLink is.
 */
function DifficultToggle({
	entry,
}: {
	entry: ShownEntry & { difficult: boolean | null };
}) {
	const router = useRouter();
	const announce = useAnnounce();
	const [isPending, setIsPending] = useState(false);

	if (entry.difficult === null) {
		return null;
	}

	const toggle = async () => {
		if (isPending) return;
		setIsPending(true);
		const difficult = !entry.difficult;
		const word = homonymLabel(entry);

		try {
			await setDifficult({ data: { id: entry.id, difficult } });
			await router.invalidate();
			announce(
				difficult
					? `Notātum. ${word} is on your hard-to-remember list.`
					: `${word} is off your hard-to-remember list.`,
			);
		} catch {
			announce(`Could not save the mark on ${word}. Try again.`, {
				politeness: "assertive",
			});
		} finally {
			setIsPending(false);
		}
	};

	return (
		<button
			type="button"
			aria-pressed={entry.difficult}
			aria-disabled={isPending}
			onClick={toggle}
			className={`focus-ring inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-semibold text-xs uppercase tracking-[0.18em] ${
				entry.difficult
					? "border-accent bg-accent text-parchment-50 hover:bg-accent/90"
					: "border-parchment-300 bg-parchment-50 text-gold-600 hover:border-accent hover:text-accent"
			}`}
			lang="la"
		>
			<Bookmark
				className="h-3.5 w-3.5"
				fill={entry.difficult ? "currentColor" : "none"}
				aria-hidden="true"
			/>
			Difficile
			<span className="sr-only" lang="en">
				{" (hard to remember)"}
			</span>
		</button>
	);
}

const CHIP =
	"rounded-full border border-parchment-300 bg-parchment-50 px-3 py-1 font-semibold text-gold-600 text-xs uppercase tracking-[0.18em]";

/** The grammar as separate pills, so "noun" and "2nd decl." read as two facts. */
function GrammarChips({ entry }: { entry: ShownEntry }) {
	return (
		<ul className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
			{grammarFacts(entry).map((fact) => (
				<li key={fact} className={CHIP}>
					{fact}
				</li>
			))}
			<FrequencyChip entry={entry} />
		</ul>
	);
}

/** How common the word is, with where that comes from a tap away. */
function FrequencyChip({ entry: { frequency } }: { entry: ShownEntry }) {
	if (frequency === null) {
		return null;
	}

	return (
		// flex and h-full, so the button fills the row instead of sitting on the text baseline
		<li className="flex">
			<Tooltip hoverDelay={200} touchBehavior="tap">
				<TooltipTrigger
					className={`${CHIP} my-0 flex h-full items-center gap-1.5 transition-colors hover:border-accent hover:text-accent`}
				>
					<span className="sr-only">Frequency: </span>
					{bandLabel(frequency.band)}
					<Info className="h-3.5 w-3.5" aria-hidden="true" />
				</TooltipTrigger>
				<TooltipContent
					placement="bottom right"
					className="w-72 p-3 text-left text-base normal-case tracking-normal shadow-md shadow-ink-900/10"
				>
					<p className="text-ink-700 leading-relaxed">
						{frequencySource(frequency)}
					</p>
				</TooltipContent>
			</Tooltip>
		</li>
	);
}

/**
 * The other words spelled this way, one click off. /verbum/cum is cum¹, so a
 * reader after the conjunction lands on the preposition and needs the way over.
 */
function AlsoSpelled({ entry }: { entry: EntryPage }) {
	const { q } = Route.useSearch();

	if (entry.siblings.length === 0) {
		return null;
	}

	return (
		<p className="mt-6 text-ink-700">
			Also spelled <i lang="la">{entry.lemma}</i>:{" "}
			{entry.siblings.map((sibling, i) => (
				<Fragment key={sibling.id}>
					{i > 0 && "; "}
					<TextLink {...entryLink(sibling, q)} lang="la">
						<Lemma entry={{ ...sibling, homographs: entry.homographs }} />
					</TextLink>{" "}
					({sibling.partOfSpeech})
					{sibling.meaningEn && <>, &ldquo;{sibling.meaningEn}&rdquo;</>}
				</Fragment>
			))}
		</p>
	);
}

function WordBanner({
	entry,
}: {
	entry: EntryPage & { difficult: boolean | null };
}) {
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
					{/* Two ways out of the page, on one line: back to where the reader
					    came from, and — for an editor — into the form that filed it. */}
					<div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 md:justify-start">
						<BackLink />
						<EditLink entry={entry} />
						<DifficultToggle entry={entry} />
					</div>

					<p
						className="mt-6 font-medium text-gold-600 text-sm uppercase tracking-[0.32em] md:text-base"
						lang="la"
					>
						{LATIN_PART_OF_SPEECH[entry.partOfSpeech] ?? entry.partOfSpeech}
					</p>

					{/* The lemma is the page's h1 and now sits in a banner, so it takes
					    the display step of the scale rather than the section one. */}
					<Heading variant="h1" className="mt-3 font-bold" lang="la">
						<Lemma entry={entry} />
					</Heading>

					<GrammarChips entry={entry} />

					{/* A dictionary leads with the core sense on the headword line; the
					    numbered senses below only appear when there is more than one. */}
					{core && (
						<p className="mt-6 text-ink-900 text-2xl leading-relaxed md:text-3xl">
							{core.meaningEn}
						</p>
					)}

					<AlsoSpelled entry={entry} />
				</>
			}
		/>
	);
}

function PrincipalParts({ entry }: { entry: EntryWithSenses }) {
	if (!entry.principalParts) {
		return null;
	}

	return (
		<section>
			<Heading variant="h2">Principal parts</Heading>
			<div className="mt-6">
				<PrincipalPartList entry={entry} />
			</div>
		</section>
	);
}

/**
 * The banner prints the core sense as a bare gloss: no usage label, no case, no
 * example. A lone sense that carries any of those still has something to say —
 * noceō's one sense is nothing without its dative — so the section is only
 * skipped when repeating it would add nothing.
 */
function saysMoreThanTheBanner(sense: EntryWithSenses["senses"][number]) {
	return Boolean(
		sense.usage || sense.governs || sense.exampleLa || sense.exampleEn,
	);
}

/**
 * Every sense the word has, in rank order. The core one is the banner's lede
 * as well, the way a dictionary prints the headword gloss and then numbers the
 * senses underneath — a word with a single, bare sense has nothing to add here,
 * so the section is skipped rather than repeating that one line.
 */
function Meanings({ entry }: { entry: EntryWithSenses }) {
	const senses = entry.senses;

	if (senses.length === 0) {
		return null;
	}

	if (senses.length === 1 && !saysMoreThanTheBanner(senses[0])) {
		return null;
	}

	return (
		<section>
			<Heading variant="h2">Meanings</Heading>

			<div className="mt-6">
				<SenseList senses={senses} />
			</div>
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
			<div className="mx-auto max-w-page-width px-4 sm:px-8 py-12 md:py-16">
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

/** Links to search, which ignores macrons, so /verbum/amo still finds amō. */
function NotFound() {
	const { lemma } = Route.useParams();

	return (
		<Banner
			illustrations={[
				{ src: amphora, className: "w-40 -rotate-6 select-none md:w-56" },
			]}
			content={
				<>
					<BackLink />

					<p className="mt-6 font-medium text-gold-600 text-sm uppercase tracking-[0.32em] md:text-base">
						Not in the dictionary
					</p>
					<div className="mt-3 flex items-center justify-center gap-4 md:justify-start">
						<Heading variant="h1" lang="la">
							Nihil inventum.
						</Heading>
						<Tooltip hoverDelay={200} touchBehavior="tap">
							<TooltipTrigger className="my-0 rounded-full bg-parchment-50 p-2 text-gold-600 transition-colors hover:border-accent hover:bg-parchment-100 hover:text-accent">
								<Info size={20} aria-hidden="true" />
								<span className="sr-only">
									What does <span lang="la">Nihil inventum</span> mean?
								</span>
							</TooltipTrigger>
							<TooltipContent
								placement="bottom right"
								className="w-72 p-3 text-left text-base shadow-md shadow-ink-900/10"
							>
								<p className="text-ink-700 leading-relaxed">
									<span className="font-semibold text-ink-900">
										&ldquo;Nothing found.&rdquo;
									</span>{" "}
									<span lang="la">Inventum</span> is from{" "}
									<span lang="la">inveniō</span>, to come upon. It gave English{" "}
									<em>invent</em>, which first meant to find.
								</p>
							</TooltipContent>
						</Tooltip>
					</div>
					<p className="mx-auto mt-6 text-lg leading-relaxed md:mx-0 md:text-xl max-w-[80%]">
						We couldn't find &ldquo;
						<span lang="la" className="wrap-anywhere">
							{lemma}
						</span>
						&rdquo;. A word's page needs its exact spelling, macrons and all.
						Search doesn't, so give that a try.
					</p>
					<TextLink to="/" search={{ q: lemma }} icon={Search} className="mt-8">
						Search for &ldquo;
						<span lang="la" className="wrap-anywhere">
							{lemma}
						</span>
						&rdquo;
					</TextLink>
				</>
			}
		/>
	);
}
