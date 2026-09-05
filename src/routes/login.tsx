import { Button } from "@bremmdev/m7kit";
import {
	createFileRoute,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { useRef, useState } from "react";
import scutum from "#/assets/scutum-sketch.svg";
import { Heading } from "#/components/Heading";
import { login } from "#/server/auth";

export const Route = createFileRoute("/login")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);

	const [password, setPassword] = useState("");
	const [isVisible, setIsVisible] = useState(false);
	const [error, setError] = useState("");
	const [isPending, setIsPending] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (isPending) return;

		setIsPending(true);
		setError("");

		try {
			await login({ data: password });
			// The header reads the session from the root loader, which is cached
			// until something says otherwise. This is that something.
			await router.invalidate();
			await navigate({ to: "/admin" });
		} catch {
			setError("That password is not right.");
			setIsPending(false);
			setPassword("");
			inputRef.current?.focus();
		}
	};

	return (
		<section className="mx-auto max-w-xl space-y-8 px-8 py-16 md:py-24">
			<div className="space-y-6 text-center">
				<img
					src={scutum}
					alt=""
					aria-hidden="true"
					className="-rotate-6 mx-auto h-24 select-none md:h-28"
				/>

				<Heading variant="h2" className="uppercase tracking-wide" lang="la">
					Sistē, viātor
					<span className="sr-only" lang="en">
						{" (halt, traveller)"}
					</span>
				</Heading>

				<p className="text-ink-500 text-lg">
					Beyond here is the editor&rsquo;s desk.
				</p>
			</div>

			<form className="flex flex-col gap-6" onSubmit={handleSubmit}>
				<div className="space-y-2">
					<label
						htmlFor="admin-password"
						className="block font-semibold text-gold-600 text-sm uppercase tracking-[0.18em]"
					>
						Password
					</label>

					{/* Same rule as the search box: one accent underline that thickens on
					    focus, with the icon and the affordance sitting inside it. */}
					<div className="flex items-center gap-2 border-accent border-b p-2 focus-within:border-b-2">
						<KeyRound
							className="h-6 w-6 shrink-0 text-accent"
							aria-hidden="true"
						/>
						{/* Chrome ignores type="hidden" here and warns that a password form
						    needs a username field. It wants a real text input with
						    autocomplete="username", so this one is only visually hidden. */}
						<input
							type="text"
							name="username"
							value="admin"
							autoComplete="username"
							readOnly
							tabIndex={-1}
							aria-hidden="true"
							className="sr-only"
						/>
						<input
							id="admin-password"
							ref={inputRef}
							type={isVisible ? "text" : "password"}
							required
							autoComplete="current-password"
							spellCheck={false}
							aria-invalid={error !== ""}
							aria-describedby={error === "" ? undefined : "password-error"}
							className="h-12 w-full font-bold text-xl tracking-wide outline-none"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
						{password !== "" && (
							<button
								type="button"
								lang="la"
								onClick={() => {
									setIsVisible((visible) => !visible);
									inputRef.current?.focus();
								}}
								className="focus-ring font-bold text-accent uppercase"
							>
								{isVisible ? "cēlā" : "mōnstrā"}
								<span className="sr-only" lang="en">
									{isVisible ? " (hide password)" : " (show password)"}
								</span>
							</button>
						)}
					</div>
				</div>

				{error !== "" && (
					<p id="password-error" role="alert" className="text-lg">
						<span className="font-bold text-accent" lang="la">
							Nōn licet.
						</span>{" "}
						<span className="text-ink-500">{error}</span>
					</p>
				)}

				<Button
					type="submit"
					variant="primary"
					className="self-center uppercase"
					lang="la"
					isLoading={isPending}
				>
					Intrā
					<span className="sr-only" lang="en">
						{" (log in)"}
					</span>
				</Button>
			</form>
		</section>
	);
}
