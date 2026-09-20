/**
 * A jump list for a page that is five long sections deep.
 *
 * The English gloss on the Latin labels is appended rather than substituted,
 * the way the header's own Latin controls do it — see vault/a11y.md: the
 * accessible name has to contain the visible label, or "click Cāsūs" hits
 * nothing.
 */
const SECTIONS = [
	{ id: "cases", label: "Cāsūs", gloss: "cases" },
	{ id: "filing", label: "Filing a noun" },
	{ id: "declensions", label: "The five declensions" },
	{ id: "endings", label: "Terminātiōnēs", gloss: "endings" },
	{ id: "adjectives", label: "Adiectīva", gloss: "adjectives" },
];

export function SectionNav() {
	return (
		// Two navigation landmarks now sit on this page, so this one is named —
		// "On this page" is what it is, and it tells a screen reader user which
		// of the two they have landed in.
		<nav
			aria-label="On this page"
			className="border-parchment-200 border-b bg-parchment-50 font-display"
		>
			<ul className="mx-auto flex max-w-page-width flex-wrap items-center justify-center gap-x-8 gap-y-2 px-8 py-4 text-base uppercase">
				{SECTIONS.map(({ id, label, gloss }) => (
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
