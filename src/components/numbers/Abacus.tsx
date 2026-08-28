import abacus7 from "#/assets/abacus-showing-seven.svg";
import abacus79 from "#/assets/abacus-showing-seventynine.svg";
import abacusSketch from "#/assets/abacus-sketch.svg";
import { Heading } from "#/components/Heading";
import { LatinWord } from "#/components/LatinWord";

export function Abacus() {
	return (
		<section className="mx-auto max-w-page-width px-8 space-y-8">
			<Heading
				variant="h2"
				className="mx-auto text-center uppercase tracking-wide"
				lang="la"
			>
				Abacus
			</Heading>
			<p>
				The Roman hand <LatinWord>abacus</LatinWord> was one of the earliest
				portable calculating devices, used in ancient Rome. It was a simple
				device with grooves for pebbles ordered into columns with 2 grooves per
				column. Each column reprented a factor of ten, and the pebbles were
				moved to represent the numbers. Each column had a lower groove holding
				four pebbles worth one each, and a shorter upper groove holding a single
				pebble worth five. Actual arithmetic happened on the device. Roman
				numerals were never meant to be calculated with, they were meant to
				record what the pebbles showed. The pebbles were{" "}
				<LatinWord>calculī</LatinWord>, "little stones", and that is where
				calculate comes from.
				<img
					src={abacusSketch}
					alt="Abacus, hand-drawn"
					className="mx-auto h-48"
				/>
			</p>
			<p>
				As an example, the following 2 illustrations show the numbers 7 and 79
				on the abacus.
			</p>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<img src={abacus7} alt="Abacus, hand-drawn" className="flex-1" />
				<img src={abacus79} alt="Abacus, hand-drawn" className="flex-1" />
			</div>
		</section>
	);
}
