// vite.config.ts
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	server: {
		port: 3000,
	},
	plugins: [
		tanstackStart({
			tsr: {
				routesDirectory: "src/routes",
			},
			customViteReactPlugin: true,
		}),
		react(),
		tsconfigPaths(),
	],
});
