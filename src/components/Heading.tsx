type HeadingLevel = "h1" | "h2" | "h3" | "h4";

type HeadingProps = React.ComponentPropsWithoutRef<"h2"> & {
	/** Picks the step on the type scale. */
	variant: HeadingLevel;
	/**
	 * The element to render. Defaults to the variant */
	as?: HeadingLevel;
	/** Overrides the step's own weight. Use this, not a font-* class. */
	weight?: "normal" | "bold";
};

// One scale for the whole app, 40/26/22/20 on phones up to 72/36/24/20.
// Case, tracking and alignment stay at the caller.
const VARIANTS: Record<HeadingLevel, string> = {
	h1: "text-balance text-ink-900 text-[2.5rem] leading-tight sm:text-6xl lg:text-7xl",
	h2: "text-balance text-ink-900 text-[1.625rem] leading-[1.2] md:text-4xl",
	h3: "text-balance text-ink-900 text-[1.375rem] leading-snug md:text-2xl",
	h4: "text-balance text-ink-900 text-xl",
};

const WEIGHTS: Record<HeadingLevel, "normal" | "bold"> = {
	h1: "normal",
	h2: "normal",
	h3: "bold",
	h4: "bold",
};

export function Heading({
	variant,
	as,
	weight = WEIGHTS[variant],
	className,
	...props
}: HeadingProps) {
	const Tag = as ?? variant;
	const classes = `${VARIANTS[variant]} ${weight === "bold" ? "font-bold" : "font-normal"}`;

	return (
		<Tag
			className={className ? `${classes} ${className}` : classes}
			{...props}
		/>
	);
}
