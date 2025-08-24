import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		VERCEL_OIDC_TOKEN: z.string().min(1),
	},

	clientPrefix: "VITE_",

	client: {
		VITE_OPENAI_API_KEY: z.string().min(1),
	},

	runtimeEnv: process.env,

	emptyStringAsUndefined: true,

	skipValidation: process.env.NODE_ENV === "production",
});
