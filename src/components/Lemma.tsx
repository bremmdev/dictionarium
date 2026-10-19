import { type Numbered, showsHomonym } from "#/utils/entries/links";

/** The headword as a dictionary sets it: cum¹, cum² — or plain cum when it is the only one. */
export function Lemma({ entry }: { entry: Numbered }) {
	return (
		<>
			{entry.lemma}
			{showsHomonym(entry) && <sup>{entry.homonym}</sup>}
		</>
	);
}
