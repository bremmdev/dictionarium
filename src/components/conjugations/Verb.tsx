import { LatinWord } from "../LatinWord";
import { SYSTEMS, type Verb as VerbData } from "./Conjugations.utils";
import { SystemTable } from "./SystemTable";

type VerbProps = {
	verb: VerbData;
	/** Sits under the tables when the verb does something the pattern does not. */
	note?: React.ReactNode;
};

// Only the indicative active exists so far; Tabs arrive with the second set.
export function Verb({ verb, note }: VerbProps) {
	const [lemma, ...rest] = verb.principalParts;
	const { english, indicative } = verb;

	return (
		<div className="mx-auto max-w-xl space-y-3">
			<SystemTable
				caption={
					<>
						<LatinWord className="text-base md:text-lg">{lemma}</LatinWord>
						{", "}
						<span lang="la">{rest.join(", ")}</span>
						{` — ${english}`}
					</>
				}
				tenses={SYSTEMS.present}
				forms={indicative.active ?? {}}
			/>
			{note && <p className="text-base text-ink-600 leading-relaxed">{note}</p>}
		</div>
	);
}
