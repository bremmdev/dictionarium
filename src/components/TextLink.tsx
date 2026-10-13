import { createLink } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

type TextAnchorProps = React.ComponentPropsWithRef<"a"> & {
	/** Sits before the label, outside the underline. */
	icon?: LucideIcon;
};

function TextAnchor({
	icon: Icon,
	className,
	children,
	...props
}: TextAnchorProps) {
	const classes = "text-link focus-ring";

	return (
		<a className={className ? `${classes} ${className}` : classes} {...props}>
			{Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
			<span className="text-link-label">{children}</span>
		</a>
	);
}

/** A bold accent link with a hand-drawn underline — see .text-link in styles.css. */
export const TextLink = createLink(TextAnchor);
