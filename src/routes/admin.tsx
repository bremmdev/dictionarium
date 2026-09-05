import { createFileRoute, redirect } from "@tanstack/react-router";
import { adminStats, getIsAdmin } from "#/server/auth";

export const Route = createFileRoute("/admin")({
	// UX only: it turns the loader's raw 401 into a trip to the login form. What
	// actually protects the data is authMiddleware on adminStats itself, which is
	// reachable as an RPC whatever route the caller came from. Asked here rather
	// than read from the root context, so the one page that turns on the answer
	// pays for a fresh one instead of every navigation in the app paying for it.
	beforeLoad: async () => {
		if (!(await getIsAdmin())) {
			throw redirect({ to: "/login" });
		}
	},
	loader: async () => {
		const stats = await adminStats();
		return { stats };
	},
	component: RouteComponent,
});

function RouteComponent() {
	const data = Route.useLoaderData();

	return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
