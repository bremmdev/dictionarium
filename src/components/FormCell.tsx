import { LatinWord } from "./LatinWord";

/**
 * One cell: the form, and the second form that shares the slot where there is
 * one — urbīs beside urbēs, domō beside domuī. The alternative is set in muted
 * ink rather than gold so the form to learn first still reads as the answer,
 * and the "or" sits outside the lang="la" span so a Latin voice does not try to
 * pronounce an English word. Below md it drops to its own line to keep the
 * column narrow on a phone.
 */
export function FormCell({ form, alt }: { form: string; alt?: string }) {
	return (
		<>
			<LatinWord>{form}</LatinWord>
			{alt && (
				<span className="block text-ink-600 text-sm md:inline md:text-base">
					{" or "}
					<span lang="la">{alt}</span>
				</span>
			)}
		</>
	);
}
