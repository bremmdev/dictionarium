import { Button } from "@bremmdev/m7kit";
import {
	getRouteApi,
	useNavigate,
	useRouterState,
} from "@tanstack/react-router";
import { Search as SearchIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Heading } from "#/components/Heading";
import { Results } from "./Results";

const route = getRouteApi("/");

export function Search() {
	const q = route.useSearch({ select: (search) => search.q ?? "" });
	const navigate = useNavigate({ from: "/" });
	const { results, suggestions, total } = route.useLoaderData();
	// Not `useMatch().isFetching`: loaderDeps puts q in the match id, so each
	// query is a *new* match rather than a refetch of the presented one, and the
	// router only ever writes isFetching onto the match already on screen.
	const isFetching = useRouterState({ select: (s) => s.isLoading });

	const inputRef = useRef<HTMLInputElement>(null);

	// `value` is the draft sitting in the box; `q` is the committed search that
	// lives in the URL and drives the loader. They are genuinely different bits of
	// state — the box has to stay responsive without a navigation per keystroke.
	const [value, setValue] = useState(q);

	// Re-sync the input when q changes from outside (back/forward, a link).
	const [syncedQ, setSyncedQ] = useState(q);
	if (q !== syncedQ) {
		setSyncedQ(q);
		setValue(q);
	}

	const runSearch = (next: string) => {
		const trimmed = next.trim();
		// Drop q entirely when it is empty, so clearing lands on a clean "/".
		navigate({
			search: trimmed === "" ? {} : { q: trimmed },
			resetScroll: false,
		});
	};

	return (
		<>
			<search>
				<form
					className="group flex items-center gap-3 rounded-lg border border-parchment-300 bg-[color-mix(in_oklab,var(--color-parchment-50),white_55%)] py-2.5 pr-2.5 pl-4 shadow-[0_14px_30px_-20px_rgb(58_52_44/0.5)] transition-colors hover:border-parchment-400 focus-within:border-accent/60 focus-within:ring-3 focus-within:ring-accent/15 sm:gap-5 sm:py-3 sm:pr-3 sm:pl-6"
					onSubmit={(e) => {
						e.preventDefault();
						runSearch(value);
					}}
				>
					<label htmlFor="search-word" className="sr-only">
						Latin word to look up
					</label>
					<SearchIcon
						className="h-5 w-5 shrink-0 text-gold-600 transition-colors group-focus-within:text-accent sm:h-6 sm:w-6"
						aria-hidden="true"
					/>
					<span className="search-line min-w-0 flex-1">
						<input
							id="search-word"
							ref={inputRef}
							type="text"
							lang="la"
							autoComplete="off"
							autoCapitalize="none"
							autoCorrect="off"
							enterKeyHint="search"
							spellCheck={false}
							className="h-12 w-full bg-transparent font-medium text-ink-900 text-xl tracking-wide caret-accent outline-hidden sm:text-2xl"
							value={value}
							onChange={(e) => setValue(e.target.value)}
						/>
					</span>
					{value !== "" && (
						<button
							type="button"
							lang="la"
							onClick={() => {
								setValue("");
								runSearch("");
								// This button unmounts on clear, so hand focus back to
								// the input rather than letting it fall to <body>.
								inputRef.current?.focus();
							}}
							className="focus-ring shrink-0 rounded-sm px-2 py-2 font-semibold text-ink-600 text-sm uppercase tracking-[0.12em] hover:text-accent sm:text-base"
						>
							dēlē
							<span className="sr-only" lang="en">
								{" (clear)"}
							</span>
						</button>
					)}
					<Button
						type="submit"
						variant="primary"
						className="shrink-0 uppercase max-sm:px-3 max-sm:text-base"
						lang="la"
					>
						Quaere
						<span className="sr-only" lang="en">
							{" (search)"}
						</span>
					</Button>
				</form>
			</search>

			<section aria-labelledby="results-heading" aria-busy={isFetching}>
				<Heading variant="h2" id="results-heading" className="sr-only">
					Search results
				</Heading>
				<Results
					results={results}
					suggestions={suggestions}
					onSuggestion={() => inputRef.current?.focus()}
					total={total}
					isFetching={isFetching}
					query={q}
				/>
			</section>
		</>
	);
}
