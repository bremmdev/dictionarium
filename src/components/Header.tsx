import { Link } from "@tanstack/react-router";
import mosaic from "#/assets/mosaic-bold.svg";
import scroll from "#/assets/scroll-sketch.svg";
import templum from "#/assets/temple-sketch.svg";

export function Header() {
	return (
		<header className="bg-parchment-50 font-display">
			<nav className="border-parchment-200 border-b">
				<div className="mx-auto flex h-14 w-full max-w-page-width items-center px-8">
					<Link
						to="/"
						className="text-lg font-bold uppercase tracking-wide flex items-center gap-2"
					>
						<img src={mosaic} alt="" aria-hidden="true" className="h-8 w-8" />
						<span className="text-ink-900">Dictionarium</span>{" "}
						<span className="text-gold-600">Latinum</span>
					</Link>
				</div>
			</nav>

			<div className="overflow-hidden border-parchment-200 border-b bg-linear-to-b from-parchment-50 to-parchment-100">
				<div className="mx-auto grid max-w-page-width grid-cols-1 items-center gap-12 px-8 py-12 md:grid-cols-3 md:gap-10 md:py-16">
					<div className="text-center md:col-span-2 md:text-left">
						<p className="text-gold-600 text-sm uppercase tracking-[0.32em] md:text-base">
							A dictionary for the Latin student
						</p>
						<h1 className="mt-6 text-ink-900 text-5xl leading-tight sm:text-6xl lg:text-7xl">
							Verba sub manū.
						</h1>
						<p className="mx-auto mt-6 font-bold text-ink-700 text-lg leading-relaxed md:mx-0 md:text-xl max-w-[80%]">
							Look up any Latin word and read its principal parts, its part of
							speech, and its senses in order of use. Explore meaning, usage and more.
						</p>
					</div>

					<div className="mx-auto flex w-full max-w-xs md:max-w-lg items-center justify-center">
						<img
							src={scroll}
							alt=""
							aria-hidden="true"
							className="-translate-y-4 -rotate-8 flex-1 select-none"
						/>
						<img
							src={templum}
							alt=""
							aria-hidden="true"
							className="flex-1 translate-y-4 rotate-7 select-none"
						/>
					</div>
				</div>
			</div>
		</header>
	);
}
