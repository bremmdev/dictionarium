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

/** The page's search heading, lifted into view with the box. */
export const SEARCH_TITLE_ID = "search-title";

export function Search() {
	const q = route.useSearch({ select: (search) => search.q ?? "" });
	const navigate = useNavigate({ from: "/" });
	const { results, suggestions, total, matchCount } = route.useLoaderData();
	// Not `useMatch().isFetching`: loaderDeps puts q in the match id, so each
	// query is a *new* match rather than a refetch of the presented one, and the
	// router only ever writes isFetching onto the match already on screen.
	const isFetching = useRouterState({ select: (s) => s.isLoading });

	const inputRef = useRef<HTMLInputElement>(null);
	const formRef = useRef<HTMLFormElement>(null);

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
			// A view transition freezes the page mid-swap and cancels the lift's smooth scroll.
			viewTransition: false,
		});
	};

	return (
		<>
			<search>
				<form
					ref={formRef}
					className="group scroll-mt-3 flex items-center gap-3 rounded-lg border border-accent bg-[color-mix(in_oklab,var(--color-parchment-50),white_55%)] py-2.5 pr-2.5 pl-4 focus-within:ring-1 focus-within:ring-accent sm:gap-5 sm:py-3 sm:pr-3 sm:pl-6"
					onSubmit={(e) => {
						e.preventDefault();
						runSearch(value);
						if (value.trim() !== "") showResults(formRef.current);
					}}
				>
					<label htmlFor="search-word" className="sr-only">
						Latin word to look up
					</label>
					<SearchIcon
						className="h-5 w-5 shrink-0 text-gold-600 max-sm:hidden transition-colors group-focus-within:text-accent sm:h-6 sm:w-6"
						aria-hidden="true"
					/>
					<span className="search-line min-w-0 flex-1 text-xl sm:text-2xl">
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

			<section
				aria-labelledby="results-heading"
				aria-busy={isFetching}
				// A screen of room so the box can reach the top; keyed on the draft so it is there before the search is sent.
				className={
					q === "" && value.trim() === ""
						? undefined
						: "pointer-coarse:min-h-svh"
				}
			>
				<Heading
					variant="h2"
					id="results-heading"
					tabIndex={-1}
					className="sr-only"
				>
					Search results
				</Heading>
				<Results
					results={results}
					suggestions={suggestions}
					onSuggestion={() => inputRef.current?.focus()}
					total={total}
					matchCount={matchCount}
					isFetching={isFetching}
					query={q}
				/>
			</section>
		</>
	);
}

/** On touch screens: close the keyboard, then bring the title and box to the top with the results below. */
function showResults(form: HTMLFormElement | null) {
	const target = document.getElementById(SEARCH_TITLE_ID) ?? form;
	if (!target || !window.matchMedia("(pointer: coarse)").matches) return;

	// Focus somewhere real rather than dropping it on <body>; leaving the box closes the keyboard.
	document.getElementById("results-heading")?.focus({ preventScroll: true });
	whenKeyboardClosed(() => lift(target));
}

/** A closing keyboard resizes the viewport, which would cut a smooth scroll short. */
function whenKeyboardClosed(then: () => void) {
	const viewport = window.visualViewport;
	const isUp = () =>
		viewport !== null && viewport.height < window.innerHeight * 0.85;
	if (!isUp()) {
		then();
		return;
	}

	let quiet: ReturnType<typeof setTimeout> | undefined;
	const finish = () => {
		viewport?.removeEventListener("resize", onResize);
		clearTimeout(quiet);
		clearTimeout(cap);
		then();
	};
	const onResize = () => {
		clearTimeout(quiet);
		if (!isUp()) quiet = setTimeout(finish, 100);
	};
	viewport?.addEventListener("resize", onResize);
	const cap = setTimeout(finish, 1000);
}

function lift(target: HTMLElement) {
	if (isAtTop(target)) return;
	const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
		? "auto"
		: "smooth";
	target.scrollIntoView({ behavior, block: "start" });

	// If something still cuts the scroll short, jump the rest once things go quiet.
	let settle: ReturnType<typeof setTimeout> | undefined;
	const check = (wait = 150) => {
		clearTimeout(settle);
		settle = setTimeout(() => {
			if (!isAtTop(target)) target.scrollIntoView({ block: "start" });
		}, wait);
	};
	const onChange = () => check();
	const stop = () => {
		clearTimeout(settle);
		window.removeEventListener("scroll", onChange);
		window.removeEventListener("resize", onChange);
		window.removeEventListener("touchstart", stop);
	};
	window.addEventListener("scroll", onChange, { passive: true });
	window.addEventListener("resize", onChange);
	// Touching the page hands scrolling back to the reader.
	window.addEventListener("touchstart", stop, { passive: true });
	check(600);
	setTimeout(stop, 2000);
}

function isAtTop(element: HTMLElement) {
	const margin = Number.parseFloat(getComputedStyle(element).scrollMarginTop);
	return Math.abs(element.getBoundingClientRect().top - margin) < 2;
}
