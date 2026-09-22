import { Button } from "@bremmdev/m7kit";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Hash, Table2 } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

const RESOURCES = [
	{
		to: "/declensions",
		label: "Declensions",
		description: "Nouns and adjectives by case",
		Icon: Table2,
	},
	{
		to: "/numbers",
		label: "Numbers",
		description: "Numerals and counting",
		Icon: Hash,
	},
] as const;

const linksIn = (panel: HTMLElement | null) =>
	Array.from(panel?.querySelectorAll("a") ?? []);

export function ResourcesMenu() {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	// Which link to land on once the panel has actually rendered. Set by the
	// arrow keys, which open and move in one stroke — the element does not exist
	// yet at the moment the key is pressed.
	const focusOnOpen = useRef<"first" | "last" | null>(null);
	const panelId = useId();

	const open = (focus: "first" | "last" | null = null) => {
		focusOnOpen.current = focus;
		setIsOpen(true);
	};

	// useCallback only so the document listeners below can depend on it without
	// resubscribing on every render; it closes over nothing but stable handles.
	const close = useCallback((returnFocus: boolean) => {
		setIsOpen(false);
		if (returnFocus) buttonRef.current?.focus();
	}, []);

	useEffect(() => {
		if (!isOpen) return;

		const target = focusOnOpen.current;
		focusOnOpen.current = null;
		if (target) {
			const items = linksIn(panelRef.current);
			(target === "first" ? items.at(0) : items.at(-1))?.focus();
		}

		// Escape is documented as a global: it has to work from the links inside
		// the panel and from the trigger, and the pointer may have moved focus to
		// neither of them.
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") close(true);
		};
		// pointerdown, not click: a mousedown elsewhere already moves focus, and
		// waiting for click leaves the panel hanging open for a frame.
		const onPointerDown = (e: Event) => {
			if (!containerRef.current?.contains(e.target as Node)) close(false);
		};

		document.addEventListener("keydown", onKeyDown);
		document.addEventListener("pointerdown", onPointerDown);
		return () => {
			document.removeEventListener("keydown", onKeyDown);
			document.removeEventListener("pointerdown", onPointerDown);
		};
	}, [isOpen, close]);

	// Tabbing off the last link has to close the panel, but without yanking focus
	// back — the user is on their way somewhere else. relatedTarget is where focus
	// is headed; null (a click on page chrome, or the window losing focus) counts
	// as out.
	const handleBlur = (e: React.FocusEvent) => {
		if (!containerRef.current?.contains(e.relatedTarget)) setIsOpen(false);
	};

	const handleButtonKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			open("first");
		}
		if (e.key === "ArrowUp") {
			e.preventDefault();
			open("last");
		}
	};

	// Arrow/Home/End inside the panel are an APG optional extra, not a
	// requirement — Tab alone already reaches every link. They are here because a
	// vertical list that ignores the down arrow feels broken.
	const handleLinkKeyDown = (e: React.KeyboardEvent) => {
		const items = linksIn(panelRef.current);
		const index = items.indexOf(e.currentTarget as HTMLAnchorElement);
		if (index === -1) return;

		const next = {
			ArrowDown: (index + 1) % items.length,
			ArrowUp: (index - 1 + items.length) % items.length,
			Home: 0,
			End: items.length - 1,
		}[e.key];

		if (next === undefined) return;
		e.preventDefault();
		items[next].focus();
	};

	return (
		<div ref={containerRef} className="resources relative ms-6">
			<Button
				ref={buttonRef}
				variant="secondary"
				className="border-transparent uppercase aria-expanded:bg-accent/10"
				aria-expanded={isOpen}
				aria-controls={panelId}
				onClick={() => (isOpen ? close(false) : open())}
				onKeyDown={handleButtonKeyDown}
				onBlur={handleBlur}
			>
				Resources
				<ChevronDown
					aria-hidden="true"
					className={`h-3.5 w-3.5 transition-transform duration-150 ${
						isOpen ? "rotate-180" : ""
					}`}
				/>
			</Button>

			{isOpen && (
				<div
					ref={panelRef}
					id={panelId}
					className="absolute end-0 top-full z-10 mt-2 w-80 rounded-2xl border border-parchment-200 bg-parchment-50 p-2 shadow-xl"
				>
					<ul className="space-y-1">
						{RESOURCES.map(({ to, label, description, Icon }) => (
							<li key={to}>
								<Link
									to={to}
									activeProps={{ "aria-current": "page" }}
									onClick={() => setIsOpen(false)}
									onKeyDown={handleLinkKeyDown}
									onBlur={handleBlur}
									className="focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 normal-case hover:bg-parchment-100 aria-[current=page]:bg-parchment-100"
								>
									<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-parchment-300 bg-parchment-50 text-accent">
										<Icon aria-hidden="true" className="h-5 w-5" />
									</span>
									<span>
										<span className="block font-semibold text-accent leading-snug">
											{label}
										</span>
										<span className="block text-ink-700 text-sm italic leading-snug">
											{description}
										</span>
									</span>
								</Link>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
