import {
	createFileRoute,
	Link,
	notFound,
	redirect,
} from "@tanstack/react-router";
import { EntryForm } from "#/components/admin/EntryForm";
import { Heading } from "#/components/Heading";
import { getIsAdmin } from "#/server/auth";
import { getEntryByLemma } from "#/server/search";

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
	// One desk, two flows: /admin files a new word, /admin?lemma=ambulō files
	// that one again. The lemma is the same key the detail page is addressed by,
	// so the edit link is the URL the reader was already on with a different
	// route in front of it — and a bookmarked edit still opens the right word.
	validateSearch: (search: Record<string, unknown>): { lemma?: string } => {
		const lemma = typeof search.lemma === "string" ? search.lemma.trim() : "";
		return lemma === "" ? {} : { lemma };
	},
	loaderDeps: ({ search: { lemma } }) => ({ lemma }),
	loader: async ({ deps: { lemma } }) => {
		if (lemma === undefined) {
			return { entry: null };
		}

		const entry = await getEntryByLemma({ data: lemma });

		// Better than quietly opening an empty form: an edit link that points at
		// nothing is a word that has been renamed or removed, and offering to
		// create it under this spelling would be a different act than the one
		// asked for.
		if (!entry) {
			throw notFound();
		}

		return { entry };
	},
	component: RouteComponent,
	notFoundComponent: NotFound,
});

function RouteComponent() {
	const { entry } = Route.useLoaderData();

	return (
		<section className="mx-auto max-w-3xl space-y-10 px-8 py-12 md:py-16">
			<div className="space-y-3">
				<Heading variant="h2" as="h1" lang="la">
					{entry ? "Verbum ēmendandum" : "Verbum novum"}
					<span className="sr-only" lang="en">
						{entry ? " (a word to correct)" : " (a new word)"}
					</span>
				</Heading>

				{entry && (
					<p className="text-ink-600">
						Editing{" "}
						<Link
							to="/verbum/$lemma"
							params={{ lemma: entry.lemma }}
							search={{}}
							className="focus-ring text-accent underline"
							lang="la"
						>
							{entry.lemma}
						</Link>
						.
					</p>
				)}
			</div>

			{/* Deliberately not keyed by the entry. The form notices a different
			    word arriving and replaces its draft itself, which is what lets a
			    saved edit empty the desk and send this route back to /admin
			    without the confirmation banner being unmounted with it. */}
			<EntryForm entry={entry} />
		</section>
	);
}

function NotFound() {
	const { lemma } = Route.useSearch();

	return (
		<div className="mx-auto max-w-3xl space-y-4 px-8 py-16 text-center md:py-24">
			<Heading
				variant="h3"
				as="h1"
				className="font-bold text-accent!"
				lang="la"
			>
				Nihil inventum.
			</Heading>
			<p className="text-ink-600 text-lg">
				No entry for &ldquo;<span lang="la">{lemma}</span>&rdquo; to edit.
			</p>
			<Link
				to="/admin"
				search={{}}
				className="focus-ring inline-block text-accent"
			>
				File a new word instead
			</Link>
		</div>
	);
}
