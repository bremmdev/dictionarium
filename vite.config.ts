import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [
		devtools(),
		nitro({
			rollupConfig: { external: [/^@sentry\//] },
			// Runs at server startup, before anything is served. The database module
			// itself is bundled into an SSR chunk that only loads on the first rendered
			// request, so without this the backup schedule would start on first traffic
			// rather than on boot — see vault/db.md.
			plugins: ["./src/nitro/backups.ts", "./src/nitro/retention.ts"],
		}),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	],
});

export default config;
