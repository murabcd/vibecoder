import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
	throw new Error(
		"VITE_CONVEX_URL is not defined. Please set it in your .env file.",
	);
}

export const convex = new ConvexReactClient(convexUrl);


