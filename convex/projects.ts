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
		const now = Date.now();
		const projectId = await ctx.db.insert("projects", {
			title: args.title,
			description: args.description,
			code: args.code,
			files: args.files,
			previewUrl: args.previewUrl,
			sandboxId: args.sandboxId,
			createdAt: now,
		});

		return projectId;
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
		const { id, title, description, code, files, previewUrl, sandboxId } = args;

		const existing = await ctx.db.get(id);
		if (!existing) {
			throw new Error("Project not found");
		}

		const nextCode: string =
			code !== undefined ? code : (existing.code as string);
		const nextFiles: Array<{ path: string; content: string }> =
			files !== undefined
				? (files as Array<{ path: string; content: string }>)
				: (existing.files as Array<{ path: string; content: string }>);

		const codeChanged = code !== undefined && existing.code !== nextCode;
		const filesChanged = (() => {
			if (files === undefined) return false;
			try {
				const a = JSON.stringify(existing.files);
				const b = JSON.stringify(nextFiles);
				return a !== b;
			} catch {
				return true;
			}
		})();

		const shouldCreateVersion = codeChanged || filesChanged;

		if (shouldCreateVersion) {
			const now = Date.now();

			const nextVersion = (existing.currentVersion ?? 0) + 1;

			const patchUpdates: Partial<{
				title: string;
				description: string;
				code: string;
				files: Array<{ path: string; content: string }>;
				previewUrl?: string;
				sandboxId?: string;
				currentVersion: number;
			}> = {};

			if (title !== undefined) patchUpdates.title = title;
			if (description !== undefined) patchUpdates.description = description;
			if (code !== undefined) patchUpdates.code = code;
			if (files !== undefined)
				patchUpdates.files = files as Array<{ path: string; content: string }>;
			if (previewUrl !== undefined) patchUpdates.previewUrl = previewUrl;
			if (sandboxId !== undefined) patchUpdates.sandboxId = sandboxId;
			patchUpdates.currentVersion = nextVersion;

			await ctx.db.patch(id, patchUpdates);

			await ctx.db.insert("versions", {
				projectId: id,
				version: nextVersion,
				code: nextCode,
				files: nextFiles,
				previewUrl:
					previewUrl !== undefined
						? (previewUrl as string | undefined)
						: (existing.previewUrl as string | undefined),
				sandboxId:
					sandboxId !== undefined
						? (sandboxId as string | undefined)
						: (existing.sandboxId as string | undefined),
				note: "Update",
				createdAt: now,
			});

			return id;
		} else {
			const patchUpdates: Partial<{
				title: string;
				description: string;
				code: string;
				files: Array<{ path: string; content: string }>;
				previewUrl?: string;
				sandboxId?: string;
			}> = {};
			if (title !== undefined) patchUpdates.title = title;
			if (description !== undefined) patchUpdates.description = description;
			if (code !== undefined) patchUpdates.code = code;
			if (files !== undefined)
				patchUpdates.files = files as Array<{ path: string; content: string }>;
			if (previewUrl !== undefined) patchUpdates.previewUrl = previewUrl;
			if (sandboxId !== undefined) patchUpdates.sandboxId = sandboxId;
			await ctx.db.patch(id, patchUpdates);
			return id;
		}
	},
});

export const listVersions = query({
	args: { projectId: v.optional(v.id("projects")) },
	handler: async (ctx, args) => {
		if (!args.projectId) {
			return [];
		}
		const projectId = args.projectId;
		return await ctx.db
			.query("versions")
			.withIndex("by_project_version", (q) => q.eq("projectId", projectId))
			.order("desc")
			.collect();
	},
});

export const getVersion = query({
	args: { projectId: v.id("projects"), version: v.number() },
	handler: async (ctx, args) => {
		const docs = await ctx.db
			.query("versions")
			.withIndex("by_project_version", (q) => q.eq("projectId", args.projectId))
			.filter((q) => q.eq(q.field("version"), args.version))
			.collect();
		return docs[0] ?? null;
	},
});

export const revertToVersion = mutation({
	args: {
		id: v.id("projects"),
		version: v.number(),
		note: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { id, version, note } = args;

		const existing = await ctx.db.get(id);
		if (!existing) throw new Error("Project not found");

		const targetDocs = await ctx.db
			.query("versions")
			.withIndex("by_project_version", (q) => q.eq("projectId", id))
			.filter((q) => q.eq(q.field("version"), version))
			.collect();
		const target = targetDocs[0];
		if (!target) throw new Error(`Version ${version} not found`);

		const now = Date.now();
		const nextVersion = (existing.currentVersion ?? 0) + 1;

		await ctx.db.patch(id, {
			code: target.code,
			files: target.files as Array<{ path: string; content: string }>,
			previewUrl: target.previewUrl,
			sandboxId: target.sandboxId,
			currentVersion: nextVersion,
		});

		await ctx.db.insert("versions", {
			projectId: id,
			version: nextVersion,
			code: target.code,
			files: target.files as Array<{ path: string; content: string }>,
			previewUrl: target.previewUrl,
			sandboxId: target.sandboxId,
			note: note ?? `Revert to v${version}`,
			createdAt: now,
		});

		return id;
	},
});

export const remove = mutation({
	args: { id: v.id("projects") },
	handler: async (ctx, args) => {
		const versions = await ctx.db
			.query("versions")
			.withIndex("by_project", (q) => q.eq("projectId", args.id))
			.collect();

		for (const version of versions) {
			await ctx.db.delete(version._id);
		}

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
