import type { Entry } from "#/db/schema";

/** The four verb parts in the order every dictionary files them. */
const VERB_PART_LABELS = ["present", "infinitive", "perfect", "supine"];

/**
 * The three genders, and the two ways an adjective files with fewer than three
 * forms. A two-termination adjective's first form is not its masculine — it is
 * masculine and feminine together, which is the whole reason there are two forms
 * and not three. A one-termination adjective's second form is not a gender at
 * all: it is the genitive, because the nominative hides the stem.
 */
const ADJECTIVE_PART_LABELS: Record<string, Array<string>> = {
	"3": ["masculine", "feminine", "neuter"],
	"2": ["masc. & fem.", "neuter"],
	"1": ["nominative", "genitive"],
};

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

	if (entry.partOfSpeech === "adjective") {
		// `1-2` never had a terminations answer because it did not need one: its
		// three forms are one per gender by construction.
		const labels =
			entry.declension === "1-2"
				? ADJECTIVE_PART_LABELS["3"]
				: entry.terminations === null
					? null
					: ADJECTIVE_PART_LABELS[entry.terminations];

		// An unlabelled count is a row that disagrees with its own terminations,
		// and a mislabelled form is worse than an unlabelled one.
		return labels?.length === count ? labels : null;
	}

	return null;
}

type PrincipalPartListProps = {
	entry: Entry;
	/** Smaller type and padding, for parts tucked inside a card. */
	compact?: boolean;
};

/**
 * An entry's principal parts, each in its own labelled box — shared by the
 * detail page and the word list's open cards. Renders nothing for an entry
 * that files none.
 */
export function PrincipalPartList({
	entry,
	compact = false,
}: PrincipalPartListProps) {
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
		<ol
			className={`grid sm:grid-cols-2 lg:grid-cols-4 ${
				compact ? "grid-cols-2 gap-2" : "gap-3"
			}`}
		>
			{parts.map((part, i) => (
				<li
					key={part}
					className={`rounded-lg border border-parchment-200 ${
						compact ? "bg-parchment-50 px-3 py-2" : "bg-parchment-100 px-4 py-3"
					}`}
				>
					<p className="font-semibold text-gold-600 text-xs uppercase tracking-[0.18em]">
						{labels?.[i] ?? "form"}
					</p>
					<p
						className={`mt-1 text-ink-900 italic ${compact ? "text-lg" : "text-xl"}`}
						lang="la"
					>
						{part}
					</p>
				</li>
			))}
		</ol>
	);
}
