import { Tabs } from "@bremmdev/m7kit";
import { Heading } from "../Heading";
import { LatinWord } from "../LatinWord";
import {
	MOOD_LABELS,
	type Mood,
	SYSTEMS,
	type VerbParadigm,
} from "./Conjugations.utils";
import { SystemTable } from "./SystemTable";

type System = keyof typeof SYSTEMS;

type VerbProps = {
	verb: VerbParadigm;
	/** Sits under a system's table when the verb does something the pattern does not. */
	notes?: Partial<Record<Mood, Partial<Record<System, React.ReactNode>>>>;
	/** h3 where the verb heads its own section, as on /irregular-verbs. */
	headingAs?: "h3" | "h4";
};

const MOODS_IN_ORDER: Mood[] = ["indicative", "subjunctive"];
const SYSTEMS_IN_ORDER: System[] = ["present", "perfect"];

/** A tab per mood that has forms; a single mood gets no tabs. */
export function Verb({ verb, notes, headingAs = "h4" }: VerbProps) {
	const [lemma, ...rest] = verb.principalParts;
	const moods = MOODS_IN_ORDER.filter(
		(mood) => Object.keys(verb[mood]?.active ?? {}).length > 0,
	);

	return (
		<div className="space-y-4">
			<Heading variant="h4" as={headingAs} className="mx-auto text-center">
				<LatinWord>{lemma}</LatinWord>
				<span className="font-normal text-ink-600">
					{", "}
					<span lang="la">{rest.join(", ")}</span>
					{` — ${verb.english}`}
				</span>
			</Heading>
			{moods.length > 1 ? (
				<Tabs className="mx-auto max-w-4xl">
					<Tabs.List className="flex flex-wrap justify-center">
						{moods.map((mood) => (
							<Tabs.Tab key={mood} label={mood} lang="la">
								{MOOD_LABELS[mood].la}
								<span className="sr-only" lang="en">
									{` (${MOOD_LABELS[mood].en})`}
								</span>
							</Tabs.Tab>
						))}
					</Tabs.List>
					{moods.map((mood) => (
						<Tabs.Content key={mood} label={mood} className="px-0">
							<MoodTables verb={verb} mood={mood} notes={notes?.[mood]} />
						</Tabs.Content>
					))}
				</Tabs>
			) : (
				<MoodTables verb={verb} mood="indicative" notes={notes?.indicative} />
			)}
		</div>
	);
}

function MoodTables({
	verb,
	mood,
	notes,
}: {
	verb: VerbParadigm;
	mood: Mood;
	notes?: Partial<Record<System, React.ReactNode>>;
}) {
	const [lemma] = verb.principalParts;
	const forms = verb[mood]?.active ?? {};
	const systems = SYSTEMS_IN_ORDER.filter((system) =>
		SYSTEMS[system].some((tense) => tense in forms),
	);

	// The lemma leads each caption so a screen reader entering a table hears
	// which verb it belongs to.
	const captions: Record<System, React.ReactNode> = {
		present: (
			<>
				<span lang="la">{lemma}</span>, {MOOD_LABELS[mood].en}, present system
			</>
		),
		perfect: (
			<>
				<span lang="la">{lemma}</span>, {MOOD_LABELS[mood].en}, perfect system —
				on the stem <span lang="la">{verb.perfectStem}-</span>
			</>
		),
	};

	// Stacked at every width: with the future perfect the perfect system needs
	// ~700px, more than half the page.
	return (
		<div className="mx-auto grid max-w-4xl items-start gap-8">
			{systems.map((system) => (
				<div key={system} className="min-w-0 space-y-3">
					<SystemTable
						caption={captions[system]}
						tenses={SYSTEMS[system]}
						forms={forms}
					/>
					{notes?.[system] && (
						<p className="text-base text-ink-600 leading-relaxed">
							{notes[system]}
						</p>
					)}
				</div>
			))}
		</div>
	);
}
