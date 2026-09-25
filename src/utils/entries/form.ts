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
	hasPrincipalParts,
	hasTerminations,
	INFLECTS,
	isPartOfSpeech,
} from "#/utils/entries/rules";

/** The id is the React key and the ref key; it is never rendered. Position is the rank. */
export type SenseRow = {
	id: number;
	meaningEn: string;
	usage: string;
	exampleLa: string;
	exampleEn: string;
	/**
	 * Whether this row's two example inputs are on screen.
	 *
	 * The fields are off by default and revealed per sense
	 */
	showExamples: boolean;
};

/**
 * A sense as a lookup hands it over. Deliberately not `Omit<SenseRow, "id">`:
 * Wiktionary fills meanings, never examples, and this is where that is said
 * once rather than remembered at each call site.
 */
export type SuggestedSense = { meaningEn: string; usage: string };

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
	| { type: "focus-handled" }
	| { type: "example-focus-handled" }
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
	exampleLa: "",
	exampleEn: "",
	showExamples: false,
};

const EMPTY_DRAFT: DraftFields = {
	lemma: "",
	partOfSpeech: "",
	principalParts: "",
	gender: "",
	declension: "",
	terminations: "",
	conjugation: "",
	notes: "",
};

export const initialFormState: FormState = {
	mode: { kind: "create" },
	draft: EMPTY_DRAFT,
	senses: [{ id: 0, ...EMPTY_SENSE }],
	nextSenseId: 1,
	focusSense: null,
	focusExample: null,
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
						exampleLa: sense.exampleLa ?? "",
						exampleEn: sense.exampleEn ?? "",
						// Shown exactly where there is something to show. An editor
						// opening a filed word sees the examples it has and no empty
						// pair on the senses that never had one.
						showExamples: Boolean(sense.exampleLa || sense.exampleEn),
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

	const declension = asks === "declension" ? draft.declension : "";

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
	};
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
]);

export function formReducer(state: FormState, action: FormAction): FormState {
	switch (action.type) {
		case "field": {
			const draft = { ...state.draft, [action.name]: action.value };

			return {
				...state,
				// Two fields can strand an answer, and a lemma cannot. The part of
				// speech is the obvious one. The declension joined it when adjectives
				// started being filed by it: moving one off `3` leaves a terminations
				// answer that no longer has a question, and moving one onto
				// `indeclinable` leaves a filing that no longer has forms.
				draft: STRANDS_ANSWERS.has(action.name)
					? clearInapplicable(draft)
					: draft,
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

		case "focus-handled":
			return { ...state, focusSense: null };

		case "example-focus-handled":
			return { ...state, focusExample: null };

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

			const { draft, senses, warnings } = action.suggestion;
			// A word Wiktionary had no definitions for is still a word to file, and
			// the form needs a row to type the meaning into either way.
			const rows: Array<SuggestedSense> =
				senses.length > 0 ? senses : [{ meaningEn: "", usage: "" }];

			return {
				...state,
				draft: clearInapplicable(draft),
				// EMPTY_SENSE first, so a fill lands on closed, empty example fields:
				// a lookup suggests meanings and never an example.
				senses: rows.map((sense, i) => ({
					...EMPTY_SENSE,
					...sense,
					id: state.nextSenseId + i,
				})),
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
