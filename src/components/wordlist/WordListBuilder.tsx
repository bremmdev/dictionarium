import { Button } from "@bremmdev/m7kit";
import {
	getRouteApi,
	useNavigate,
	useRouterState,
} from "@tanstack/react-router";
import { ScrollText } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Heading } from "#/components/Heading";
import {
	CONJUGATION_OPTIONS,
	DECLENSION_OPTIONS,
	findConjugation,
	findDeclension,
	MAX_LIST_RESULTS,
	parseLetters,
	type WordListPartOfSpeech,
	type WordListSearch,
} from "#/utils/wordlist/rules";
import { WordCard } from "./WordCard";

const route = getRouteApi("/word-list");

const LABEL =
	"block font-semibold text-gold-600 text-sm uppercase tracking-[0.18em]";

const INPUT =
	"w-full rounded-lg border border-parchment-300 bg-parchment-50 px-3 py-2 text-ink-900 outline-none focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 aria-[invalid=true]:border-accent";

/** The same pill the admin form picks grammar with — a visually hidden radio. */
const CHIP =
	"cursor-pointer rounded-full border border-parchment-300 bg-parchment-50 px-3 py-1 font-semibold text-gold-600 text-xs uppercase tracking-[0.18em] hover:border-gold-400 has-[:checked]:border-accent has-[:checked]:bg-accent has-[:checked]:text-parchment-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent has-[:focus-visible]:outline-offset-2";

const POS_OPTIONS = [
	{ value: "all", label: "All" },
	{ value: "noun", label: "Nouns" },
	{ value: "adjective", label: "Adjectives" },
	{ value: "verb", label: "Verbs" },
] as const;

const ANY = { value: "", label: "Any" };

/** Chips pick by URL param, so that is what the draft holds. */
const toChips = (options: ReadonlyArray<{ param: string; label: string }>) => [
	ANY,
	...options.map(({ param, label }) => ({ value: param, label })),
];

const CONJUGATION_CHIPS = toChips(CONJUGATION_OPTIONS);

type Pos = (typeof POS_OPTIONS)[number]["value"];

/** The form's own copy of the filters: every field present, "" for "any". */
type Draft = { pos: Pos; decl: string; conj: string; letters: string };

function draftFrom(search: WordListSearch): Draft {
	return {
		pos: search.pos ?? "all",
		decl: search.decl ?? "",
		conj: search.conj ?? "",
		letters: search.letters ?? "",
	};
}

/** The inverse: drop every "any", so the URL only says what was chosen. */
function searchFrom(draft: Draft): WordListSearch {
	const letters = draft.letters.trim();
	return {
		...(draft.pos !== "all" && { pos: draft.pos }),
		...(draft.pos !== "all" &&
			draft.pos !== "verb" &&
			draft.decl !== "" && { decl: draft.decl }),
		...(draft.pos === "verb" && draft.conj !== "" && { conj: draft.conj }),
		...(letters !== "" && { letters }),
	};
}

const POS_NOUNS: Record<WordListPartOfSpeech, [string, string]> = {
	noun: ["noun", "nouns"],
	adjective: ["adjective", "adjectives"],
	verb: ["verb", "verbs"],
};

/**
 * The list's summary in pieces, so the count can be set large and the rest
 * small: "nouns" and "of the 1st declension, starting with a-c". Read in order
 * they are still one sentence, which is what the live region announces.
 */
function describe(search: WordListSearch, count: number) {
	const [one, many] = search.pos ? POS_NOUNS[search.pos] : ["word", "words"];
	const qualifiers: Array<string> = [];

	const declension = findDeclension(search.pos, search.decl);
	if (declension) {
		qualifiers.push(`of the ${declension.label} declension`);
	}
	const conjugation = findConjugation(search.conj);
	if (conjugation) {
		qualifiers.push(
			conjugation.value === "irregular"
				? "that are irregular"
				: `of the ${conjugation.label} conjugation`,
		);
	}
	if (search.letters) {
		qualifiers.push(`starting with ${search.letters}`);
	}

	return {
		noun: count === 1 ? one : many,
		qualifier: qualifiers.join(", "),
	};
}

function Summary({ search, count }: { search: WordListSearch; count: number }) {
	const { noun, qualifier } = describe(search, count);

	return (
		// The live region is the summary itself. It only changes when a new list
		// has landed — the loader data swaps in one go — so it never announces
		// an in-between state.
		<div
			aria-live="polite"
			className="flex items-center gap-4 rounded-sm border border-parchment-200 bg-linear-to-r from-parchment-100 to-parchment-50 px-4 py-4 sm:px-6"
		>
			<span
				aria-hidden="true"
				className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-parchment-50 shadow-sm"
			>
				<ScrollText className="h-6 w-6" />
			</span>
			<p className="flex flex-wrap items-baseline gap-x-3">
				<span className="font-bold text-3xl text-accent tabular-nums leading-none">
					{count.toLocaleString()}
				</span>{" "}
				<span className="font-semibold text-gold-600 text-sm uppercase tracking-[0.18em]">
					{noun}
				</span>
				{qualifier && (
					<>
						{" "}
						<span className="mt-1 basis-full text-ink-700">{qualifier}</span>
					</>
				)}
			</p>
		</div>
	);
}

function ChipGroup<T extends string>({
	legend,
	name,
	options,
	value,
	onChange,
}: {
	legend: string;
	name: string;
	options: ReadonlyArray<{ value: T; label: string }>;
	value: T;
	onChange: (value: T) => void;
}) {
	return (
		<fieldset>
			<legend className={LABEL}>{legend}</legend>
			<div className="mt-2 flex flex-wrap gap-2">
				{options.map((option) => (
					<label key={option.value} className={CHIP}>
						<input
							type="radio"
							className="sr-only"
							name={name}
							value={option.value}
							checked={value === option.value}
							onChange={() => onChange(option.value)}
						/>
						{option.label}
					</label>
				))}
			</div>
		</fieldset>
	);
}

export function WordListBuilder() {
	const search = route.useSearch();
	const navigate = useNavigate({ from: "/word-list" });
	const { entries, truncated } = route.useLoaderData();
	// See Search: each filter set is a new match, so isFetching on the match on
	// screen never flips — the router's own loading flag does.
	const isFetching = useRouterState({ select: (s) => s.isLoading });

	const fieldId = useId();
	const lettersRef = useRef<HTMLInputElement>(null);

	// The draft is what the form shows; the URL is the list that was built.
	const [draft, setDraft] = useState(() => draftFrom(search));
	const [error, setError] = useState<string>();

	// Re-sync the form when the URL changes from outside (back/forward, a link).
	const searchKey = JSON.stringify(search);
	const [syncedKey, setSyncedKey] = useState(searchKey);
	if (searchKey !== syncedKey) {
		setSyncedKey(searchKey);
		setDraft(draftFrom(search));
		setError(undefined);
	}

	const update = (patch: Partial<Draft>) =>
		setDraft((prev) => ({ ...prev, ...patch }));

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const letters = draft.letters.trim();
		if (letters !== "") {
			const parsed = parseLetters(letters);
			if (!parsed.ok) {
				setError(parsed.error);
				lettersRef.current?.focus();
				return;
			}
		}

		setError(undefined);
		navigate({ search: searchFrom(draft), resetScroll: false });
	};

	return (
		<>
			<form
				className="space-y-6 rounded-sm border border-parchment-200 bg-surface-subtle/50 p-4 sm:p-6"
				onSubmit={handleSubmit}
				noValidate
			>
				<ChipGroup
					legend="Part of speech"
					name="pos"
					options={POS_OPTIONS}
					value={draft.pos}
					// A declension means nothing to a verb, so a new part of speech
					// starts its own inflection filter afresh.
					onChange={(pos) => update({ pos, decl: "", conj: "" })}
				/>

				{(draft.pos === "noun" || draft.pos === "adjective") && (
					<ChipGroup
						legend="Declension"
						name="decl"
						options={toChips(DECLENSION_OPTIONS[draft.pos])}
						value={draft.decl}
						onChange={(decl) => update({ decl })}
					/>
				)}

				{draft.pos === "verb" && (
					<ChipGroup
						legend="Conjugation"
						name="conj"
						options={CONJUGATION_CHIPS}
						value={draft.conj}
						onChange={(conj) => update({ conj })}
					/>
				)}

				<div className="space-y-2">
					<label htmlFor={`${fieldId}-letters`} className={LABEL}>
						Starting with
					</label>
					<p id={`${fieldId}-letters-hint`} className="text-ink-600 text-sm">
						A letter (<kbd>a</kbd>), a range (<kbd>h-l</kbd>) or a list (
						<kbd>a,b,e</kbd>). Leave empty for every letter.
					</p>
					<input
						id={`${fieldId}-letters`}
						ref={lettersRef}
						type="text"
						autoComplete="off"
						spellCheck={false}
						placeholder="a-z"
						className={`${INPUT} max-w-xs font-bold tracking-wide`}
						aria-invalid={error !== undefined}
						aria-describedby={
							error === undefined
								? `${fieldId}-letters-hint`
								: `${fieldId}-letters-hint ${fieldId}-letters-error`
						}
						value={draft.letters}
						onChange={(e) => {
							update({ letters: e.target.value });
							if (error) setError(undefined);
						}}
					/>
					{error && (
						<p id={`${fieldId}-letters-error`} className="text-accent text-sm">
							{error}
						</p>
					)}
				</div>

				<Button type="submit" variant="primary" className="uppercase" lang="la">
					Collige
					<span className="sr-only" lang="en">
						{" (build list)"}
					</span>
				</Button>
			</form>

			<section
				aria-labelledby="word-list-heading"
				aria-busy={isFetching}
				className={`space-y-4 ${isFetching ? "animate-pulse" : ""}`}
			>
				<Heading variant="h2" id="word-list-heading" className="sr-only">
					Word list
				</Heading>

				<Summary search={search} count={entries.length} />

				{truncated && (
					<p className="text-center text-ink-600">
						Showing the first {MAX_LIST_RESULTS}. Narrow the letters to see the
						rest.
					</p>
				)}

				{entries.length === 0 && !isFetching && (
					<p className="text-center text-lg">
						<span className="font-bold text-accent" lang="la">
							Nihil inventum.
						</span>{" "}
						<span className="text-ink-600">No words match these filters.</span>
					</p>
				)}

				{entries.length > 0 && (
					<ul className="divide-y divide-parchment-200 rounded-sm border border-parchment-200 bg-surface-subtle/50">
						{entries.map((entry) => (
							<li key={entry.id}>
								<WordCard entry={entry} />
							</li>
						))}
					</ul>
				)}
			</section>
		</>
	);
}
