/// <reference types="vite/client" />

import type { ReactNode } from "react";
import {
	Outlet,
	HeadContent,
	Scripts,
	ScriptOnce,
} from "@tanstack/react-router";

import { Toaster } from "@/components/ui/sonner";
import { ConvexProvider } from "convex/react";
import { convex } from "@/lib/convex";

import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext } from "@tanstack/react-router";

import appCss from "@/styles/app.css?url";

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
}>()({
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
				title: "VibeCoder",
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
				<ConvexProvider client={convex}>{children}</ConvexProvider>
				<Toaster />
				<Scripts />
			</body>
		</html>
	);
}
