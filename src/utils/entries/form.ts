/**
 * The transitions the entry form makes, as a pure function.
 *
 * Two rules in particular were living in event handlers, where every future
 * caller had to remember them. They live here instead:
 *
 *   - a question that does not apply has to stay NULL, so changing the part of
 *     speech clears the answers that just stopped applying;
 *   - sense messages are keyed by position, because position is the rank, so
 *     adding or removing a row throws them away.
 */
import type { EntryWithSenses } from "#/db/schema";
import {
	formatCases,
	hasGoverns,
	hasPrincipalParts,
	hasTerminations,
	INFLECTS,
	isDeclensionFor,
	isPartOfSpeech,
	offeredCases,
	readCases,
	senseGoverns,
} from "#/utils/entries/rules";

/** The id is the React key and the ref key; it is never rendered. Position is the rank. */
export type SenseRow = {
	id: number;
	meaningEn: string;
	usage: string;
	/** The case this sense takes, canonical — "dative", "accusative,ablative". */
	governs: string;
	exampleLa: string;
	exampleEn: string;
	/**
	 * Whether this row's two example inputs are on screen.
	 *
	 * The fields are off by default and revealed per sense
	 */
	showExamples: boolean;
	/**
	 * Whether this row's case chips are on screen, where the case is optional
	 * (a verb's, an adjective's). The same bargain as the examples: off unless
	 * there is one. A preposition that asks every sense ignores it and always
	 * shows them.
	 */
	showCase: boolean;
};

/**
 * A sense as a lookup hands it over. Deliberately not `Omit<SenseRow, "id">`:
 * Wiktionary fills meanings, never examples, and this is where that is said
 * once rather than remembered at each call site. It does fill the case, which is
 * grammar Wiktionary states rather than a sentence someone has to write.
 */
export type SuggestedSense = {
	meaningEn: string;
	usage: string;
	governs: string;
};

/** Every answer the form collects, as typed — strings until parseEntryDraft has had it. */
export type DraftFields = {
	lemma: string;
	partOfSpeech: string;
	principalParts: string;
	gender: string;
	declension: string;
	/** 3rd-declension adjectives only: '1' | '2' | '3'. See hasTerminations. */
	terminations: string;
	conjugation: string;
	/** Prepositions only: the cases it takes, canonical. See hasGoverns. */
	governs: string;
	notes: string;
};

export type SubmitStatus =
	| { kind: "idle" }
	| { kind: "pending" }
	/** `created` is the difference between “Additum” and “Ēmendātum”. Both empty the desk. */
	| { kind: "saved"; lemma: string; created: boolean }
	| { kind: "failed"; message: string };

/**
 * Which word this desk is filing, and whether it is already on file.
 *
 * The whole difference between the two flows, held in one place: it picks the
 * server function the submit calls and the button it is pressed from. It is not
 * fixed for the life of the form — a saved edit hands the desk back as a new
 * word's, and a different entry arriving from the route replaces it.
 */
export type FormMode =
	| { kind: "create" }
	/** The row id, because the lemma is editable and cannot identify what is being edited. */
	| { kind: "edit"; id: number };

/**
 * A draft someone else wrote: what suggestFromWiktionary makes of a lemma, in
 * the shape this form holds a half-filled entry in. It is a suggestion and
 * nothing more — it fills the fields and stops, because the reason to look a
 * word up is to read what came back, not to trust it.
 */
export type EntrySuggestion = {
	draft: DraftFields;
	senses: Array<SuggestedSense>;
	/** What a person has to know about the fill: choices made, values dropped. */
	warnings: Array<string>;
};

/** Where the last lookup got to. Separate from the submit: they can overlap. */
export type LookupStatus =
	| { kind: "idle" }
	/**
	 * `request` says which press this is waiting on. A lookup is a network round
	 * trip, and the desk can move on underneath it — a save empties it, an edit
	 * link loads another word into it — so an answer is only let in if the desk
	 * is still waiting for that very request.
	 */
	| { kind: "pending"; request: number }
	| { kind: "filled"; warnings: Array<string> }
	| { kind: "failed"; message: string };

export type FormState = {
	mode: FormMode;
	draft: DraftFields;
	senses: Array<SenseRow>;
	/** Ids are handed out, never reused: a removed row must not be confused with its replacement. */
	nextSenseId: number;
	/** The row whose meaning should take focus once it has rendered. */
	focusSense: number | null;
	/** The row whose Latin example should take focus once it has rendered. */
	focusExample: number | null;
	/** The row whose first case chip should take focus once it has rendered. */
	focusCase: number | null;
	/** Keyed the way parseEntryDraft keys them: by field, and by position within senses. */
	errors: Record<string, string>;
	status: SubmitStatus;
	lookup: LookupStatus;
};

export type FormAction =
	| { type: "field"; name: keyof DraftFields; value: string }
	| { type: "sense-changed"; id: number; patch: Partial<Omit<SenseRow, "id">> }
	| { type: "sense-added" }
	| { type: "sense-removed"; id: number }
	| { type: "sense-examples-shown"; id: number }
	| { type: "sense-examples-hidden"; id: number }
	| { type: "sense-case-shown"; id: number }
	| { type: "sense-case-hidden"; id: number }
	| { type: "focus-handled" }
	| { type: "example-focus-handled" }
	| { type: "case-focus-handled" }
	/** The route loaded a different word to work on, or none. */
	| { type: "entry-loaded"; entry: EntryWithSenses | null }
	| { type: "submit-started" }
	| { type: "submit-invalid"; fields: Record<string, string> }
	| { type: "submit-succeeded"; lemma: string }
	| { type: "submit-failed"; message: string }
	| { type: "lookup-started"; request: number }
	| { type: "lookup-filled"; request: number; suggestion: EntrySuggestion }
	| { type: "lookup-failed"; request: number; message: string };

const EMPTY_SENSE = {
	meaningEn: "",
	usage: "",
	governs: "",
	exampleLa: "",
	exampleEn: "",
	showExamples: false,
	showCase: false,
};

const EMPTY_DRAFT: DraftFields = {
	lemma: "",
	partOfSpeech: "",
	principalParts: "",
	gender: "",
	declension: "",
	terminations: "",
	conjugation: "",
	governs: "",
	notes: "",
};

export const initialFormState: FormState = {
	mode: { kind: "create" },
	draft: EMPTY_DRAFT,
	senses: [{ id: 0, ...EMPTY_SENSE }],
	nextSenseId: 1,
	focusSense: null,
	focusExample: null,
	focusCase: null,
	errors: {},
	status: { kind: "idle" },
	lookup: { kind: "idle" },
};

/**
 * A row read back into the desk it was filed from.
 *
 * The columns are nullable and the fields are strings, so NULL becomes "" —
 * the same absence the form starts every create in, which is what lets one set
 * of inputs serve both flows. Senses arrive in rank order, and this drops the
 * rank: position is the rank on the way back in, exactly as it was on the way
 * out.
 */
export function entryFormState(entry: EntryWithSenses): FormState {
	return {
		...initialFormState,
		mode: { kind: "edit", id: entry.id },
		draft: {
			lemma: entry.lemma,
			partOfSpeech: entry.partOfSpeech,
			principalParts: entry.principalParts ?? "",
			gender: entry.gender ?? "",
			declension: entry.declension ?? "",
			terminations: entry.terminations ?? "",
			conjugation: entry.conjugation ?? "",
			governs: entry.governs ?? "",
			notes: entry.notes ?? "",
		},
		// A filed entry always has one, but the form has to have a row to type in
		// even if check-senses.ts was somehow not looking.
		senses:
			entry.senses.length > 0
				? entry.senses.map((sense, i) => ({
						id: i,
						meaningEn: sense.meaningEn,
						usage: sense.usage ?? "",
						governs: sense.governs ?? "",
						exampleLa: sense.exampleLa ?? "",
						exampleEn: sense.exampleEn ?? "",
						// Shown exactly where there is something to show. An editor
						// opening a filed word sees the examples it has and no empty
						// pair on the senses that never had one.
						showExamples: Boolean(sense.exampleLa || sense.exampleEn),
						// The same rule for the case: open on the senses that take one.
						showCase: Boolean(sense.governs),
					}))
				: [{ id: 0, ...EMPTY_SENSE }],
		nextSenseId: Math.max(entry.senses.length, 1),
	};
}

/**
 * The question that does not apply has to stay NULL, so this empties the
 * answers the current part of speech does not ask for. A gender typed while
 * "noun" was selected would otherwise ride along into an adverb and be rejected
 * by a rule the editor can no longer see on screen.
 *
 * Two of the fields hang off the declension rather than the part of speech, so
 * the cleared declension is what they are asked about — not the one still in the
 * draft. Picking `indeclinable` for an adjective has to strand its terminations
 * and its filing in the same pass that strands them when the word stops being an
 * adjective at all; doing it in two passes would leave a value on screen for one
 * render and in the submit for good.
 */
function clearInapplicable(draft: DraftFields): DraftFields {
	const { partOfSpeech } = draft;
	const asks = isPartOfSpeech(partOfSpeech)
		? INFLECTS[partOfSpeech]
		: undefined;

	// Kept only if the new part of speech files under it too: a noun's `2`
	// carried onto an adjective would be an answer no adjective can give.
	const declension =
		asks === "declension" && isDeclensionFor(partOfSpeech, draft.declension)
			? draft.declension
			: "";

	return {
		...draft,
		declension,
		conjugation: asks === "conjugation" ? draft.conjugation : "",
		gender: partOfSpeech === "noun" ? draft.gender : "",
		terminations: hasTerminations(partOfSpeech, declension)
			? draft.terminations
			: "",
		principalParts: hasPrincipalParts(partOfSpeech, declension)
			? draft.principalParts
			: "",
		governs: hasGoverns(partOfSpeech) ? draft.governs : "",
	};
}

/**
 * The same rule one level down: a sense's case has to stay empty where its
 * question does not apply, and can only name a case its chips still offer.
 *
 * Run against the draft *after* clearInapplicable, because the entry's cases
 * are what a preposition's senses are asked about. Unticking the accusative on
 * in has to take it off every sense in the same pass — those chips stop
 * rendering, and a value nobody can see would still be submitted. Hidden always
 * means empty, here exactly as for the examples.
 */
function clearInapplicableSenses(
	senses: Array<SenseRow>,
	draft: DraftFields,
): Array<SenseRow> {
	const asked = senseGoverns(draft.partOfSpeech, draft.governs);
	const offered = offeredCases(draft.partOfSpeech, draft.governs);

	return senses.map((row) => {
		if (asked === "inapplicable") {
			return { ...row, governs: "", showCase: false };
		}

		const governs = formatCases(
			readCases(row.governs).cases.filter((c) => offered.includes(c)),
		);

		// A value that survives is shown: a verb's dative carried over from a
		// fill, or a case left from when this was a preposition.
		return { ...row, governs, showCase: row.showCase || governs !== "" };
	});
}

/** The messages from the last submit stop describing the rows they sit next to. */
function withoutSenseErrors(errors: Record<string, string>) {
	return Object.fromEntries(
		Object.entries(errors).filter(([key]) => !key.startsWith("senses")),
	);
}

/**
 * An entry emptied of its answers, keeping the id counter running.
 *
 * The mode goes back to `create` with it, and that is not tidiness: an emptied
 * form still pointed at a row would file the *next* word typed into it over the
 * one just saved. Clearing the desk and leaving it addressed to a word are not
 * two independent facts.
 */
function cleared(state: FormState): FormState {
	return {
		...initialFormState,
		senses: [{ id: state.nextSenseId, ...EMPTY_SENSE }],
		nextSenseId: state.nextSenseId + 1,
	};
}

/**
 * Whether an answer is for the lookup this desk is still waiting on. Anything
 * else is late: filling the form with it would put one word's Wiktionary page
 * over another word's filing — and in an edit, save it over that word's row.
 */
function isAwaited(state: FormState, request: number) {
	return state.lookup.kind === "pending" && state.lookup.request === request;
}

/** The fields whose value decides which other fields still have a question. */
const STRANDS_ANSWERS = new Set<keyof DraftFields>([
	"partOfSpeech",
	"declension",
	"governs",
]);

export function formReducer(state: FormState, action: FormAction): FormState {
	switch (action.type) {
		case "field": {
			const typed = { ...state.draft, [action.name]: action.value };

			// Three fields can strand an answer, and a lemma cannot. The part of
			// speech is the obvious one. The declension joined it when adjectives
			// started being filed by it: moving one off `3` leaves a terminations
			// answer that no longer has a question, and moving one onto
			// `indeclinable` leaves a filing that no longer has forms. The cases a
			// preposition governs are the third, and they strand answers on the
			// senses rather than on the entry.
			if (!STRANDS_ANSWERS.has(action.name)) {
				return { ...state, draft: typed };
			}

			const draft = clearInapplicable(typed);

			return {
				...state,
				draft,
				senses: clearInapplicableSenses(state.senses, draft),
			};
		}

		case "sense-changed":
			return {
				...state,
				senses: state.senses.map((row) =>
					row.id === action.id ? { ...row, ...action.patch } : row,
				),
			};

		case "sense-added": {
			const id = state.nextSenseId;

			return {
				...state,
				senses: [...state.senses, { id, ...EMPTY_SENSE }],
				nextSenseId: id + 1,
				// A button that adds an input should leave the caret in it.
				focusSense: id,
				errors: withoutSenseErrors(state.errors),
			};
		}

		case "sense-removed":
			return {
				...state,
				senses: state.senses.filter((row) => row.id !== action.id),
				errors: withoutSenseErrors(state.errors),
			};

		case "sense-examples-shown":
			return {
				...state,
				senses: state.senses.map((row) =>
					row.id === action.id ? { ...row, showExamples: true } : row,
				),
				// A button that reveals an input should leave the caret in it.
				focusExample: action.id,
			};

		case "sense-examples-hidden":
			return {
				...state,
				// Cleared as well as closed. Hiding a value the editor cannot see but
				// the submit would still send is the one thing this must not do.
				senses: state.senses.map((row) =>
					row.id === action.id
						? { ...row, exampleLa: "", exampleEn: "", showExamples: false }
						: row,
				),
				errors: withoutSenseErrors(state.errors),
			};

		case "sense-case-shown":
			return {
				...state,
				senses: state.senses.map((row) =>
					row.id === action.id ? { ...row, showCase: true } : row,
				),
				focusCase: action.id,
			};

		case "sense-case-hidden":
			return {
				...state,
				// Cleared as it closes, for the reason the examples are.
				senses: state.senses.map((row) =>
					row.id === action.id ? { ...row, governs: "", showCase: false } : row,
				),
				errors: withoutSenseErrors(state.errors),
			};

		case "focus-handled":
			return { ...state, focusSense: null };

		case "example-focus-handled":
			return { ...state, focusExample: null };

		case "case-focus-handled":
			return { ...state, focusCase: null };

		// A wholesale replacement, the way a lookup is: what is on screen
		// afterwards is one word's filing, never two halves of different ones.
		case "entry-loaded":
			return action.entry ? entryFormState(action.entry) : initialFormState;

		case "submit-started":
			return { ...state, errors: {}, status: { kind: "pending" } };

		case "submit-invalid":
			return { ...state, errors: action.fields, status: { kind: "idle" } };

		case "submit-succeeded":
			// Either way the word is filed and the desk is free, so either way it
			// empties for the next one. The banner is the receipt, and it links to
			// the page where the result can be read back.
			return {
				...cleared(state),
				status: {
					kind: "saved",
					lemma: action.lemma,
					created: state.mode.kind === "create",
				},
			};

		case "submit-failed":
			return { ...state, status: { kind: "failed", message: action.message } };

		case "lookup-started":
			return {
				...state,
				lookup: { kind: "pending", request: action.request },
			};

		case "lookup-filled": {
			if (!isAwaited(state, action.request)) return state;

			const { senses, warnings } = action.suggestion;
			const draft = clearInapplicable(action.suggestion.draft);
			// A word Wiktionary had no definitions for is still a word to file, and
			// the form needs a row to type the meaning into either way.
			const rows: Array<SuggestedSense> =
				senses.length > 0
					? senses
					: [{ meaningEn: "", usage: "", governs: "" }];

			return {
				...state,
				draft,
				// EMPTY_SENSE first, so a fill lands on closed, empty example fields:
				// a lookup suggests meanings and never an example. The cases go
				// through the same clearing as a typed change, which also opens the
				// case chips on the senses that came back with one.
				senses: clearInapplicableSenses(
					rows.map((sense, i) => ({
						...EMPTY_SENSE,
						...sense,
						id: state.nextSenseId + i,
					})),
					draft,
				),
				nextSenseId: state.nextSenseId + rows.length,
				focusSense: null,
				// They were written about the draft that has just been replaced.
				errors: {},
				status: { kind: "idle" },
				lookup: { kind: "filled", warnings },
			};
		}

		case "lookup-failed":
			if (!isAwaited(state, action.request)) return state;

			return { ...state, lookup: { kind: "failed", message: action.message } };
	}
}
