/**
 * The pieces both desks are built from, so a word and a proverb are filed
 * through inputs that look and behave the same.
 */

export const LABEL =
	"block font-semibold text-gold-600 text-sm uppercase tracking-[0.18em]";

export const INPUT =
	"w-full rounded-lg border border-parchment-300 bg-parchment-50 px-3 py-2 text-ink-900 outline-none focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 aria-[invalid=true]:border-accent";

/**
 * A radio wearing the same pill the detail page prints its grammar in, so the
 * thing being picked here looks like the thing that ends up on the card. The
 * input stays a real radio and is only visually hidden: arrow keys, the label
 * association and the required grouping all come free that way.
 */
export const CHIP =
	"cursor-pointer rounded-full border border-parchment-300 bg-parchment-50 px-3 py-1 font-semibold text-gold-600 text-xs uppercase tracking-[0.18em] hover:border-gold-400 has-[:checked]:border-accent has-[:checked]:bg-accent has-[:checked]:text-parchment-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent has-[:focus-visible]:outline-offset-2";

export function FieldError({ id, children }: { id: string; children: string }) {
	return (
		<p id={id} className="mt-2 text-accent text-sm">
			{children}
		</p>
	);
}

export function ChipGroup({
	legend,
	hint,
	name,
	options,
	value,
	error,
	onChange,
}: {
	legend: string;
	hint?: string;
	name: string;
	options: ReadonlyArray<string>;
	value: string;
	error?: string;
	onChange: (value: string) => void;
}) {
	const errorId = `${name}-error`;

	return (
		<fieldset aria-describedby={error ? errorId : undefined}>
			<legend className={LABEL}>{legend}</legend>
			{hint && <p className="mt-1 text-ink-600 text-sm">{hint}</p>}

			<div className="mt-2 flex flex-wrap gap-2">
				{options.map((option) => (
					<label key={option} className={CHIP}>
						<input
							type="radio"
							className="sr-only"
							name={name}
							value={option}
							checked={value === option}
							onChange={() => onChange(option)}
						/>
						{option}
					</label>
				))}
			</div>

			{error && <FieldError id={errorId}>{error}</FieldError>}
		</fieldset>
	);
}
