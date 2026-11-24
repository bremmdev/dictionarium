import { timingSafeEqual } from "node:crypto";
import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getAppSession } from "./session";

/** Constant-time compare, so a wrong password cannot be found one byte at a time. */
function secretMatches(given: string, expected: string) {
	const a = Buffer.from(given);
	const b = Buffer.from(expected);
	// timingSafeEqual throws on a length mismatch, and that throw would itself
	// leak the length. Burn an equivalent comparison instead, then say no.
	if (a.length !== b.length) {
		timingSafeEqual(a, a);
		return false;
	}
	return timingSafeEqual(a, b);
}

export const login = createServerFn({ method: "POST" })
	.validator((password: unknown) =>
		typeof password === "string" ? password : "",
	)
	.handler(async ({ data: given }) => {
		const expected = process.env.ADMIN_PASSWORD ?? "";
		if (expected === "" || !secretMatches(given, expected)) {
			throw new Error("Invalid password");
		}
		const session = await getAppSession();
		session.isAdmin = true;
		await session.save();
		return { ok: true };
	});

export const logout = createServerFn({ method: "POST" }).handler(async () => {
	const session = await getAppSession();
	session.destroy();
	return { ok: true };
});

/**
 * The one session fact as an RPC. A route's beforeLoad is isomorphic — it runs
 * in the browser on a client-side navigation — so it cannot read the sealed
 * cookie itself; it has to ask the server.
 */
export const getIsAdmin = createServerFn({ method: "GET" }).handler(
	async () => {
		const session = await getAppSession();
		return session.isAdmin === true;
	},
);

export const authMiddleware = createMiddleware({ type: "function" }).server(
	async ({ next }) => {
		const session = await getAppSession();
		if (!session.isAdmin) {
			throw new Response("Unauthorized", { status: 401 });
		}
		return next();
	},
);
