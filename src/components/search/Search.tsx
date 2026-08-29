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
	const { results, total } = route.useLoaderData();
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
					className="flex gap-4 w-full"
					onSubmit={(e) => {
						e.preventDefault();
						runSearch(value);
					}}
				>
					<div className="flex items-center gap-2 border-b border-accent focus-within:border-b-2 p-2 flex-1">
						<label htmlFor="search-word" className="sr-only">
							Latin word to look up
						</label>
						<SearchIcon
							className="w-6 h-6 text-accent shrink-0"
							aria-hidden="true"
						/>
						<input
							id="search-word"
							ref={inputRef}
							type="text"
							lang="la"
							autoComplete="off"
							spellCheck={false}
							className="w-full text-xl h-12 outline-none font-bold tracking-wide"
							value={value}
							onChange={(e) => setValue(e.target.value)}
						/>
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
								className="focus-ring uppercase text-accent font-bold"
							>
								dēlē
								<span className="sr-only" lang="en">
									{" (clear)"}
								</span>
							</button>
						)}
					</div>
					<Button
						type="submit"
						variant="primary"
						className="uppercase self-center"
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
					total={total}
					isFetching={isFetching}
					query={q}
				/>
			</section>
		</>
	);
}
