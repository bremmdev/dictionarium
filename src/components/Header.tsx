import { Button } from "@bremmdev/m7kit";
import { Link, useRouter } from "@tanstack/react-router";
import { ChartNoAxesColumn, Plus } from "lucide-react";
import { useState } from "react";
import mosaic from "#/assets/mosaic-bold.svg";
import { ResourcesMenu } from "#/components/ResourcesMenu";
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
			<nav
				aria-label="Main"
				className="border-parchment-200 border-b uppercase max-w-page-width mx-auto w-full px-4 sm:px-8"
			>
				<div className="flex h-14 w-full items-center logo">
					<Link
						to="/"
						search={{}}
						lang="la"
						className="text-lg max-sm:text-base font-bold tracking-wide flex items-center gap-2 focus-ring"
					>
						<img src={mosaic} alt="" aria-hidden="true" className="h-8 w-8" />
						<span className="text-ink-900">Dictionarium</span>{" "}
						<span className="text-gold-600 max-sm:hidden">Latinum</span>
					</Link>
				</div>
				{isAdmin && (
					<div className="admin-controls flex gap-2">
						<Button
							as={Link}
							to="/admin"
							variant="secondary"
							lang="la"
							className="uppercase max-sm:text-sm"
						>
							<Plus className="h-3.5 w-3.5" aria-hidden="true" />
							scrībe
							<span className="sr-only" lang="en">
								{" (add a word)"}
							</span>
						</Button>
						<Button
							as={Link}
							to="/admin/stats"
							variant="secondary"
							className="uppercase max-sm:text-sm"
						>
							<ChartNoAxesColumn className="h-3.5 w-3.5" aria-hidden="true" />
							stats
						</Button>
						<Button
							variant="secondary"
							lang="la"
							className="uppercase max-sm:text-sm"
							onClick={handleLogout}
							isLoading={isLoggingOut}
						>
							exī
							<span className="sr-only" lang="en">
								{" (log out)"}
							</span>
						</Button>
					</div>
				)}
				<ResourcesMenu />
			</nav>
		</header>
	);
}
