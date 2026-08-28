type HeadingLevel = "h1" | "h2" | "h3" | "h4";

type HeadingProps = React.ComponentPropsWithoutRef<"h2"> & {
	/** Picks the step on the type scale. */
	variant: HeadingLevel;
	/**
	 * The element to render. Defaults to the variant */
	as?: HeadingLevel;
};

// One scale for the whole app. Case, tracking and alignment stay at the caller
const VARIANTS: Record<HeadingLevel, string> = {
	h1: "text-ink-900 text-5xl leading-tight sm:text-6xl lg:text-7xl",
	h2: "text-ink-900 text-3xl md:text-4xl",
	h3: "text-ink-900 text-2xl md:text-3xl",
	h4: "font-bold text-ink-900 text-xl",
};

export function Heading({ variant, as, className, ...props }: HeadingProps) {
	const Tag = as ?? variant;
	const classes = VARIANTS[variant];

	return (
		<Tag
			className={className ? `${classes} ${className}` : classes}
			{...props}
		/>
	);
}
