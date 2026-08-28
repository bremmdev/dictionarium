import { Link } from "@tanstack/react-router";
import mosaic from "#/assets/mosaic-bold.svg";

export function Header() {
	return (
		<header className="bg-parchment-50 font-display">
			<nav className="border-parchment-200 border-b flex justify-between items-center uppercase max-w-page-width mx-auto w-full px-8">
				<div className="flex h-14 w-full items-center">
					<Link
						to="/"
						search={{}}
						lang="la"
						className="text-lg font-bold tracking-wide flex items-center gap-2 focus-ring"
					>
						<img src={mosaic} alt="" aria-hidden="true" className="h-8 w-8" />
						<span className="text-ink-900">Dictionarium</span>{" "}
						<span className="text-gold-600 max-sm:hidden">Latinum</span>
					</Link>
				</div>
				<div>
					<Link to="/numbers" lang="la" className="nav-link focus-ring">
						numerī{" "}
						<span className="sr-only" lang="en">
							{" (numbers)"}
						</span>
					</Link>
				</div>
			</nav>
		</header>
	);
}
