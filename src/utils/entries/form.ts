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
import {
	hasPrincipalParts,
	INFLECTS,
	isPartOfSpeech,
} from "#/utils/entries/rules";

/** The id is the React key and the ref key; it is never rendered. Position is the rank. */
export type SenseRow = { id: number; meaningEn: string; usage: string };

/** Every answer the form collects, as typed — strings until parseEntryDraft has had it. */
export type DraftFields = {
	lemma: string;
	partOfSpeech: string;
	principalParts: string;
	gender: string;
	declension: string;
	conjugation: string;
	notes: string;
};

export type SubmitStatus =
	| { kind: "idle" }
	| { kind: "pending" }
	| { kind: "created"; lemma: string }
	| { kind: "failed"; message: string };

export type FormState = {
	draft: DraftFields;
	senses: Array<SenseRow>;
	/** Ids are handed out, never reused: a removed row must not be confused with its replacement. */
	nextSenseId: number;
	/** The row whose meaning should take focus once it has rendered. */
	focusSense: number | null;
	/** Keyed the way parseEntryDraft keys them: by field, and by position within senses. */
	errors: Record<string, string>;
	status: SubmitStatus;
};

export type FormAction =
	| { type: "field"; name: keyof DraftFields; value: string }
	| { type: "sense-changed"; id: number; patch: Partial<Omit<SenseRow, "id">> }
	| { type: "sense-added" }
	| { type: "sense-removed"; id: number }
	| { type: "focus-handled" }
	| { type: "submit-started" }
	| { type: "submit-invalid"; fields: Record<string, string> }
	| { type: "submit-succeeded"; lemma: string }
	| { type: "submit-failed"; message: string };

const EMPTY_SENSE = { meaningEn: "", usage: "" };

const EMPTY_DRAFT: DraftFields = {
	lemma: "",
	partOfSpeech: "",
	principalParts: "",
	gender: "",
	declension: "",
	conjugation: "",
	notes: "",
};

export const initialFormState: FormState = {
	draft: EMPTY_DRAFT,
	senses: [{ id: 0, ...EMPTY_SENSE }],
	nextSenseId: 1,
	focusSense: null,
	errors: {},
	status: { kind: "idle" },
};

/**
 * A gender typed while "noun" was selected would otherwise ride along into an
 * adverb and be rejected by a rule the editor can no longer see on screen.
 */
function changeField(
	draft: DraftFields,
	name: keyof DraftFields,
	value: string,
): DraftFields {
	const next = { ...draft, [name]: value };

	if (name !== "partOfSpeech") return next;

	const asks = isPartOfSpeech(value) ? INFLECTS[value] : undefined;

	return {
		...next,
		declension: asks === "declension" ? next.declension : "",
		conjugation: asks === "conjugation" ? next.conjugation : "",
		gender: value === "noun" ? next.gender : "",
		principalParts: hasPrincipalParts(value) ? next.principalParts : "",
	};
}

/** The messages from the last submit stop describing the rows they sit next to. */
function withoutSenseErrors(errors: Record<string, string>) {
	return Object.fromEntries(
		Object.entries(errors).filter(([key]) => !key.startsWith("senses")),
	);
}

/** An entry emptied of its answers, keeping the id counter running. */
function cleared(state: FormState): FormState {
	return {
		...initialFormState,
		senses: [{ id: state.nextSenseId, ...EMPTY_SENSE }],
		nextSenseId: state.nextSenseId + 1,
	};
}

export function formReducer(state: FormState, action: FormAction): FormState {
	switch (action.type) {
		case "field":
			return {
				...state,
				draft: changeField(state.draft, action.name, action.value),
			};

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

		case "focus-handled":
			return { ...state, focusSense: null };

		case "submit-started":
			return { ...state, errors: {}, status: { kind: "pending" } };

		case "submit-invalid":
			return { ...state, errors: action.fields, status: { kind: "idle" } };

		case "submit-succeeded":
			return {
				...cleared(state),
				status: { kind: "created", lemma: action.lemma },
			};

		case "submit-failed":
			return { ...state, status: { kind: "failed", message: action.message } };
	}
}
