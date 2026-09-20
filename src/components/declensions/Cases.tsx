import { Heading } from "#/components/Heading";
import { LatinWord } from "#/components/LatinWord";
import { Table } from "#/components/Table";
import { CASE_COLUMNS, CASE_ROLES } from "./Declensions.utils";

const CASE_ROWS = CASE_ROLES.map(({ grammaticalCase, role, example }) => ({
	id: grammaticalCase,
	cells: { grammaticalCase, role, example },
}));

export function Cases() {
	return (
		<section
			id="cases"
			aria-labelledby="cases-heading"
			className="scroll-mt-8 mx-auto max-w-page-width space-y-8 px-8"
		>
			<Heading
				id="cases-heading"
				variant="h2"
				className="mx-auto text-center uppercase tracking-wide"
				lang="la"
			>
				Cāsūs
			</Heading>
			<p>
				English tells you what a word is doing by where it stands:{" "}
				<em>the daughter sees the master</em> and{" "}
				<em>the master sees the daughter</em> are built from the same four
				words. Latin marks the job on the ending instead, so the words can stand
				almost anywhere — <LatinWord>fīlia dominum videt</LatinWord> and{" "}
				<LatinWord>dominum fīlia videt</LatinWord> both say that the daughter is
				the one doing the seeing.
			</p>
			<p>There are six of these jobs, and they are called cases.</p>
			<Table
				caption="The six cases, and what each one is for."
				columns={CASE_COLUMNS}
				rows={CASE_ROWS}
				className="mx-auto max-w-4xl"
			/>
			<p>
				Word order does still do some work, because not every ending is unique.{" "}
				<LatinWord>gladiātōrēs leōnēs necant</LatinWord> is a good example: both
				nouns are third declension, and their nominative and accusative plural
				are the same word. Nothing in the endings says who is killing whom, so
				the ordinary order decides it — subject, object, verb, and the
				gladiators kill the lions.
			</p>
		</section>
	);
}
