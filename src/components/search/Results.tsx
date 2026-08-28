import { type Entry, MIN_QUERY_LENGTH } from "#/server/search";
import { EntryCard } from "./EntryCard";

type ResultsProps = {
	results: Array<Entry>;
	isFetching: boolean;
	query: string;
};

export function Results({ results, isFetching, query }: ResultsProps) {
	const trimmed = query.trim();
	const isTooShort = trimmed.length > 0 && trimmed.length < MIN_QUERY_LENGTH;

	// Announce the outcome, never the in-between. Firing on every keystroke of a
	// pending search would just talk over the user.
	let announcement = "";
	if (!isFetching && trimmed !== "") {
		if (isTooShort) {
			announcement = `Type at least ${MIN_QUERY_LENGTH} letters to search.`;
		} else {
			announcement = `${results.length} ${
				results.length === 1 ? "result" : "results"
			} for ${trimmed}.`;
		}
	}

	return (
		<div
			className={`transition-opacity ${isFetching ? "opacity-60" : "opacity-100"}`}
		>
			<p aria-live="polite" className="sr-only">
				{announcement}
			</p>

			{trimmed === "" && (
				<p className="text-center text-ink-500 text-lg">
					Type a Latin word above to look it up. Macrons are optional —{" "}
					<span lang="la">villa</span> finds <span lang="la">vīlla</span>.
				</p>
			)}

			{isTooShort && (
				<p className="text-center text-ink-500 text-lg">
					Keep going — at least {MIN_QUERY_LENGTH} letters are needed to search.
				</p>
			)}

			{!isTooShort && trimmed !== "" && results.length === 0 && !isFetching && (
				<p className="text-center text-lg">
					<span className="font-bold text-accent" lang="la">
						Nihil inventum.
					</span>{" "}
					<span className="text-ink-500">
						No entries match &ldquo;{trimmed}&rdquo;.
					</span>
				</p>
			)}

			{results.length > 0 && (
				<ul className="divide-y divide-parchment-200 rounded-sm border border-parchment-200 bg-surface-subtle/50">
					{results.map((entry) => (
						<li key={entry.id}>
							<EntryCard entry={entry} query={trimmed} />
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
