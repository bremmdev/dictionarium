import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<main className="mx-auto w-full max-w-page-width px-8 py-16 font-display text-ink-700">
			<p>
				The search page lands here — edit <code>src/routes/index.tsx</code>.
			</p>
		</main>
	);
}
