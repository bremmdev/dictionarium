/**
 * The transitions the proverb form makes, as a pure function — the
 * proverb desk's formReducer. Much smaller than the entry's, because a proverb
 * has no question whose answer strands another.
 */
import type { Proverb } from "#/db/schema";
import { ANONYMOUS } from "#/utils/proverbs/rules";

/** Every answer the form collects, as typed. */
export type ProverbFields = {
	textLa: string;
	translationEn: string;
	meaningEn: string;
	author: string;
	source: string;
	notes: string;
};

/**
 * Which flow the desk is in, and — editing — which proverb it holds.
 *
 * Unlike the word desk, this is the editor's choice rather than the route's:
 * a proverb has no page of its own to arrive from, so editing one starts here,
 * by picking it. And a save keeps the flow it was made in. Filing a new proverb
 * leaves the desk ready for the next new one; correcting one leaves it ready to
 * pick the next to correct. `id` is null in between.
 */
export type ProverbFormMode =
	| { kind: "create" }
	| { kind: "edit"; id: number | null };

export type ProverbSubmitStatus =
	| { kind: "idle" }
	| { kind: "pending" }
	/** `created` is the difference between “Additum” and “Ēmendātum”. */
	| { kind: "saved"; textLa: string; created: boolean }
	| { kind: "failed"; message: string };

export type ProverbFormState = {
	mode: ProverbFormMode;
	draft: ProverbFields;
	/**
	 * Whether the author is ANONYMOUS. A tick rather than the word typed into
	 * the author field, so that "no author to name" is an answer given on
	 * purpose — and while it is ticked the author field is gone and empty.
	 */
	anonymous: boolean;
	/** Keyed the way parseProverbDraft keys them. */
	errors: Record<string, string>;
	status: ProverbSubmitStatus;
};

export type ProverbFormAction =
	| { type: "field"; name: keyof ProverbFields; value: string }
	| { type: "anonymous-changed"; anonymous: boolean }
	/** Add or edit, picked at the top of the desk. */
	| { type: "mode-changed"; mode: ProverbFormMode["kind"] }
	/** A proverb picked to edit, or the pick cleared. */
	| { type: "proverb-picked"; proverb: Proverb | null }
	| { type: "submit-started" }
	| { type: "submit-invalid"; fields: Record<string, string> }
	| { type: "submit-succeeded"; textLa: string }
	| { type: "submit-failed"; message: string };

const EMPTY_DRAFT: ProverbFields = {
	textLa: "",
	translationEn: "",
	meaningEn: "",
	author: "",
	source: "",
	notes: "",
};

export const initialProverbFormState: ProverbFormState = {
	mode: { kind: "create" },
	draft: EMPTY_DRAFT,
	anonymous: false,
	errors: {},
	status: { kind: "idle" },
};

/** A desk in this flow with nothing on it. */
function emptied(kind: ProverbFormMode["kind"]): ProverbFormState {
	return {
		...initialProverbFormState,
		mode: kind === "edit" ? { kind: "edit", id: null } : { kind: "create" },
	};
}

/** A row read back into the form it was filed from. NULL becomes "". */
export function proverbFormState(proverb: Proverb): ProverbFormState {
	const anonymous = proverb.author === ANONYMOUS;

	return {
		...initialProverbFormState,
		mode: { kind: "edit", id: proverb.id },
		draft: {
			textLa: proverb.textLa,
			translationEn: proverb.translationEn,
			meaningEn: proverb.meaningEn ?? "",
			author: anonymous ? "" : proverb.author,
			source: proverb.source ?? "",
			notes: proverb.notes ?? "",
		},
		anonymous,
	};
}

/** What the form sends: the draft, with the tick turned into the stored value. */
export function proverbFiling(state: ProverbFormState) {
	return {
		...state.draft,
		author: state.anonymous ? ANONYMOUS : state.draft.author,
	};
}

export function proverbFormReducer(
	state: ProverbFormState,
	action: ProverbFormAction,
): ProverbFormState {
	switch (action.type) {
		case "field":
			return {
				...state,
				draft: { ...state.draft, [action.name]: action.value },
			};

		case "anonymous-changed": {
			const { author, ...errors } = state.errors;

			return {
				...state,
				// Cleared as well as hidden: a name nobody can see on screen must
				// not be what gets filed when the tick comes off again.
				draft: { ...state.draft, author: "" },
				anonymous: action.anonymous,
				// The message was about a field that just changed shape.
				errors,
			};
		}

		case "mode-changed":
			if (action.mode === state.mode.kind) return state;

			// A draft belongs to its flow. Carried into an edit it would be
			// replaced by the first pick anyway; carried into an add, a corrected
			// proverb would be filed a second time as a new one.
			return emptied(action.mode);

		case "proverb-picked":
			// Wholesale, as for an entry loaded into the word desk: what is on
			// screen afterwards is one proverb, never halves of two.
			return action.proverb
				? proverbFormState(action.proverb)
				: emptied("edit");

		case "submit-started":
			return { ...state, errors: {}, status: { kind: "pending" } };

		case "submit-invalid":
			return { ...state, errors: action.fields, status: { kind: "idle" } };

		case "submit-succeeded":
			// Emptied, but in the same flow: the next press of Adde files another
			// new proverb, the next pick corrects another filed one.
			return {
				...emptied(state.mode.kind),
				status: {
					kind: "saved",
					textLa: action.textLa,
					created: state.mode.kind === "create",
				},
			};

		case "submit-failed":
			return { ...state, status: { kind: "failed", message: action.message } };
	}
}
