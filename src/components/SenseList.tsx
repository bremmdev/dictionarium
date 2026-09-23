import type { Sense } from "#/db/schema";

type SenseListProps = {
	senses: Array<Sense>;
	/** Smaller type and padding, for a sense list tucked inside a card. */
	compact?: boolean;
};

/**
 * Every sense a word has, in rank order — shared by the detail page and the
 * word list's open cards, so a sense reads the same wherever it is learned.
 *
 * Each row shows its own rank rather than leaning on a list marker, so the
 * numbering matches the senses table and a gap in it shows up as a gap instead
 * of being silently renumbered. That number is content, not decoration: it is
 * how a dictionary refers to a sense, so it stays readable to a screen reader.
 */
export function SenseList({ senses, compact = false }: SenseListProps) {
	return (
		<ol className={compact ? "space-y-2" : "space-y-3"}>
			{senses.map((sense) => (
				<li
					key={sense.id}
					className={`flex rounded-lg border border-parchment-200 ${
						compact ? "gap-3 bg-parchment-50 p-3" : "gap-4 bg-parchment-100 p-4"
					}`}
				>
					<span
						className={`flex shrink-0 items-center justify-center rounded-full bg-gold-300 font-bold text-ink-900 tabular-nums ${
							compact ? "h-6 w-6 text-xs" : "h-8 w-8 text-sm"
						}`}
					>
						{sense.rank}
					</span>

					<div>
						<p className={`text-ink-900 ${compact ? "text-lg" : "text-xl"}`}>
							{sense.usage && (
								<span className="mr-2 rounded-full border border-parchment-300 px-2 py-0.5 align-middle text-ink-600 text-xs uppercase tracking-[0.18em]">
									{sense.usage}
								</span>
							)}
							{sense.meaningEn}
						</p>

						{sense.exampleLa && (
							<p className="mt-2 text-ink-700 italic" lang="la">
								{sense.exampleLa}
							</p>
						)}
						{sense.exampleEn && (
							<p className="text-ink-600">&ldquo;{sense.exampleEn}&rdquo;</p>
						)}
					</div>
				</li>
			))}
		</ol>
	);
}
