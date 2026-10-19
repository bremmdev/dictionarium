import {
	createFileRoute,
	Link,
	notFound,
	redirect,
} from "@tanstack/react-router";
import { EntryForm } from "#/components/admin/EntryForm";
import { ProverbForm } from "#/components/admin/ProverbForm";
import { Heading } from "#/components/Heading";
import { Lemma } from "#/components/Lemma";
import { TextLink } from "#/components/TextLink";
import { getIsAdmin } from "#/server/auth";
import { getProverbs } from "#/server/proverbs";
import { getEntryById } from "#/server/search";
import { entryLink } from "#/utils/entries/links";

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
	// One desk, two flows: /admin files a new word, /admin?id=42 edits one.
	// By id, because the lemma is editable and cum¹ and cum² share it.
	// ?desk=proverbs is the other desk.
	validateSearch: (
		search: Record<string, unknown>,
	): { id?: number; desk?: "proverbs" } => {
		const id = search.id;
		return {
			...(typeof id === "number" && Number.isInteger(id) && id > 0
				? { id }
				: {}),
			...(search.desk === "proverbs" ? { desk: "proverbs" } : {}),
		};
	},
	// Not the desk: both desks' data is read whichever is showing, so switching
	// is a change of view and never a load.
	loaderDeps: ({ search: { id } }) => ({ id }),
	loader: async ({ deps: { id } }) => {
		const [entry, proverbs] = await Promise.all([
			id === undefined ? null : getEntryById({ data: id }),
			getProverbs(),
		]);

		// Better than quietly opening an empty form: an edit link that points at
		// nothing is a word that has been removed, and offering to file a new
		// one would be a different act than the one asked for.
		if (id !== undefined && !entry) {
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
 * carries the id — is contained in every desk's. The router sets
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
						search={({ id }) => ({ id })}
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
						search={({ id }) => ({ id, desk: "proverbs" as const })}
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
							<TextLink {...entryLink(entry)} lang="la">
								<Lemma entry={entry} />
							</TextLink>
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
				That entry is no longer in the dictionary.
			</p>
			<TextLink to="/admin" search={{}}>
				File a new word instead
			</TextLink>
		</div>
	);
}
