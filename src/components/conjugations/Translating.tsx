import { Heading } from "#/components/Heading";
import { LatinWord } from "#/components/LatinWord";
import { Table } from "#/components/Table";
import { TenseLabel } from "./Labels";

// Checked against Allen & Greenough §§ 160–161, 465–466, 473 and
// Gildersleeve & Lodge §§ 227, 235–240.

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
				<LatinWord>salūtō</LatinWord> for both. The perfect does the same with
				two kinds of past.
			</p>
			<Table
				caption="One Latin form, several English ones."
				columns={COLUMNS}
				rows={ROWS}
				className="mx-auto max-w-5xl"
			/>
			<div className="mx-auto max-w-3xl space-y-3 text-base text-ink-600 leading-relaxed">
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
				<p className="text-sm">
					After Allen and Greenough, <cite>New Latin Grammar</cite>, §§ 160–161,
					465–466 and 473, and Gildersleeve and Lodge,{" "}
					<cite>Latin Grammar</cite>, §§ 227 and 235–240.
				</p>
			</div>
		</section>
	);
}
