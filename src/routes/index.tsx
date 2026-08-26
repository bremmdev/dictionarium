import { Button } from "@bremmdev/m7kit";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<section className="mx-auto max-w-5xl py-8 space-y-8">
			<h2
				className="text-2xl md:text-4xl uppercase tracking-wide mx-auto text-center"
				lang="la"
			>
				Quaere verba latīna
			</h2>
			<search>
				<form className="flex gap-4 w-full">
					<div className="flex items-center gap-2 border-b border-accent focus-within:border-b-2 p-2 flex-1">
						<label htmlFor="search-word" className="sr-only">
							Latin word to look up
						</label>
						<Search className="w-6 h-6 text-accent shrink-0" />
						<input
							id="search-word"
							type="text"
							className="w-full text-xl h-12 outline-none font-bold tracking-wide"
						/>
						<button
							type="button"
							lang="la"
							className="focus-ring uppercase text-accent font-bold"
						>
							dēlē
							<span className="sr-only" lang="en">
								{" (clear)"}
							</span>
						</button>
					</div>
					<Button variant="primary" className="uppercase self-center" lang="la">
						Quaere
						<span className="sr-only" lang="en">
							{" (search)"}
						</span>
					</Button>
				</form>
			</search>
		</section>
	);
}
