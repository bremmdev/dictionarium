type LatinWordProps = React.ComponentPropsWithoutRef<"span">;

const CLASSES = "font-bold text-gold-600";

/**
 * A run of Latin inside English prose. lang="la" is applied last so a caller
 * cannot spread it away — see vault/a11y.md: the attribute is what keeps
 * WCAG 3.1.2 satisfied and stops translation tools mangling the word.
 */
export function LatinWord({ className, ...props }: LatinWordProps) {
	return (
		<span
			{...props}
			lang="la"
			className={className ? `${CLASSES} ${className}` : CLASSES}
		/>
	);
}
