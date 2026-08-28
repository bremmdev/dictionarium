type BannerIllustration = {
	src: string;
	/** Replaces the sizing and tilt the banner applies by default. */
	className?: string;
};

type BannerProps = {
	/** Fills the left column: eyebrow, heading, lede — whatever the page needs. */
	content: React.ReactNode;
	illustrations: BannerIllustration[];
};

// A pair of illustrations splits the column and leans away from itself, so it
// reads as a spread rather than a row. Pages that hand over more than a couple
// of images size them themselves — see the numerals on /numbers.
const DEFAULT_ILLUSTRATION = [
	"flex-1 -translate-y-4 -rotate-8",
	"flex-1 translate-y-4 rotate-7",
];

export function Banner({ content, illustrations }: BannerProps) {
	return (
		<div className="overflow-hidden border-parchment-200 border-b bg-linear-to-b from-parchment-50 to-parchment-100">
			<div className="mx-auto grid max-w-page-width grid-cols-1 items-center gap-12 px-8 py-12 md:grid-cols-3 md:gap-10 md:py-16">
				<div className="text-center md:col-span-2 md:text-left *:first-child:mt-0 *:last-child:mb-0">
					{content}
				</div>

				<div className="mx-auto flex w-full max-w-xs flex-wrap items-center justify-center md:max-w-lg">
					{illustrations.map(({ src, className }, i) => (
						<img
							key={src}
							src={src}
							alt=""
							aria-hidden="true"
							// min-w-0 because a flex item's automatic minimum size is its
							// intrinsic width — 120px here — which the narrow column at md
							// is not wide enough to divide, so a basis-* would be ignored
							// and the row would break after every image.
							className={`min-w-0 select-none ${className ?? DEFAULT_ILLUSTRATION[i % DEFAULT_ILLUSTRATION.length]}`}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
