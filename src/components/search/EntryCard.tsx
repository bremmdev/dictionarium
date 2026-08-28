import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Heading } from "#/components/Heading";
import type { Entry } from "#/server/search";

const ORDINALS: Record<string, string> = {
	"1": "1st",
	"2": "2nd",
	"3": "3rd",
	"4": "4th",
	"5": "5th",
};

const GENDERS: Record<string, string> = {
	m: "masc.",
	f: "fem.",
	n: "neut.",
};

/** "verb · 1st conj.", "noun · 2nd decl. · masc." */
export function grammarLabel(entry: Entry) {
	const parts = [entry.partOfSpeech];

	if (entry.declension) {
		parts.push(`${ORDINALS[entry.declension] ?? entry.declension} decl.`);
	}

	if (entry.conjugation) {
		parts.push(
			entry.conjugation === "irregular"
				? "irregular"
				: `${ORDINALS[entry.conjugation] ?? entry.conjugation} conj.`,
		);
	}

	if (entry.gender) {
		parts.push(GENDERS[entry.gender] ?? entry.gender);
	}

	return parts.join(" · ");
}

type EntryCardProps = {
	entry: Entry;
	/** Carried into the detail page so its back link can restore this search. */
	query: string;
};

export function EntryCard({ entry, query }: EntryCardProps) {
	return (
		// Only the lemma is the link, so its accessible name stays "ambulō" rather
		// than the whole row run together. The after:inset-0 pseudo-element then
		// stretches its hit area over the row, keeping the big click target.
		<div className="relative py-3 pr-12 pl-4 transition-colors focus-within:bg-parchment-100 hover:bg-parchment-100">
			<div className="flex items-baseline gap-3">
				<Heading variant="h4" as="h3" lang="la">
					<Link
						to="/verbum/$lemma"
						params={{ lemma: entry.lemma }}
						search={query === "" ? {} : { q: query }}
						className="focus-ring after:absolute after:inset-0"
					>
						{entry.lemma}
					</Link>
				</Heading>
				<p className="text-gold-600 uppercase text-sm font-semibold tracking-[0.18em]">
					{grammarLabel(entry)}
				</p>
			</div>

			{/* Centred on the whole card rather than on the first line, so it stays
			    put whether or not the entry has principal parts. */}
			<ChevronRight
				className="-translate-y-1/2 absolute top-1/2 right-4 h-5 w-5 text-accent"
				aria-hidden="true"
			/>

			{entry.principalParts && (
				<p className="text-ink-700 italic" lang="la">
					{entry.principalParts}
				</p>
			)}
		</div>
	);
}
