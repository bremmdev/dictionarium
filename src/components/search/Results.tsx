import { useAnnounce } from "@bremmdev/m7kit";
import { Fragment, useEffect, useId, useRef } from "react";
import { Heading } from "#/components/Heading";
import { LatinWord } from "#/components/LatinWord";
import { TextLink } from "#/components/TextLink";
import type { SearchResult } from "#/server/search";
import { MIN_QUERY_LENGTH, normalizeLemma } from "#/utils/search/rules";
import { EntryCard } from "./EntryCard";

type ResultsProps = {
	results: Array<SearchResult>;
	/** Lemmas close to the query, offered when it found nothing. */
	suggestions: Array<string>;
	/** Following a suggestion unmounts its link, so the caller gets focus back. */
	onSuggestion: () => void;
	/** Every lemma in the dictionary is one word, so this is the word count. */
	total: number;
	/** Every entry the query matches; above results.length when the list was cut short. */
	matchCount: number;
	isFetching: boolean;
	query: string;
};

const orList = new Intl.ListFormat("en", { type: "disjunction" });

export function Results({
	results,
	suggestions,
	onSuggestion,
	total,
	matchCount,
	isFetching,
	query,
}: ResultsProps) {
	const trimmed = query.trim();
	// Measured the way searchEntries measures it — on the key, not the typing —
	// so "a." or "ā!" is too short here exactly when the server skipped it,
	// rather than reading as a search that ran and found nothing.
	const isTooShort =
		trimmed.length > 0 && normalizeLemma(trimmed).length < MIN_QUERY_LENGTH;
	const isCut = matchCount > results.length;
	const formCount = results.filter((r) => r.match === "form").length;
	// Contains-matches get their own heading only when something matched the word itself.
	const direct = results.filter((r) => r.match !== "other");
	const others =
		direct.length > 0 ? results.filter((r) => r.match === "other") : [];
	const othersId = useId();

	// Announce the outcome, never the in-between. Firing on every keystroke of a
	// pending search would just talk over the user.
	let announcement = "";
	if (!isFetching && trimmed !== "") {
		if (isTooShort) {
			announcement = `Type at least ${MIN_QUERY_LENGTH} letters to search.`;
		} else {
			announcement = isCut
				? `${results.length} of ${matchCount.toLocaleString()} results for ${trimmed}. Keep typing to narrow the list.`
				: `${results.length} ${
						results.length === 1 ? "result" : "results"
					} for ${trimmed}.`;
			if (formCount > 0) {
				announcement += ` ${formCount} ${formCount === 1 ? "matches" : "match"} it as a form.`;
			}
			if (results.length === 0 && suggestions.length > 0) {
				announcement += ` Did you mean ${orList.format(suggestions)}?`;
			}
		}
	}

	// Through M7KIT's shared announcer, so it cannot talk over another message
	// on the page. Only a change is news: the outcome the page loaded with is
	// already on screen. The id drops a count still waiting when the next search
	// lands, so quick searches announce only the last.
	const announce = useAnnounce();
	const announcementId = useId();
	const announced = useRef(announcement);
	useEffect(() => {
		if (announcement === announced.current) return;
		announced.current = announcement;
		if (announcement !== "") announce(announcement, { id: announcementId });
	}, [announcement, announce, announcementId]);

	return (
		<div className={`${isFetching ? "animate-pulse" : ""}`}>
			{trimmed === "" && (
				<p className="text-center text-ink-600 text-lg">
					Search{" "}
					<span className="font-semibold text-ink-900">
						{total.toLocaleString()} {total === 1 ? "word" : "words"}
					</span>
					. Macrons are optional — <span lang="la">villa</span> finds{" "}
					<span lang="la">vīlla</span>.
				</p>
			)}

			{isTooShort && (
				<p className="text-center text-ink-600 text-lg">
					Keep going — at least {MIN_QUERY_LENGTH} letters are needed to search.
				</p>
			)}

			{!isTooShort && trimmed !== "" && results.length === 0 && !isFetching && (
				<p className="text-center text-lg">
					<span className="font-bold text-accent" lang="la">
						Nihil inventum.
					</span>{" "}
					<span className="text-ink-600">
						No entries match &ldquo;{trimmed}&rdquo;.
					</span>
				</p>
			)}

			{!isTooShort &&
				trimmed !== "" &&
				results.length === 0 &&
				suggestions.length > 0 &&
				!isFetching && (
					<p className="mt-3 text-center text-ink-600 text-lg">
						Did you mean{" "}
						{suggestions.map((lemma, i) => (
							<Fragment key={lemma}>
								{i > 0 && (i === suggestions.length - 1 ? " or " : ", ")}
								<TextLink
									to="/"
									search={{ q: lemma }}
									resetScroll={false}
									onClick={onSuggestion}
									lang="la"
								>
									{lemma}
								</TextLink>
							</Fragment>
						))}
						?
					</p>
				)}

			{isCut && (
				<p className="mb-3 text-center text-ink-600 text-lg">
					Showing{" "}
					<span className="font-semibold text-ink-900">
						{results.length} of {matchCount.toLocaleString()}
					</span>{" "}
					results. Keep typing to narrow the list.
				</p>
			)}

			{results.length > 0 && (
				<ResultList
					results={others.length > 0 ? direct : results}
					query={trimmed}
				/>
			)}

			{others.length > 0 && (
				<>
					<Heading
						variant="h4"
						as="h3"
						weight="normal"
						id={othersId}
						className="mt-6 mb-3 text-ink-700"
					>
						Other words containing <LatinWord>{trimmed}</LatinWord>
					</Heading>
					<ResultList results={others} query={trimmed} labelledBy={othersId} />
				</>
			)}
		</div>
	);
}

function ResultList({
	results,
	query,
	labelledBy,
}: {
	results: Array<SearchResult>;
	query: string;
	labelledBy?: string;
}) {
	return (
		<ul
			aria-labelledby={labelledBy}
			className="divide-y divide-parchment-200 rounded-sm border border-parchment-200 bg-surface-subtle/50"
		>
			{results.map((entry) => (
				<li key={entry.id}>
					<EntryCard entry={entry} query={query} />
				</li>
			))}
		</ul>
	);
}
