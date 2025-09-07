import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	projects: defineTable({
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
		currentVersion: v.optional(v.number()),
		createdAt: v.number(),
		starred: v.optional(v.boolean()),
		visibility: v.optional(v.union(v.literal("private"), v.literal("public"))),
	}),

	versions: defineTable({
		projectId: v.id("projects"),
		version: v.number(),
		code: v.string(),
		files: v.array(
			v.object({
				path: v.string(),
				content: v.string(),
			}),
		),
		previewUrl: v.optional(v.string()),
		sandboxId: v.optional(v.string()),
		note: v.optional(v.string()),
		createdAt: v.number(),
	})

		.index("by_project", ["projectId"])
		.index("by_project_version", ["projectId", "version"])
		.index("by_project_createdAt", ["projectId", "createdAt"]),
});
