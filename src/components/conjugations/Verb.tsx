import { Heading } from "../Heading";
import { LatinWord } from "../LatinWord";
import { SYSTEMS, type Verb as VerbData } from "./Conjugations.utils";
import { SystemTable } from "./SystemTable";

type System = keyof typeof SYSTEMS;

type VerbProps = {
	verb: VerbData;
	/** Sits under a system's table when the verb does something the pattern does not. */
	notes?: Partial<Record<System, React.ReactNode>>;
};

const SYSTEMS_IN_ORDER: System[] = ["present", "perfect"];

// Only the indicative active exists so far; Tabs arrive with the second set.
export function Verb({ verb, notes }: VerbProps) {
	const [lemma, ...rest] = verb.principalParts;
	const forms = verb.indicative.active ?? {};

	// The lemma leads each caption so a screen reader entering either table
	// hears which verb it belongs to.
	const captions: Record<System, React.ReactNode> = {
		present: (
			<>
				<span lang="la">{lemma}</span>, present system
			</>
		),
		perfect: (
			<>
				<span lang="la">{lemma}</span>, perfect system — on the stem{" "}
				<span lang="la">{verb.perfectStem}-</span>
			</>
		),
	};

	return (
		<div className="space-y-4">
			<Heading variant="h4" className="mx-auto text-center">
				<LatinWord>{lemma}</LatinWord>
				<span className="font-normal text-ink-600">
					{", "}
					<span lang="la">{rest.join(", ")}</span>
					{` — ${verb.english}`}
				</span>
			</Heading>
			{/* Stacked at every width: with the future perfect the perfect system
			    needs ~700px, more than half the page. */}
			<div className="mx-auto grid max-w-4xl items-start gap-8">
				{SYSTEMS_IN_ORDER.map((system) => (
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
		</div>
	);
}
