import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
	handler: async (ctx) => {
		return await ctx.db.query("projects").order("desc").collect();
	},
});

export const get = query({
	args: { id: v.id("projects") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

export const create = mutation({
	args: {
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
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("projects", {
			title: args.title,
			description: args.description,
			code: args.code,
			files: args.files,
			previewUrl: args.previewUrl,
			sandboxId: args.sandboxId,
			createdAt: Date.now(),
		});
	},
});

export const update = mutation({
	args: {
		id: v.id("projects"),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		code: v.optional(v.string()),
		files: v.optional(
			v.array(
				v.object({
					path: v.string(),
					content: v.string(),
				}),
			),
		),
		previewUrl: v.optional(v.string()),
		sandboxId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;

		const cleanUpdates = Object.fromEntries(
			Object.entries(updates).filter(([, value]) => value !== undefined),
		);
		return await ctx.db.patch(id, cleanUpdates);
	},
});

export const remove = mutation({
	args: { id: v.id("projects") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	},
});

export const updateTitle = mutation({
	args: {
		id: v.id("projects"),
		title: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db.patch(args.id, { title: args.title });
	},
});

// Toggle starred status for an app
export const toggleStarred = mutation({
	args: {
		id: v.id("projects"),
	},
	handler: async (ctx, args) => {
		const app = await ctx.db.get(args.id);
		if (!app) {
			throw new Error("App not found");
		}
		const newStarredStatus = !app.starred;
		return await ctx.db.patch(args.id, { starred: newStarredStatus });
	},
});

export const updateVisibility = mutation({
	args: {
		id: v.id("projects"),
		visibility: v.union(v.literal("private"), v.literal("public")),
	},
	handler: async (ctx, args) => {
		const app = await ctx.db.get(args.id);
		if (!app) {
			throw new Error("App not found");
		}
		return await ctx.db.patch(args.id, { visibility: args.visibility });
	},
});
