import { Button } from "@bremmdev/m7kit";
import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import mosaic from "#/assets/mosaic-bold.svg";
import { logout } from "#/server/auth";

export function Header({ isAdmin }: { isAdmin: boolean }) {
	const router = useRouter();
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	const handleLogout = async () => {
		if (isLoggingOut) return;
		setIsLoggingOut(true);

		await logout();
		// Leave any admin page before the guard notices the session is gone, then
		// invalidate: the root loader is what this button reads, and it is cached
		// until something tells the router the session changed.
		await router.navigate({ to: "/", search: {} });
		await router.invalidate();

		setIsLoggingOut(false);
	};

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
				<div className="flex items-center gap-6">
					<Link to="/numbers" lang="la" className="nav-link focus-ring">
						numerī{" "}
						<span className="sr-only" lang="en">
							{" (numbers)"}
						</span>
					</Link>
					{isAdmin && (
						<Button
							variant="secondary"
							lang="la"
							onClick={handleLogout}
							isLoading={isLoggingOut}
						>
							exī
							<span className="sr-only" lang="en">
								{" (log out)"}
							</span>
						</Button>
					)}
				</div>
			</nav>
		</header>
	);
}
