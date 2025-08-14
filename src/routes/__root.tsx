/// <reference types="vite/client" />

import type { ReactNode } from "react";
import {
	Outlet,
	createRootRoute,
	HeadContent,
	Scripts,
	ScriptOnce,
} from "@tanstack/react-router";

import { Toaster } from "@/components/ui/sonner";

import appCss from "@/styles/app.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Vibe Coder",
			},
			{
				name: "author",
				content: "github.com/murabcd",
			},
			{
				name: "keywords",
				content: "vibecoder, ai, voice, coder",
			},
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
		],
	}),
	component: RootComponent,
});

function RootComponent() {
	return (
		<RootDocument>
			<Outlet />
		</RootDocument>
	);
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<html suppressHydrationWarning lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<ScriptOnce>
					{`document.documentElement.classList.toggle(
            'dark',
            localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
            )`}
				</ScriptOnce>
				{children}
				<Toaster />
				<Scripts />
			</body>
		</html>
	);
}
