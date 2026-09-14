import { db } from "#/db";
import { scheduleBackups } from "#/db/backup";

/**
 * Nitro runtime plugin: start the backup schedule when the server starts.
 *
 * This exists because importing `src/db` is not enough. The database module is bundled
 * into an SSR chunk, which Nitro loads when a route first renders — so a scheduler
 * started at that module's import does not start at boot, it starts on the first
 * request, and a freshly deployed service sitting idle never writes a backup at all.
 *
 * Nitro plugins run once, at startup, before anything is served. Registered in `vite.config.ts` under `nitro({ plugins })`.
 */
export default function backups() {
	scheduleBackups(db.$client);
}
