import { Button } from "@bremmdev/m7kit";
import { useRouter } from "@tanstack/react-router";
import { useId, useReducer, useRef } from "react";
import {
	CHIP,
	ChipGroup,
	FieldError,
	INPUT,
	LABEL,
} from "#/components/admin/Fields";
import { Heading } from "#/components/Heading";
import type { Proverb } from "#/db/schema";
import { createProverb, updateProverb } from "#/server/proverbs";
import {
	initialProverbFormState,
	type ProverbFields,
	proverbFiling,
	proverbFormReducer,
} from "#/utils/proverbs/form";
import {
	ANONYMOUS,
	ProverbValidationError,
	parseProverbDraft,
} from "#/utils/proverbs/rules";
import { normalizeLemma } from "#/utils/search/rules";

const MODES = ["add", "edit"] as const;

/** One labelled input or textarea, with its hint and its message. */
function TextField({
	id,
	label,
	hint,
	optional = false,
	multiline = false,
	lang,
	placeholder,
	className = "",
	error,
	describedBy,
	inputRef,
	value,
	onChange,
}: {
	id: string;
	label: string;
	hint: string;
	optional?: boolean;
	multiline?: boolean;
	lang?: string;
	placeholder?: string;
	className?: string;
	error?: string;
	/** Read instead of the error id while there is no error. */
	describedBy?: string;
	inputRef?: React.Ref<HTMLInputElement>;
	value: string;
	onChange: (value: string) => void;
}) {
	const props = {
		id,
		lang,
		placeholder,
		autoComplete: "off",
		spellCheck: lang === "la" ? false : undefined,
		className: `${INPUT} ${className}`,
		"aria-invalid": error !== undefined,
		"aria-describedby": error === undefined ? describedBy : `${id}-error`,
		value,
	};

	return (
		<div className="space-y-2">
			<label htmlFor={id} className={LABEL}>
				{label}
				{optional && (
					<>
						{" "}
						<span className="text-ink-600 lowercase">(optional)</span>
					</>
				)}
			</label>
			<p className="text-ink-600 text-sm">{hint}</p>
			{multiline ? (
				<textarea
					rows={3}
					{...props}
					onChange={(e) => onChange(e.target.value)}
				/>
			) : (
				<input
					type="text"
					ref={inputRef}
					{...props}
					onChange={(e) => onChange(e.target.value)}
				/>
			)}
			{error && <FieldError id={`${id}-error`}>{error}</FieldError>}
		</div>
	);
}

/**
 * The proverb desk: the word desk's counterpart for a sentence, with its own
 * add/edit switch because a proverb has no page to start an edit from.
 *
 * As on the word desk, nothing here decides what is valid — parseProverbDraft
 * does, here for the messages and on the server for real — and nothing here
 * decides how the draft moves: proverbFormReducer does.
 */
export function ProverbForm({ proverbs }: { proverbs: Array<Proverb> }) {
	const router = useRouter();
	const fieldId = useId();

	const [state, dispatch] = useReducer(
		proverbFormReducer,
		initialProverbFormState,
	);
	const { mode, draft, anonymous, errors, status } = state;

	const summaryRef = useRef<HTMLDivElement>(null);
	const pickerRef = useRef<HTMLSelectElement>(null);
	const latinRef = useRef<HTMLInputElement>(null);

	const editing = mode.kind === "edit";
	/** Editing, with nothing picked yet: the picker is the whole desk. */
	const picking = mode.kind === "edit" && mode.id === null;

	const setField = (name: keyof ProverbFields) => (value: string) =>
		dispatch({ type: "field", name, value });

	/**
	 * Back to the picker. The fields are about to unmount with focus possibly
	 * inside them, and the picker is where the next edit starts anyway.
	 */
	const backToPicker = () => {
		dispatch({ type: "proverb-picked", proverb: null });
		pickerRef.current?.focus();
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (status.kind === "pending" || picking) return;

		const filing = proverbFiling(state);

		try {
			parseProverbDraft(filing);
		} catch (err) {
			if (!(err instanceof ProverbValidationError)) throw err;

			dispatch({ type: "submit-invalid", fields: err.fields });
			summaryRef.current?.focus();
			return;
		}

		dispatch({ type: "submit-started" });

		try {
			const { textLa } =
				mode.kind === "edit" && mode.id !== null
					? await updateProverb({ data: { ...filing, id: mode.id } })
					: await createProverb({ data: filing });

			dispatch({ type: "submit-succeeded", textLa });

			// Focus goes where the next one starts, in the same flow: the picker
			// after an edit, whose fields have just left the screen, and the Latin
			// after a create. Either way the button just pressed was disabled
			// while it worked, which already dropped focus to <body>.
			if (mode.kind === "edit") {
				pickerRef.current?.focus();
			} else {
				latinRef.current?.focus();
			}

			// The picker lists what the loader read, and this save is what makes
			// that list out of date.
			await router.invalidate();
		} catch (err) {
			dispatch({
				type: "submit-failed",
				message:
					err instanceof Error
						? err.message
						: "That proverb could not be saved.",
			});
			summaryRef.current?.focus();
		}
	};

	const problems = Object.values(errors);
	const searchKey = normalizeLemma(draft.textLa);

	return (
		<div className="space-y-10">
			<div className="space-y-6">
				<Heading variant="h2" as="h1" lang="la">
					{editing ? "Prōverbium ēmendandum" : "Prōverbium novum"}
					<span className="sr-only" lang="en">
						{editing ? " (a proverb to correct)" : " (a new proverb)"}
					</span>
				</Heading>

				<ChipGroup
					legend="Action"
					name={`${fieldId}-mode`}
					options={MODES}
					value={editing ? "edit" : "add"}
					onChange={(value) =>
						dispatch({
							type: "mode-changed",
							mode: value === "edit" ? "edit" : "create",
						})
					}
				/>
			</div>

			<form className="space-y-10" onSubmit={handleSubmit} noValidate>
				<div ref={summaryRef} tabIndex={-1} className="focus-ring space-y-4">
					{status.kind === "saved" && (
						<output className="block rounded-lg border border-parchment-300 bg-parchment-100 px-4 py-3">
							<span className="font-bold text-accent" lang="la">
								{status.created ? "Additum." : "Ēmendātum."}
							</span>{" "}
							<span className="italic" lang="la">
								{status.textLa}
							</span>{" "}
							<span className="text-ink-600">
								{status.created
									? "is filed among the proverbs."
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
				</div>

				{editing && (
					<div className="space-y-2">
						<label htmlFor={`${fieldId}-picker`} className={LABEL}>
							Proverb
						</label>
						<p className="text-ink-600 text-sm">
							The proverb to correct. Picking another replaces whatever is in
							the form.
						</p>
						<select
							id={`${fieldId}-picker`}
							ref={pickerRef}
							className={INPUT}
							value={mode.id ?? ""}
							onChange={(e) =>
								dispatch({
									type: "proverb-picked",
									proverb:
										proverbs.find((p) => p.id === Number(e.target.value)) ??
										null,
								})
							}
						>
							<option value="">
								{proverbs.length === 0
									? "No proverbs filed yet"
									: "Choose a proverb…"}
							</option>
							{proverbs.map((proverb) => (
								<option key={proverb.id} value={proverb.id} lang="la">
									{proverb.textLa}
								</option>
							))}
						</select>
					</div>
				)}

				{!picking && (
					<>
						<div className="space-y-2">
							<TextField
								id={`${fieldId}-text-la`}
								label="Latin"
								hint="The proverb as it is written, with its macrons."
								lang="la"
								placeholder="Fēstīnā lentē"
								className="font-bold text-xl tracking-wide"
								error={errors.textLa}
								describedBy={
									searchKey === "" ? undefined : `${fieldId}-text-key`
								}
								inputRef={latinRef}
								value={draft.textLa}
								onChange={setField("textLa")}
							/>
							{/* text_plain is derived, never typed — shown for the reason
							    the word desk shows lemma_plain. */}
							{searchKey !== "" && errors.textLa === undefined && (
								<p id={`${fieldId}-text-key`} className="text-ink-600 text-sm">
									Searchable as <span className="font-bold">{searchKey}</span>
								</p>
							)}
						</div>

						<TextField
							id={`${fieldId}-translation`}
							label="Translation"
							hint="What it says, translated."
							placeholder="Make haste slowly."
							error={errors.translationEn}
							value={draft.translationEn}
							onChange={setField("translationEn")}
						/>

						<TextField
							id={`${fieldId}-meaning`}
							label="Meaning"
							optional
							hint="What it is used to mean, where that differs from what it says. Leave it empty when the translation already is the meaning."
							placeholder="More haste, less speed."
							value={draft.meaningEn}
							onChange={setField("meaningEn")}
						/>

						<fieldset className="space-y-2">
							<legend className={LABEL}>Author</legend>
							<p className="text-ink-600 text-sm">
								Who wrote or said it — or {ANONYMOUS}, for a saying with nobody
								to name.
							</p>
							<div className="flex flex-wrap items-center gap-3">
								{/* Gone while anonymous is ticked, and emptied with it: a
								    name nobody can see is never on its way to the database. */}
								{!anonymous && (
									<>
										<label htmlFor={`${fieldId}-author`} className="sr-only">
											Author's name
										</label>
										<input
											id={`${fieldId}-author`}
											type="text"
											autoComplete="off"
											placeholder="Horace"
											className={`${INPUT} min-w-48 flex-1`}
											aria-invalid={errors.author !== undefined}
											aria-describedby={
												errors.author === undefined
													? undefined
													: `${fieldId}-author-error`
											}
											value={draft.author}
											onChange={(e) => setField("author")(e.target.value)}
										/>
									</>
								)}
								<label className={CHIP}>
									<input
										type="checkbox"
										className="sr-only"
										checked={anonymous}
										onChange={(e) =>
											dispatch({
												type: "anonymous-changed",
												anonymous: e.target.checked,
											})
										}
									/>
									{ANONYMOUS}
									<span className="sr-only"> (no author to name)</span>
								</label>
							</div>
							{errors.author && (
								<FieldError id={`${fieldId}-author-error`}>
									{errors.author}
								</FieldError>
							)}
						</fieldset>

						<TextField
							id={`${fieldId}-source`}
							label="Source"
							optional
							hint="Where it is found: the work and the passage."
							placeholder="Odes 1.11.8"
							value={draft.source}
							onChange={setField("source")}
						/>

						<TextField
							id={`${fieldId}-notes`}
							label="Notes"
							optional
							multiline
							hint="Anything worth knowing that the fields above cannot hold."
							value={draft.notes}
							onChange={setField("notes")}
						/>

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
									{editing ? " (save changes)" : " (add proverb)"}
								</span>
							</Button>

							{editing && (
								<button
									type="button"
									onClick={backToPicker}
									className="focus-ring text-accent"
								>
									Cancel
								</button>
							)}
						</div>
					</>
				)}
			</form>
		</div>
	);
}
