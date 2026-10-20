import type { Frequency } from "#/utils/entries/frequency";
import { BANDS, bandLabel } from "#/utils/entries/frequency";

const LASLA =
	"LASLA, 1.8 million words of classical Latin lemmatised by hand at the Université de Liège";

/** What a band means and where it comes from: "In the top 3,000 words of LASLA, …". */
export function frequencySource({ band }: Frequency) {
	const index = BANDS.findIndex((b) => b.band === band);
	const { upTo } = BANDS[index];
	if (Number.isFinite(upTo)) {
		return `In the top ${upTo.toLocaleString("en")} words of ${LASLA}.`;
	}
	return `Outside the top ${BANDS[index - 1].upTo.toLocaleString("en")} words of ${LASLA}.`;
}

/**
 * "Core", "Common", "Uncommon", "Rare" beside the grammar. Renders nothing for
 * a word LASLA could not place, rather than guessing.
 */
export function FrequencyTag({ frequency }: { frequency: Frequency | null }) {
	if (frequency === null) {
		return null;
	}

	return (
		<span className="whitespace-nowrap rounded-full border border-gold-400 px-2 py-0.5 align-middle font-semibold text-gold-600 text-xs uppercase tracking-[0.18em]">
			<span className="sr-only">Frequency: </span>
			{bandLabel(frequency.band)}
		</span>
	);
}
