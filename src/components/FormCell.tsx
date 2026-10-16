import { LatinWord } from "./LatinWord";

/**
 * One cell: the form, and the second form that shares the slot where there is
 * one — urbīs beside urbēs, domō beside domuī. The alternative is set in muted
 * ink rather than gold so the form to learn first still reads as the answer,
 * and the "or" sits outside the lang="la" span so a Latin voice does not try to
 * pronounce an English word.
 */
export function FormCell({ form, alt }: { form: string; alt?: string }) {
	return (
		<>
			<LatinWord>{form}</LatinWord>
			{alt && (
				<span className="text-ink-600 text-sm md:text-base">
					{" or "}
					<span lang="la">{alt}</span>
				</span>
			)}
		</>
	);
}
