import { createServerFn } from "@tanstack/react-start";

import {
	acceptDisagreement,
	type HealthReport,
	healthReport,
	reopenDisagreement,
} from "#/db/health";
import { authMiddleware } from "#/server/auth";
import { isField } from "#/utils/health/lila";

/** The health page's RPCs, kept bare like analytics.ts: the queries are in #/db/health. */

function disagreementInput(input: unknown) {
	const raw = (
		typeof input === "object" && input !== null ? input : {}
	) as Record<string, unknown>;
	const { id, field } = raw;
	if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
		throw new Error("That does not say which entry it belongs to.");
	}
	if (!isField(field)) {
		throw new Error("That does not say whether it is the class or the gender.");
	}
	return { id, field };
}

export const getHealth = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler((): HealthReport => healthReport());

export const keepAsFiled = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(disagreementInput)
	.handler(({ data: { id, field } }) => {
		if (!acceptDisagreement(id, field)) {
			throw new Error("LiLa no longer disagrees about this word.");
		}
	});

export const reopen = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(disagreementInput)
	.handler(({ data: { id, field } }) => reopenDisagreement(id, field));
