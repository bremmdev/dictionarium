import { caseLabel } from "#/utils/entries/rules";

/**
 * "+ dat." in front of a meaning: the case that sense takes
 * Renders nothing for a sense with no case to mark, which is most of them.
 */
export function CaseTag({ governs }: { governs: string | null }) {
	const label = caseLabel(governs);

	if (label === null) {
		return null;
	}

	return (
		<span className="mr-2 whitespace-nowrap rounded-full border border-gold-400 px-2 py-0.5 align-middle font-semibold text-gold-600 text-xs uppercase tracking-[0.18em]">
			{label}
		</span>
	);
}
