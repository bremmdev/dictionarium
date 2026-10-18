import tenseTimeline from "#/assets/tense-timeline.svg";
import { Heading } from "#/components/Heading";
import { LatinWord } from "#/components/LatinWord";
import { Table } from "#/components/Table";
import { TenseLabel } from "./Labels";

// Checked against Allen & Greenough §§ 160–161, 205, 465–466, 470–471, 473,
// 477, 543 and Gildersleeve & Lodge §§ 227, 235–241, 561.

const COLUMNS = [
	{ key: "tense", label: "Tense" },
	{ key: "latin", label: "Latin" },
	{ key: "english", label: "English" },
	{ key: "when", label: "When" },
];

const ROWS = [
	{
		id: "present",
		cells: {
			tense: <TenseLabel tense="present" />,
			latin: <LatinWord>salūtō</LatinWord>,
			english: "I greet, I am greeting, I do greet",
			when: "now, as a habit, or always",
		},
	},
	{
		id: "imperfect-progressive",
		cells: {
			tense: <TenseLabel tense="imperfect" />,
			latin: <LatinWord>salūtābam</LatinWord>,
			english: "I was greeting",
			when: "going on at some time in the past — a scene, not an event",
		},
	},
	{
		id: "imperfect-habitual",
		cells: {
			tense: <TenseLabel tense="imperfect" />,
			latin: <LatinWord>salūtābam</LatinWord>,
			english: "I used to greet, I kept greeting",
			when: "again and again in the past, as a habit",
		},
	},
	{
		id: "imperfect-conative",
		cells: {
			tense: <TenseLabel tense="imperfect" />,
			latin: <LatinWord>salūtābam</LatinWord>,
			english: "I tried to greet, I began to greet",
			when: "started or attempted, but not carried through",
		},
	},
	{
		id: "perfect-pure",
		cells: {
			tense: <TenseLabel tense="perfect" />,
			latin: <LatinWord>salūtāvī</LatinWord>,
			english: "I have greeted",
			when: "done, seen from the present — the present perfect",
		},
	},
	{
		id: "perfect-historical",
		cells: {
			tense: <TenseLabel tense="perfect" />,
			latin: <LatinWord>salūtāvī</LatinWord>,
			english: "I greeted",
			when: "one event in the past, as in a story — the historical perfect",
		},
	},
	{
		id: "pluperfect",
		cells: {
			tense: <TenseLabel tense="pluperfect" />,
			latin: <LatinWord>salūtāveram</LatinWord>,
			english: "I had greeted",
			when: "done before some other moment in the past — the past of the past",
		},
	},
];

export function Translating() {
	return (
		<section
			id="translating"
			aria-labelledby="translating-heading"
			className="scroll-mt-8 mx-auto max-w-page-width space-y-8 px-4 sm:px-8"
		>
			<Heading
				id="translating-heading"
				variant="h2"
				className="mx-auto text-center uppercase tracking-wide"
			>
				Translating the tenses
			</Heading>
			<p>
				A Latin tense covers more ground than an English one, so one form can
				need two or three translations. English splits the present into{" "}
				<em>I greet</em> and <em>I am greeting</em>; Latin has{" "}
				<LatinWord>salūtō</LatinWord> for both. The past is cut the other way:
				English <em>I greeted</em> can be the imperfect or the perfect, and
				Latin makes you choose between what went on and what was done.
			</p>
			{/* Scrolls like a table on a phone, so the labels stay readable. */}
			<div className="overflow-x-auto">
				<img
					src={tenseTimeline}
					alt="A timeline from past to future. The pluperfect, salūtāveram, lies furthest back. The imperfect, salūtābam, covers a stretch of the past, and the perfect, salūtāvī, is a single point inside it. The present, salūtō, sits on now."
					className="mx-auto w-full min-w-140 max-w-4xl"
				/>
			</div>
			<Table
				caption="One Latin form, several English ones."
				columns={COLUMNS}
				rows={ROWS}
				className="mx-auto max-w-5xl"
			/>
			<div className="mx-auto max-w-3xl space-y-3 text-base text-ink-600 leading-relaxed">
				<p>
					<strong className="font-semibold text-ink-900">
						The imperfect describes, the perfect reports.
					</strong>{" "}
					Cicero has both in one line about Socrates:{" "}
					<LatinWord>ita cēnsēbat itaque disseruit</LatinWord>,{" "}
					<em>that was what he thought</em>, as a settled view,{" "}
					<em>and that is what he said</em>, on the one occasion. Where the
					context already makes a scene of it, a plain <em>he thought</em> is
					often the better English for an imperfect.
				</p>
				<p>
					<strong className="font-semibold text-ink-900">
						The two perfects are one form,
					</strong>{" "}
					so only the context decides. In a story, one event after another, it
					is the simple past: <LatinWord>vēnī, vīdī, vīcī</LatinWord>,{" "}
					<em>I came, I saw, I conquered</em>. When it speaks from the present
					about something now finished, it is the perfect with <em>have</em>:
					Cicero's <LatinWord>vīximus</LatinWord>, <em>we have lived</em> — our
					life is over.
				</p>
				<p>
					<strong className="font-semibold text-ink-900">
						The present can need an English perfect
					</strong>{" "}
					when something began in the past and is still going on:{" "}
					<LatinWord>patimur multōs iam annōs</LatinWord>,{" "}
					<em>we have been suffering for many years now</em>. Latin says the
					suffering continues; a Latin perfect would mean it had stopped.
				</p>
				<p>
					<strong className="font-semibold text-ink-900">
						The imperfect can need an English pluperfect
					</strong>{" "}
					in the same way, one step further back:{" "}
					<LatinWord>iam dūdum flēbam</LatinWord>,{" "}
					<em>I had been weeping for a long time</em>. The weeping had begun
					earlier and was still going on at the moment the story has reached.
				</p>
				<p>
					<strong className="font-semibold text-ink-900">
						The pluperfect is the perfect of the imperfect,
					</strong>{" "}
					something already done at a moment in the past, and English{" "}
					<em>had</em> matches it:{" "}
					<LatinWord>puer, quem rēx lēgerat, dīxit “ēheu”</LatinWord>,{" "}
					<em>the boy whom the king had chosen said “alas”</em>. The choosing
					came before the speaking. The name says as much:{" "}
					<LatinWord>plūs quam perfectus</LatinWord>,{" "}
					<em>more than completed</em>, finished even before a moment that is
					itself already past.
				</p>
				<p>
					<strong className="font-semibold text-ink-900">
						An English pluperfect is often a Latin perfect.
					</strong>{" "}
					In a <em>when</em> clause with <LatinWord>postquam</LatinWord>,{" "}
					<LatinWord>ubi</LatinWord>, <LatinWord>ut</LatinWord> or{" "}
					<LatinWord>simul ac</LatinWord>, Latin puts the earlier event in the
					perfect:{" "}
					<LatinWord>postquam Caesar pervēnit, obsidēs poposcit</LatinWord>,{" "}
					<em>when Caesar had arrived, he demanded hostages</em>. The step back
					is English's, not Latin's, and <em>arrived</em> would do as well.
				</p>
				<p>
					<strong className="font-semibold text-ink-900">
						Some pluperfects are a plain English past.
					</strong>{" "}
					A few verbs use the perfect for a present state:{" "}
					<LatinWord>ōdī</LatinWord>, <em>I hate</em>,{" "}
					<LatinWord>meminī</LatinWord>, <em>I remember</em>,{" "}
					<LatinWord>nōvī</LatinWord>, <em>I know</em> (literally{" "}
					<em>I have learned</em>). Their pluperfect is a simple past:{" "}
					<LatinWord>ōderam</LatinWord>, <em>I hated</em>,{" "}
					<LatinWord>nōveram</LatinWord>, <em>I knew</em> — not{" "}
					<em>I had hated</em>, <em>I had known</em>.
				</p>
				<p className="text-sm">
					After Allen and Greenough, <cite>New Latin Grammar</cite>, §§ 160–161,
					205, 465–466, 470–471, 473, 477 and 543, and Gildersleeve and Lodge,{" "}
					<cite>Latin Grammar</cite>, §§ 227, 235–241 and 561.
				</p>
			</div>
		</section>
	);
}
