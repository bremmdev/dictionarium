import { useSession } from "@tanstack/react-start/server";

/**
 * One admin, so a session carries one fact: whether the caller proved they
 * know the password. There is no users table and no sessions table — the
 * cookie IS the session, sealed so the client cannot read or forge it.
 */
type AdminSession = { isAdmin: true };

const password = process.env.ADMIN_SESSION_SECRET;

export function useAppSession() {
	if (!password || password.length < 32) {
		throw new Error(
			"ADMIN_SESSION_SECRET must be set and at least 32 characters — it is the key the session cookie is sealed with.",
		);
	}
	return useSession<AdminSession>({
		// Session configuration
		name: "dictionarium-session",
		password: password, // At least 32 characters, used to seal the session cookie
		cookie: {
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			httpOnly: true,
		},
	});
}
