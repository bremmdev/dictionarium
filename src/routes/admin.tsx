import {
	createFileRoute,
	Link,
	notFound,
	redirect,
} from "@tanstack/react-router";
import { EntryForm } from "#/components/admin/EntryForm";
import { ProverbForm } from "#/components/admin/ProverbForm";
import { Heading } from "#/components/Heading";
import { getIsAdmin } from "#/server/auth";
import { getProverbs } from "#/server/proverbs";
import { getEntryByLemma } from "#/server/search";

/**
 * The two desks the switcher at the top moves between. Words is the default
 * and so is never written into the URL: /admin opens on it, as it always has.
 */
type Desk = "words" | "proverbs";

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
	// One desk, two flows: /admin files a new word, /admin?lemma=ambulō edit it
	// ?desk=proverbs is the other desk.
	validateSearch: (
		search: Record<string, unknown>,
	): { lemma?: string; desk?: "proverbs" } => {
		const lemma = typeof search.lemma === "string" ? search.lemma.trim() : "";
		return {
			...(lemma === "" ? {} : { lemma }),
			...(search.desk === "proverbs" ? { desk: "proverbs" } : {}),
		};
	},
	// Not the desk: both desks' data is read whichever is showing, so switching
	// is a change of view and never a load.
	loaderDeps: ({ search: { lemma } }) => ({ lemma }),
	loader: async ({ deps: { lemma } }) => {
		const [entry, proverbs] = await Promise.all([
			lemma === undefined ? null : getEntryByLemma({ data: lemma }),
			getProverbs(),
		]);

		// Better than quietly opening an empty form: an edit link that points at
		// nothing is a word that has been renamed or removed, and offering to
		// create it under this spelling would be a different act than the one
		// asked for.
		if (lemma !== undefined && !entry) {
			throw notFound();
		}

		return { entry, proverbs };
	},
	component: RouteComponent,
	notFoundComponent: NotFound,
});

/**
 * Exact, so the whole search has to match: by default a link is active when its
 * search is merely contained in the URL's, and the words link — which only
 * carries the lemma — is contained in every desk's. The router sets
 * aria-current from this, which is what the pills are styled by.
 */
const ACTIVE = { exact: true };

/** The two desks as links, so the URL says which one is open. */
function DeskSwitcher() {
	const LINK =
		"focus-ring rounded-full px-4 py-1.5 font-semibold text-gold-600 text-sm uppercase tracking-[0.18em] hover:text-accent aria-[current=page]:bg-accent aria-[current=page]:text-parchment-50";

	return (
		<nav aria-label="Desk">
			<ul className="inline-flex gap-1 rounded-full border border-parchment-300 bg-parchment-50 p-1">
				<li>
					<Link
						from={Route.fullPath}
						to="."
						search={({ lemma }) => ({ lemma })}
						activeOptions={ACTIVE}
						className={LINK}
						lang="la"
					>
						Verba
						<span className="sr-only" lang="en">
							{" (words)"}
						</span>
					</Link>
				</li>
				<li>
					<Link
						from={Route.fullPath}
						to="."
						search={({ lemma }) => ({ lemma, desk: "proverbs" as const })}
						activeOptions={ACTIVE}
						className={LINK}
						lang="la"
					>
						Prōverbia
						<span className="sr-only" lang="en">
							{" (proverbs)"}
						</span>
					</Link>
				</li>
			</ul>
		</nav>
	);
}

function RouteComponent() {
	const { entry, proverbs } = Route.useLoaderData();
	const desk: Desk = Route.useSearch().desk ?? "words";

	return (
		<section className="mx-auto max-w-3xl space-y-10 px-4 sm:px-8 py-12 md:py-16">
			<DeskSwitcher />

			{/* Both desks stay mounted and only the other one is hidden, so a
			    half-filed word or proverb is still there after a look at the
			    other desk. */}
			<div hidden={desk !== "words"} className="space-y-10">
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
			</div>

			<div hidden={desk !== "proverbs"}>
				<ProverbForm proverbs={proverbs} />
			</div>
		</section>
	);
}

function NotFound() {
	const { lemma } = Route.useSearch();

	return (
		<div className="mx-auto max-w-3xl space-y-4 px-4 sm:px-8 py-16 text-center md:py-24">
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
