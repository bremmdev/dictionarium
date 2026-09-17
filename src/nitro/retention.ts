import { scheduleRetention } from "#/db/retention";

/**
 * Nitro runtime plugin: start the analytics retention schedule at boot.
 *
 * Same reasoning as `src/nitro/backups.ts`, and the same trap it exists to
 * avoid: `src/db/retention.ts` is bundled into an SSR chunk that Nitro only
 * loads when a route first renders, so a schedule started at that module's
 * import starts on first traffic rather than on boot. Registered in
 * `vite.config.ts` under `nitro({ plugins })`.
 */
export default function retention() {
	scheduleRetention();
}
