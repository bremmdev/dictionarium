import { createFileRoute, redirect } from "@tanstack/react-router";
import { EntryForm } from "#/components/admin/EntryForm";
import { Heading } from "#/components/Heading";
import { getIsAdmin } from "#/server/auth";

export const Route = createFileRoute("/admin")({
	// UX only: it turns a raw 401 into a trip to the login form. What actually
	// protects the data is authMiddleware on createEntry itself, which is
	// reachable as an RPC whatever route the caller came from. Asked here rather
	// than read from the root context, so the one page that turns on the answer
	// pays for a fresh one instead of every navigation in the app paying for it.
	beforeLoad: async () => {
		if (!(await getIsAdmin())) {
			throw redirect({ to: "/login" });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<section className="mx-auto max-w-3xl space-y-10 px-8 py-12 md:py-16">
			<div className="space-y-3">
				<Heading variant="h2" as="h1" lang="la">
					Verbum novum
					<span className="sr-only" lang="en">
						{" (a new word)"}
					</span>
				</Heading>
			</div>

			<EntryForm />
		</section>
	);
}
