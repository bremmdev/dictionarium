import { ChevronDown } from "lucide-react";
import { PrincipalPartList } from "#/components/PrincipalPartList";
import { grammarLabel } from "#/components/search/EntryCard";
import { SenseList } from "#/components/SenseList";
import type { EntryWithSenses } from "#/db/schema";

/**
 * Shared by every card in the list. Details elements with the same name form
 * an exclusive group: opening one closes the others, done by the browser, so
 * there is no open-card state to keep in React. A browser that predates the
 * attribute just lets several stay open.
 */
const GROUP = "word-list";

/**
 * A word-list row that opens in place, for learning a list without leaving it.
 * Open, it holds everything the detail page teaches — labelled principal
 * parts, every sense, the notes — so it deliberately does not link there: the
 * detail page's way back is to the search, and would lose the list.
 *
 * <summary> is the whole closed card and is what the browser exposes as the
 * toggle button, with its expanded state announced for free. That is also why
 * the card is set in spans rather than a heading and paragraphs: summary only
 * takes phrasing content (or a lone heading), and a button's contents are
 * flattened to its name anyway.
 */
export function WordCard({ entry }: { entry: EntryWithSenses }) {
	const [core] = entry.senses;
	const rest = entry.senses.length - 1;

	return (
		<details name={GROUP} className="group">
			<summary className="focus-ring-inner relative block cursor-pointer list-none py-3 pr-12 pl-4 transition-colors hover:bg-parchment-100 group-open:bg-parchment-100 [&::-webkit-details-marker]:hidden">
				<span className="flex flex-wrap items-baseline gap-x-3">
					<span className="font-bold text-ink-900 text-xl" lang="la">
						{entry.lemma}
					</span>
					<span className="font-semibold text-gold-600 text-sm uppercase tracking-[0.18em]">
						{grammarLabel(entry)}
					</span>
				</span>

				{/* Closed, the card leads with the parts and the core meaning; open,
				    the labelled parts and numbered senses below repeat both, so they
				    step aside. */}
				{entry.principalParts && (
					<span
						className="block text-ink-700 italic group-open:hidden"
						lang="la"
					>
						{entry.principalParts}
					</span>
				)}

				{core && (
					<span className="block text-ink-900 group-open:hidden">
						{core.meaningEn}
						{rest > 0 && (
							<span className="ml-2 whitespace-nowrap text-ink-600 text-sm">
								+{rest} more {rest === 1 ? "meaning" : "meanings"}
							</span>
						)}
					</span>
				)}

				<ChevronDown
					className="-translate-y-1/2 absolute top-1/2 right-4 h-5 w-5 text-accent transition-transform duration-150 group-open:rotate-180"
					aria-hidden="true"
				/>
			</summary>

			<div className="space-y-4 bg-parchment-100 px-4 pt-1 pb-4">
				<PrincipalPartList entry={entry} compact />

				{entry.senses.length > 0 && <SenseList senses={entry.senses} compact />}

				{entry.notes && (
					<p className="border-accent border-l-2 bg-parchment-50 px-4 py-3 text-ink-700">
						{entry.notes}
					</p>
				)}
			</div>
		</details>
	);
}
