/**
 * A jump list for a page that is several long sections deep.
 *
 * The English gloss on the Latin labels is appended rather than substituted,
 * the way the header's own Latin controls do it — see vault/a11y.md: the
 * accessible name has to contain the visible label, or "click Cāsūs" hits
 * nothing.
 */
export type Section = {
	id: string;
	label: string;
	/** English for a Latin label. Its presence is what marks the label as Latin. */
	gloss?: string;
};

export function SectionNav({ sections }: { sections: Section[] }) {
	return (
		// Two navigation landmarks now sit on this page, so this one is named —
		// "On this page" is what it is, and it tells a screen reader user which
		// of the two they have landed in.
		<nav
			aria-label="On this page"
			className="border-parchment-200 border-b bg-parchment-50 font-display"
		>
			<ul className="mx-auto flex max-w-page-width flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 sm:px-8 py-4 text-base uppercase">
				{sections.map(({ id, label, gloss }) => (
					<li key={id}>
						<a
							href={`#${id}`}
							className="nav-link focus-ring"
							lang={gloss ? "la" : undefined}
						>
							{label}
							{gloss && (
								<span className="sr-only" lang="en">
									{` (${gloss})`}
								</span>
							)}
						</a>
					</li>
				))}
			</ul>
		</nav>
	);
}
