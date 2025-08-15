import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	histories: defineTable({
		title: v.string(),
		description: v.string(),
		code: v.string(),
		files: v.array(
			v.object({
				path: v.string(),
				content: v.string(),
			}),
		),
		previewUrl: v.optional(v.string()),
		sandboxId: v.optional(v.string()),
		createdAt: v.number(),
		starred: v.optional(v.boolean()),
		visibility: v.optional(v.union(v.literal("private"), v.literal("public"))),
	}),
});
