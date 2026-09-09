import { Button } from "@bremmdev/m7kit";
import { Link, useRouter } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import { useEffect, useId, useReducer, useRef } from "react";
import type { EntryWithSenses } from "#/db/schema";
import { createEntry, suggestEntry, updateEntry } from "#/server/entries";
import {
	type DraftFields,
	entryFormState,
	formReducer,
	initialFormState,
} from "#/utils/entries/form";
import {
	CONJUGATIONS,
	DECLENSIONS,
	EntryValidationError,
	GENDERS,
	hasPrincipalParts,
	INFLECTS,
	isPartOfSpeech,
	PARTS_OF_SPEECH,
	parseEntryDraft,
} from "#/utils/entries/rules";
import { normalizeLemma } from "#/utils/search/rules";

const LABEL =
	"block font-semibold text-gold-600 text-sm uppercase tracking-[0.18em]";

const INPUT =
	"w-full rounded-lg border border-parchment-300 bg-parchment-50 px-3 py-2 text-ink-900 outline-none focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 aria-[invalid=true]:border-accent";

/**
 * A radio wearing the same pill the detail page prints its grammar in, so the
 * thing being picked here looks like the thing that ends up on the card. The
 * input stays a real radio and is only visually hidden: arrow keys, the label
 * association and the required grouping all come free that way.
 */
const CHIP =
	"cursor-pointer rounded-full border border-parchment-300 bg-parchment-50 px-3 py-1 font-semibold text-gold-600 text-xs uppercase tracking-[0.18em] hover:border-gold-400 has-[:checked]:border-accent has-[:checked]:bg-accent has-[:checked]:text-parchment-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent has-[:focus-visible]:outline-offset-2";

function FieldError({ id, children }: { id: string; children: string }) {
	return (
		<p id={id} className="mt-2 text-accent text-sm">
			{children}
		</p>
	);
}

function ChipGroup({
	legend,
	hint,
	name,
	options,
	value,
	error,
	onChange,
}: {
	legend: string;
	hint?: string;
	name: string;
	options: ReadonlyArray<string>;
	value: string;
	error?: string;
	onChange: (value: string) => void;
}) {
	const errorId = `${name}-error`;

	return (
		<fieldset aria-describedby={error ? errorId : undefined}>
			<legend className={LABEL}>{legend}</legend>
			{hint && <p className="mt-1 text-ink-500 text-sm">{hint}</p>}

			<div className="mt-2 flex flex-wrap gap-2">
				{options.map((option) => (
					<label key={option} className={CHIP}>
						<input
							type="radio"
							className="sr-only"
							name={name}
							value={option}
							checked={value === option}
							onChange={() => onChange(option)}
						/>
						{option}
					</label>
				))}
			</div>

			{error && <FieldError id={errorId}>{error}</FieldError>}
		</fieldset>
	);
}

/**
 * The editor's desk: one word, the way `scripts/seed.ts` used to spell it out.
 *
 * Nothing here decides what is valid. parseEntryDraft does, and this form calls
 * it on submit for the messages only — the same function runs again as
 * createEntry's and updateEntry's validator, where it is the actual gate.
 * Nothing here decides how the draft moves either: formReducer does, so one
 * user action is one named transition rather than a handful of setters that
 * have to agree.
 *
 * What is left is this component's own job: show the fields the chosen part of
 * speech has to answer and hide the ones it must leave NULL, so the shape of
 * the entry is visible before it is submitted rather than explained afterwards
 * by an error.
 *
 * One form, two flows. `entry` is the whole difference: absent, this files a
 * new word; present, it files that one again. A draft is a draft whether it
 * came from Wiktionary, from nothing, or from a row — so the fields, the
 * validation, the focus handling and Quaere are shared rather than reproduced,
 * and what differs is confined to `state.mode`. Which is also why the form is
 * not keyed by the entry and remounted: it has to survive the moment a saved
 * edit turns it back into a new word's desk, banner and all.
 */
export function EntryForm({ entry }: { entry?: EntryWithSenses | null }) {
	const router = useRouter();
	const fieldId = useId();

	const [state, dispatch] = useReducer(formReducer, entry, (from) =>
		from ? entryFormState(from) : initialFormState,
	);
	const { draft, senses, errors, status, lookup, mode } = state;

	const editing = mode.kind === "edit";

	const meaningRefs = useRef(new Map<number, HTMLInputElement>());
	const exampleRefs = useRef(new Map<number, HTMLInputElement>());
	const addSenseRef = useRef<HTMLButtonElement>(null);
	const summaryRef = useRef<HTMLDivElement>(null);

	/**
	 * Which word the form is currently showing, as opposed to which one the
	 * route is currently holding. They are the same except for one moment, and
	 * that moment is the reason this is a ref rather than a `key` on the
	 * component: a saved edit empties the desk itself and then sends the route
	 * to /admin, so the entry disappearing from the route is news the form has
	 * already acted on. Re-acting on it would wipe the banner that says so.
	 */
	const shown = useRef(entry?.id ?? null);

	useEffect(() => {
		const id = entry?.id ?? null;
		if (shown.current === id) return;

		// A different word arrived — from an edit link, or from leaving one.
		shown.current = id;
		dispatch({ type: "entry-loaded", entry: entry ?? null });
	}, [entry]);

	useEffect(() => {
		if (state.focusSense === null) return;
		meaningRefs.current.get(state.focusSense)?.focus();
		dispatch({ type: "focus-handled" });
	}, [state.focusSense]);

	useEffect(() => {
		if (state.focusExample === null) return;
		exampleRefs.current.get(state.focusExample)?.focus();
		dispatch({ type: "example-focus-handled" });
	}, [state.focusExample]);

	const asks = isPartOfSpeech(draft.partOfSpeech)
		? INFLECTS[draft.partOfSpeech]
		: undefined;

	const setField = (name: keyof DraftFields) => (value: string) =>
		dispatch({ type: "field", name, value });

	const removeSense = (id: number) => {
		dispatch({ type: "sense-removed", id });
		// This row is about to unmount with focus inside it, so hand focus on
		// rather than letting it fall to <body>.
		addSenseRef.current?.focus();
	};

	/**
	 * Fills the form from Wiktionary and stops there. Everything it writes is a
	 * suggestion to be read: it replaces the draft rather than merging into it,
	 * so what is on screen afterwards is one word's filing and not two halves of
	 * different ones.
	 */
	const handleLookup = async () => {
		if (lookup.kind === "pending" || draft.lemma.trim() === "") return;

		dispatch({ type: "lookup-started" });

		try {
			const suggestion = await suggestEntry({
				data: { lemma: draft.lemma, partOfSpeech: draft.partOfSpeech },
			});
			dispatch({ type: "lookup-filled", suggestion });
		} catch (err) {
			dispatch({
				type: "lookup-failed",
				message:
					err instanceof Error ? err.message : "Wiktionary could not be read.",
			});
		}
		// Focus stays in the lemma field either way: a lookup that found nothing
		// is usually a spelling to fix, and one that worked has filled the fields
		// the editor is about to read. Both banners announce themselves.
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (status.kind === "pending") return;

		const filing = {
			...draft,
			// Named rather than spread: `id` and `showExamples` are this form's own
			// bookkeeping and have no business crossing to the server. Anything a
			// sense actually carries has to be listed here — a column added to the
			// row and forgotten in this line is a column that silently saves empty.
			senses: senses.map(({ meaningEn, usage, exampleLa, exampleEn }) => ({
				meaningEn,
				usage,
				exampleLa,
				exampleEn,
			})),
		};

		try {
			parseEntryDraft(filing);
		} catch (err) {
			if (!(err instanceof EntryValidationError)) throw err;

			dispatch({ type: "submit-invalid", fields: err.fields });
			// Every message at once, at the top, with focus moved to it: a form
			// this long can put its first problem above the fold and its second
			// below it.
			summaryRef.current?.focus();
			return;
		}

		dispatch({ type: "submit-started" });

		try {
			const { lemma: saved } =
				mode.kind === "edit"
					? await updateEntry({ data: { ...filing, id: mode.id } })
					: await createEntry({ data: filing });

			// Ahead of the dispatch, because the dispatch is what empties the desk
			// and drops it back to `create`: from here on the form is showing no
			// word, and the navigation below must not be read as news.
			shown.current = null;
			dispatch({ type: "submit-succeeded", lemma: saved });

			// The desk is a new word's again, so the URL has to stop naming the old
			// one — the heading above the form reads from it. Replace rather than
			// push: an emptied form is not a place to go Back to.
			if (mode.kind === "edit") {
				await router.navigate({ to: "/admin", search: {}, replace: true });
			}

			// The word count on the home page comes from a loader, and it is cached
			// until something says otherwise. So is the entry the detail page just
			// showed, and this save is what makes it wrong. This is that something.
			await router.invalidate();
		} catch (err) {
			dispatch({
				type: "submit-failed",
				message:
					err instanceof Error ? err.message : "That entry could not be saved.",
			});
			summaryRef.current?.focus();
		}
	};

	const problems = Object.values(errors);
	const searchKey = normalizeLemma(draft.lemma);

	return (
		<form className="space-y-10" onSubmit={handleSubmit} noValidate>
			{/* One live region for every outcome, so a screen reader hears the
			    result of a submit or a lookup whichever way it went. */}
			<div ref={summaryRef} tabIndex={-1} className="focus-ring space-y-4">
				{status.kind === "saved" && (
					// <output> rather than a <p role="status">: it is the element that
					// carries that role natively, and this is a result of a submit.
					<output className="block rounded-lg border border-parchment-300 bg-parchment-100 px-4 py-3">
						<span className="font-bold text-accent" lang="la">
							{status.created ? "Additum." : "Ēmendātum."}
						</span>{" "}
						<Link
							to="/verbum/$lemma"
							params={{ lemma: status.lemma }}
							search={{}}
							className="focus-ring text-accent underline"
							lang="la"
						>
							{status.lemma}
						</Link>{" "}
						<span className="text-ink-500">
							{status.created
								? "is in the dictionary."
								: "is filed as it now reads."}
						</span>
					</output>
				)}

				{(problems.length > 0 || status.kind === "failed") && (
					<div
						role="alert"
						className="rounded-lg border border-accent bg-parchment-100 px-4 py-3"
					>
						<p className="font-bold text-accent" lang="la">
							Nōn licet.
						</p>
						<ul className="mt-2 list-disc space-y-1 pl-5 text-ink-700 text-sm">
							{status.kind === "failed" && <li>{status.message}</li>}
							{problems.map((problem) => (
								<li key={problem}>{problem}</li>
							))}
						</ul>
					</div>
				)}

				{lookup.kind === "filled" && (
					// With nothing to warn about there is nothing to show, and the
					// element has to leave the flow rather than sit in it at zero
					// height: an empty summary region self-collapses, and one holding
					// an invisible block does not, which is a 40px hole under the
					// heading that nobody can see the reason for.
					<output className={lookup.warnings.length > 0 ? "block" : "sr-only"}>
						{/* The filled fields are the confirmation, and they are right
						    there — but only to someone looking at them. */}
						<span className="sr-only">Wiktionary filled the form.</span>

						{lookup.warnings.length > 0 && (
							<ul className="list-disc space-y-1 rounded-lg border border-parchment-300 bg-parchment-100 py-3 pr-4 pl-9 text-ink-700 text-sm">
								{lookup.warnings.map((warning) => (
									<li key={warning}>{warning}</li>
								))}
							</ul>
						)}
					</output>
				)}

				{lookup.kind === "failed" && (
					<div
						role="alert"
						className="rounded-lg border border-accent bg-parchment-100 px-4 py-3"
					>
						<p className="font-bold text-accent" lang="la">
							Nihil inventum.
						</p>
						<p className="mt-2 text-ink-700 text-sm">{lookup.message}</p>
					</div>
				)}
			</div>

			<div className="space-y-2">
				<label htmlFor={`${fieldId}-lemma`} className={LABEL}>
					Lemma
				</label>
				<p className="text-ink-500 text-sm">
					The headword with its macrons: the first principal part of a verb, the
					nominative of a noun, the word itself otherwise. Quaere fills the rest
					of the form from Wiktionary, replacing whatever is in it.
				</p>
				<div className="flex flex-wrap items-start gap-3">
					<input
						id={`${fieldId}-lemma`}
						type="text"
						lang="la"
						autoComplete="off"
						spellCheck={false}
						placeholder="labōrō"
						className={`${INPUT} min-w-48 flex-1 font-bold text-xl tracking-wide`}
						aria-invalid={errors.lemma !== undefined}
						aria-describedby={
							errors.lemma === undefined
								? `${fieldId}-lemma-key`
								: `${fieldId}-lemma-error`
						}
						value={draft.lemma}
						onChange={(e) => setField("lemma")(e.target.value)}
					/>

					{/* Three corrections to the secondary button, all of them about
					    what disabled looks like. Its hover tint applies to a disabled
					    button too, which offers a press that cannot happen; its spinner
					    is painted in the inverse foreground, which on this surface is
					    parchment on parchment; and a button disabled because it is
					    working would otherwise wear the fade that says unavailable over
					    the spinner that says wait. */}
					<Button
						type="button"
						variant="secondary"
						className={`uppercase disabled:hover:bg-accent/5 [&_svg]:text-accent ${
							lookup.kind === "pending" ? "disabled:opacity-100" : ""
						}`}
						lang="la"
						isLoading={lookup.kind === "pending"}
						disabled={draft.lemma.trim() === "" || lookup.kind === "pending"}
						onClick={handleLookup}
					>
						Quaere
						<span className="sr-only" lang="en">
							{" (look this word up on Wiktionary and fill the form)"}
						</span>
					</Button>
				</div>
				{/* lemma_plain is derived, never typed — showing it is the cheapest way
				    to say so, and it is the key every search actually matches on. */}
				{searchKey !== "" && errors.lemma === undefined && (
					<p id={`${fieldId}-lemma-key`} className="text-ink-500 text-sm">
						Searchable as <span className="font-bold">{searchKey}</span>
					</p>
				)}
				{errors.lemma && (
					<FieldError id={`${fieldId}-lemma-error`}>{errors.lemma}</FieldError>
				)}
			</div>

			<ChipGroup
				legend="Part of speech"
				name={`${fieldId}-part-of-speech`}
				options={PARTS_OF_SPEECH}
				value={draft.partOfSpeech}
				error={errors.partOfSpeech}
				onChange={setField("partOfSpeech")}
			/>

			{draft.partOfSpeech === "" ? (
				<p className="text-ink-500">
					Pick a part of speech and the fields it has to answer appear here.
				</p>
			) : (
				<div className="space-y-8 border-parchment-300 border-l-2 pl-6">
					{asks === "declension" && (
						<ChipGroup
							legend="Declension"
							hint="How the word inflects. indeclinable is an answer, not an absence."
							name={`${fieldId}-declension`}
							options={DECLENSIONS}
							value={draft.declension}
							error={errors.declension}
							onChange={setField("declension")}
						/>
					)}

					{asks === "conjugation" && (
						<ChipGroup
							legend="Conjugation"
							hint="How the word inflects. irregular is an answer, not an absence."
							name={`${fieldId}-conjugation`}
							options={CONJUGATIONS}
							value={draft.conjugation}
							error={errors.conjugation}
							onChange={setField("conjugation")}
						/>
					)}

					{draft.partOfSpeech === "noun" && (
						<ChipGroup
							legend="Gender"
							hint="m masculine, f feminine, n neuter."
							name={`${fieldId}-gender`}
							options={GENDERS}
							value={draft.gender}
							error={errors.gender}
							onChange={setField("gender")}
						/>
					)}

					{hasPrincipalParts(draft.partOfSpeech) && (
						<div className="space-y-2">
							<label htmlFor={`${fieldId}-principal-parts`} className={LABEL}>
								{draft.partOfSpeech === "verb" ? "Principal parts" : "Genitive"}
							</label>
							<p className="text-ink-500 text-sm">
								{draft.partOfSpeech === "verb"
									? "The rest of the filing, separated by commas: present, infinitive, perfect, supine."
									: "The rest of the filing, as a dictionary prints it after the nominative."}
							</p>
							<input
								id={`${fieldId}-principal-parts`}
								type="text"
								lang="la"
								autoComplete="off"
								spellCheck={false}
								placeholder={
									draft.partOfSpeech === "verb"
										? "labōrō, labōrāre, labōrāvī, labōrātum"
										: "puellae"
								}
								className={`${INPUT} italic`}
								aria-invalid={errors.principalParts !== undefined}
								aria-describedby={
									errors.principalParts === undefined
										? undefined
										: `${fieldId}-principal-parts-error`
								}
								value={draft.principalParts}
								onChange={(e) => setField("principalParts")(e.target.value)}
							/>
							{errors.principalParts && (
								<FieldError id={`${fieldId}-principal-parts-error`}>
									{errors.principalParts}
								</FieldError>
							)}
						</div>
					)}
				</div>
			)}

			<fieldset className="space-y-4">
				<legend className={LABEL}>Senses</legend>
				<p className="text-ink-500 text-sm">
					One row per genuinely distinct meaning, the first being the core one.
					Commas within a sense, rows between senses.
					{editing &&
						" Saving replaces every sense this word has with the rows below, so position here is the rank it is filed under."}
				</p>

				<ol className="space-y-3">
					{senses.map((sense, i) => {
						const meaningError = errors[`senses.${i}.meaningEn`];
						const exampleLaError = errors[`senses.${i}.exampleLa`];
						const exampleEnError = errors[`senses.${i}.exampleEn`];

						return (
							<li
								key={sense.id}
								className="flex gap-4 rounded-lg border border-parchment-200 bg-parchment-100 p-4"
							>
								{/* The rank, shown the way the detail page shows it — it is
								    position in this list, so it is not editable. */}
								<span className="mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-300 font-bold text-ink-900 text-sm tabular-nums">
									{i + 1}
								</span>

								<div className="flex-1 space-y-3">
									<div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
										<div>
											<label
												htmlFor={`${fieldId}-meaning-${sense.id}`}
												className="sr-only"
											>
												Meaning of sense {i + 1}
											</label>
											<input
												id={`${fieldId}-meaning-${sense.id}`}
												ref={(node) => {
													if (node) meaningRefs.current.set(sense.id, node);
													else meaningRefs.current.delete(sense.id);
												}}
												type="text"
												autoComplete="off"
												placeholder="to work, labour"
												className={INPUT}
												aria-invalid={meaningError !== undefined}
												aria-describedby={
													meaningError === undefined
														? undefined
														: `${fieldId}-meaning-${sense.id}-error`
												}
												value={sense.meaningEn}
												onChange={(e) =>
													dispatch({
														type: "sense-changed",
														id: sense.id,
														patch: { meaningEn: e.target.value },
													})
												}
											/>
											{meaningError && (
												<FieldError id={`${fieldId}-meaning-${sense.id}-error`}>
													{meaningError}
												</FieldError>
											)}
										</div>

										<div>
											<label
												htmlFor={`${fieldId}-usage-${sense.id}`}
												className="sr-only"
											>
												Usage label for sense {i + 1} (optional)
											</label>
											<input
												id={`${fieldId}-usage-${sense.id}`}
												type="text"
												autoComplete="off"
												placeholder="usage (optional)"
												className={INPUT}
												value={sense.usage}
												onChange={(e) =>
													dispatch({
														type: "sense-changed",
														id: sense.id,
														patch: { usage: e.target.value },
													})
												}
											/>
										</div>
									</div>

									{sense.showExamples && (
										<div className="grid gap-3 sm:grid-cols-2">
											<div>
												<label
													htmlFor={`${fieldId}-example-la-${sense.id}`}
													className="sr-only"
												>
													Latin example for sense {i + 1}
												</label>
												<input
													id={`${fieldId}-example-la-${sense.id}`}
													ref={(node) => {
														if (node) exampleRefs.current.set(sense.id, node);
														else exampleRefs.current.delete(sense.id);
													}}
													type="text"
													lang="la"
													autoComplete="off"
													spellCheck={false}
													placeholder="magnā cum laude"
													className={`${INPUT} italic`}
													aria-invalid={exampleLaError !== undefined}
													aria-describedby={
														exampleLaError === undefined
															? undefined
															: `${fieldId}-example-la-${sense.id}-error`
													}
													value={sense.exampleLa}
													onChange={(e) =>
														dispatch({
															type: "sense-changed",
															id: sense.id,
															patch: { exampleLa: e.target.value },
														})
													}
												/>
												{exampleLaError && (
													<FieldError
														id={`${fieldId}-example-la-${sense.id}-error`}
													>
														{exampleLaError}
													</FieldError>
												)}
											</div>

											<div>
												<label
													htmlFor={`${fieldId}-example-en-${sense.id}`}
													className="sr-only"
												>
													English translation of the example for sense {i + 1}
												</label>
												<input
													id={`${fieldId}-example-en-${sense.id}`}
													type="text"
													autoComplete="off"
													placeholder="with great praise"
													className={INPUT}
													aria-invalid={exampleEnError !== undefined}
													aria-describedby={
														exampleEnError === undefined
															? undefined
															: `${fieldId}-example-en-${sense.id}-error`
													}
													value={sense.exampleEn}
													onChange={(e) =>
														dispatch({
															type: "sense-changed",
															id: sense.id,
															patch: { exampleEn: e.target.value },
														})
													}
												/>
												{exampleEnError && (
													<FieldError
														id={`${fieldId}-example-en-${sense.id}-error`}
													>
														{exampleEnError}
													</FieldError>
												)}
											</div>
										</div>
									)}

									{/* Off by default and revealed per sense: most senses carry
									    no example, and two empty inputs on every row is a wall.
									    Hiding clears, so what is off screen is never also
									    on its way to the database. */}
									<button
										type="button"
										onClick={() =>
											dispatch({
												type: sense.showExamples
													? "sense-examples-hidden"
													: "sense-examples-shown",
												id: sense.id,
											})
										}
										className="focus-ring inline-flex items-center gap-1.5 font-semibold text-ink-500 text-xs uppercase tracking-[0.18em] hover:text-accent"
									>
										{sense.showExamples ? (
											<X className="h-3 w-3" aria-hidden="true" />
										) : (
											<Plus className="h-3 w-3" aria-hidden="true" />
										)}
										{sense.showExamples ? "Remove example" : "Add example"}
										<span className="sr-only"> for sense {i + 1}</span>
									</button>
								</div>

								{/* An entry needs at least one sense, so the last row has
								    nothing to remove. */}
								{senses.length > 1 && (
									<button
										type="button"
										onClick={() => removeSense(sense.id)}
										className="focus-ring mt-1 h-8 w-8 shrink-0 rounded-full text-ink-500 hover:bg-parchment-200 hover:text-accent"
									>
										<X className="mx-auto h-4 w-4" aria-hidden="true" />
										<span className="sr-only">Remove sense {i + 1}</span>
									</button>
								)}
							</li>
						);
					})}
				</ol>

				<button
					type="button"
					ref={addSenseRef}
					onClick={() => dispatch({ type: "sense-added" })}
					className="focus-ring inline-flex items-center gap-2 rounded-full border border-parchment-300 px-4 py-2 font-semibold text-accent text-sm uppercase tracking-[0.18em] hover:border-accent"
				>
					<Plus className="h-4 w-4" aria-hidden="true" />
					Add sense
				</button>
			</fieldset>

			<div className="space-y-2">
				<label htmlFor={`${fieldId}-notes`} className={LABEL}>
					Notes <span className="text-ink-500 lowercase">(optional)</span>
				</label>
				<p className="text-ink-500 text-sm">
					Anything the columns cannot hold as an enum — “suppletive”, or the
					grammar behind a filing decision.
				</p>
				<textarea
					id={`${fieldId}-notes`}
					rows={3}
					className={INPUT}
					value={draft.notes}
					onChange={(e) => setField("notes")(e.target.value)}
				/>
			</div>

			<div className="flex flex-wrap items-center gap-6">
				<Button
					type="submit"
					variant="primary"
					className="uppercase"
					lang="la"
					isLoading={status.kind === "pending"}
				>
					{editing ? "Ēmenda" : "Adde"}
					<span className="sr-only" lang="en">
						{editing ? " (save changes)" : " (add entry)"}
					</span>
				</Button>

				{/* The way back out of an edit without making one. A create has no
				    equivalent: there is no word it came from. */}
				{editing && (
					<Link
						to="/verbum/$lemma"
						params={{ lemma: entry?.lemma ?? draft.lemma }}
						search={{}}
						className="focus-ring text-accent"
					>
						Cancel
					</Link>
				)}
			</div>
		</form>
	);
}
