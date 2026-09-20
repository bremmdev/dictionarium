type TableColumn = {
	/** Identifies this column in every row's cells. */
	key: string;
	label: React.ReactNode;
};

type TableRow = {
	/** Stable identity for the row — the numeral, the lemma. */
	id: string;
	/** Keyed by column, so reordering the columns cannot shuffle the data. */
	cells: Record<string, React.ReactNode>;
};

type TableProps = {
	columns: TableColumn[];
	rows: TableRow[];
	/** Names the table for screen readers, and reads as a lead-in above it. */
	caption?: React.ReactNode;
	/**
	 * Whether the first cell of each row identifies that row — a numeral, a
	 * lemma. It then becomes a <th scope="row">, which is what lets a screen
	 * reader announce "I" before "1" when moving across the row, and is set in
	 * ink rather than body colour. Turn off for a grid of plain values.
	 */
	rowHeader?: boolean;
	/** Lands on the scroll container — width and margins belong to the page. */
	className?: string;
};

const CELL = "px-4 py-3 text-left align-baseline";

export function Table({
	columns,
	rows,
	caption,
	rowHeader = true,
	className,
}: TableProps) {
	return (
		// A table is the one block that cannot reflow, so it scrolls inside its
		// own box rather than pushing the page sideways on a phone. The border
		// sits on the table rather than on that box so the caption reads as a
		// lead-in above the frame instead of being boxed in with the headers.
		<div className={`overflow-x-auto ${className ?? ""}`}>
			{/* One size for the whole table, stepped down below md: the cells
			    inherit it, so a paradigm on a phone fits its column instead of
			    scrolling inside it. The header row and the caption take the same
			    step so their relative weight does not flip on a small screen. */}
			<table className="w-full border-collapse border border-parchment-200 text-base md:text-lg">
				{caption && (
					<caption className="pb-3 text-left text-ink-500 text-xs italic md:text-sm">
						{caption}
					</caption>
				)}

				<thead>
					<tr className="border-parchment-200 border-b bg-parchment-100">
						{columns.map((column) => (
							<th
								key={column.key}
								scope="col"
								className={`${CELL} font-semibold text-gold-600 text-xs uppercase tracking-[0.18em] md:text-sm`}
							>
								{column.label}
							</th>
						))}
					</tr>
				</thead>

				<tbody>
					{rows.map((row) => (
						<tr
							key={row.id}
							className="border-parchment-200 border-b transition-colors last:border-b-0 hover:bg-parchment-100"
						>
							{columns.map((column, i) =>
								rowHeader && i === 0 ? (
									<th
										key={column.key}
										scope="row"
										className={`${CELL} font-bold text-ink-900`}
									>
										{row.cells[column.key]}
									</th>
								) : (
									<td key={column.key} className={`${CELL} text-ink-700`}>
										{row.cells[column.key]}
									</td>
								),
							)}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
