import { Tabs } from "@bremmdev/m7kit";
import { Heading } from "../Heading";
import { LatinWord } from "../LatinWord";
import {
	MOOD_LABELS,
	type Mood,
	SYSTEMS,
	type VerbParadigm,
	type Voice,
} from "./Conjugations.utils";
import { Cetera } from "./Cetera";
import { SystemTable } from "./SystemTable";

type System = keyof typeof SYSTEMS;

type MoodNotes = Partial<
	Record<Mood, Partial<Record<System, React.ReactNode>>>
>;

type VerbProps = {
	verb: VerbParadigm;
	/** Sits under a system's table when the verb does something the pattern does not. */
	notes?: Partial<Record<Voice, MoodNotes>>;
	/** h3 where the verb heads its own section, as on /grammar/irregular-verbs. */
	headingAs?: "h3" | "h4";
};

type Panel = { mood: Mood; voice: Voice };

const PANELS: Panel[] = [
	{ mood: "indicative", voice: "active" },
	{ mood: "indicative", voice: "passive" },
	{ mood: "subjunctive", voice: "active" },
	{ mood: "subjunctive", voice: "passive" },
];

const SYSTEMS_IN_ORDER: System[] = ["present", "perfect"];

const VOICE_LABELS: Record<Voice, { la: string; en: string }> = {
	active: { la: "āctīvum", en: "active" },
	passive: { la: "passīvum", en: "passive" },
};

type Tab = { id: string; la: string; en: string; content: React.ReactNode };

/**
 * A tab per mood and voice that has forms, then Cētera where the verb has it.
 * A single table set gets no tabs.
 */
export function Verb({ verb, notes, headingAs = "h4" }: VerbProps) {
	const [lemma, ...rest] = verb.principalParts;
	const tabs: Array<Tab> = PANELS.filter(
		({ mood, voice }) => Object.keys(verb[mood]?.[voice] ?? {}).length > 0,
	).map(({ mood, voice }) => ({
		id: `${mood}-${voice}`,
		la: `${MOOD_LABELS[mood].la} ${VOICE_LABELS[voice].la}`,
		en: `${MOOD_LABELS[mood].en} ${VOICE_LABELS[voice].en}`,
		content: (
			<MoodTables
				verb={verb}
				mood={mood}
				voice={voice}
				notes={notes?.[voice]?.[mood]}
			/>
		),
	}));
	if (verb.cetera) {
		tabs.push({
			id: "cetera",
			la: "Cētera",
			en: "imperative, infinitives and participles",
			content: <Cetera lemma={lemma} cetera={verb.cetera} />,
		});
	}

	return (
		<div className="space-y-4">
			<Heading variant={headingAs} className="mx-auto text-center">
				<LatinWord>{lemma}</LatinWord>
				<span className="font-normal text-ink-600">
					{", "}
					<span lang="la">{rest.join(", ")}</span>
					{` — ${verb.english}`}
				</span>
			</Heading>
			{tabs.length > 1 ? (
				<Tabs className="mx-auto max-w-4xl">
					<Tabs.List className="flex flex-wrap justify-center">
						{tabs.map(({ id, la, en }) => (
							<Tabs.Tab
								key={id}
								label={id}
								lang="la"
								className="px-2 py-1.5 text-sm uppercase sm:px-4 sm:py-2 sm:text-base sm:tracking-wide"
							>
								{la}
								<span className="sr-only" lang="en">
									{` (${en})`}
								</span>
							</Tabs.Tab>
						))}
					</Tabs.List>
					{tabs.map(({ id, content }) => (
						<Tabs.Content key={id} label={id} className="px-0">
							{content}
						</Tabs.Content>
					))}
				</Tabs>
			) : (
				tabs[0]?.content
			)}
		</div>
	);
}

function MoodTables({
	verb,
	mood,
	voice,
	notes,
}: Panel & {
	verb: VerbParadigm;
	notes?: Partial<Record<System, React.ReactNode>>;
}) {
	const [lemma, , , supine] = verb.principalParts;
	const forms = verb[mood]?.[voice] ?? {};
	const systems = SYSTEMS_IN_ORDER.filter((system) =>
		SYSTEMS[system].some((tense) => tense in forms),
	);
	const participle = supine?.endsWith("um") ? `${supine.slice(0, -2)}us` : null;
	const passive = voice === "passive";

	// The lemma leads each caption so a screen reader entering a table hears
	// which verb it belongs to.
	const name = (
		<>
			<span lang="la">{lemma}</span>, {MOOD_LABELS[mood].en}
			{passive && " passive"}
		</>
	);
	const captions: Record<System, React.ReactNode> = {
		present: <>{name}, present system</>,
		perfect:
			passive && participle ? (
				<>
					{name}, perfect system — the participle{" "}
					<span lang="la">{participle}</span> and <span lang="la">sum</span>
				</>
			) : (
				<>
					{name}, perfect system — on the stem{" "}
					<span lang="la">{verb.perfectStem}-</span>
				</>
			),
	};
	const agreement = passive && participle && (
		<>
			The participle agrees with the subject like an adjective:{" "}
			<LatinWord>{participle}</LatinWord> for a man,{" "}
			<LatinWord>{`${participle.slice(0, -2)}a`}</LatinWord> for a woman,{" "}
			<LatinWord>{`${participle.slice(0, -2)}um`}</LatinWord> for a thing, and{" "}
			<LatinWord>{`${participle.slice(0, -2)}ī`}</LatinWord>,{" "}
			<LatinWord>{`${participle.slice(0, -2)}ae`}</LatinWord>,{" "}
			<LatinWord>{`${participle.slice(0, -2)}a`}</LatinWord> in the plural.
		</>
	);

	// Stacked at every width: with the future perfect the perfect system needs
	// ~700px, more than half the page.
	return (
		<div className="mx-auto grid max-w-4xl items-start gap-8">
			{systems.map((system) => {
				const note =
					system === "perfect" && agreement ? (
						<>
							{agreement} {notes?.[system]}
						</>
					) : (
						notes?.[system]
					);
				return (
					<div key={system} className="min-w-0 space-y-3">
						<SystemTable
							caption={captions[system]}
							tenses={SYSTEMS[system]}
							forms={forms}
						/>
						{note && (
							<p className="text-base text-ink-600 leading-relaxed">{note}</p>
						)}
					</div>
				);
			})}
		</div>
	);
}
