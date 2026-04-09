import { env } from "cloudflare:workers";
import { uuidv7 } from "uuidv7";
import type { Prisma } from "#/generated/prisma/client";
import { CATEGORY_PREFIX, CREATOR_PREFIX, PUBLIC_TAG } from "#/lib/constants";
import { createPrismaClient } from "#/lib/db";

interface UploadResult {
	id: string;
	path: string;
	metadata: {
		mime: string;
		size: number;
		originalName: string;
	};
}

export async function uploadFile(file: File): Promise<UploadResult> {
	const db = createPrismaClient();
	const key = uuidv7();
	const metadata = {
		mime: file.type || "application/octet-stream",
		size: file.size,
		originalName: file.name,
	};

	await env.STORAGE.put(key, file.stream(), {
		httpMetadata: { contentType: metadata.mime },
	});

	const record = await db.object.create({
		data: {
			path: key,
			metadata,
		},
	});

	return {
		id: record.id,
		path: record.path,
		metadata,
	};
}

export async function renameFile(id: string, newName: string): Promise<void> {
	const db = createPrismaClient();
	const record = await db.object.findUnique({ where: { id } });
	if (!record) throw new Error("File not found");
	const metadata = record.metadata as Record<string, unknown>;
	await db.object.update({
		where: { id },
		data: { metadata: { ...metadata, originalName: newName } },
	});
}

export async function deleteFile(id: string): Promise<void> {
	const db = createPrismaClient();
	const record = await db.object.findUnique({ where: { id } });
	if (!record) throw new Error("File not found");

	await db.object.update({
		where: { id },
		data: { deleted_at: new Date() },
	});
}

export async function listFiles(page = 1, perPage = 12) {
	const db = createPrismaClient();
	const where = { deleted_at: null };
	const [items, total] = await Promise.all([
		db.object.findMany({
			where,
			orderBy: { created_at: "desc" },
			include: { tags: true },
			skip: (page - 1) * perPage,
			take: perPage,
		}),
		db.object.count({ where }),
	]);
	return { items, total };
}

export async function addTagsToFile(
	fileId: string,
	tagNames: string[],
): Promise<void> {
	const db = createPrismaClient();
	const prefixedNames = tagNames.map((name) => `user:${name}`);

	await db.$transaction(
		prefixedNames.map((name) =>
			db.tag.upsert({ where: { name }, create: { name }, update: {} }),
		),
	);
	await db.object.update({
		where: { id: fileId },
		data: { tags: { connect: prefixedNames.map((name) => ({ name })) } },
	});
}

export async function removeTagFromFile(
	fileId: string,
	tagName: string,
): Promise<void> {
	const db = createPrismaClient();
	await db.object.update({
		where: { id: fileId },
		data: { tags: { disconnect: { name: tagName } } },
	});
}

// --- Category (implemented as system:category:{value} tags) ---

export interface CategoryMetadata {
	displayName?: string;
	period?: string;
}

export interface CategoryRecord {
	id: string;
	name: string;
	value: string;
	metadata: CategoryMetadata | null;
	objectCount: number;
}

export async function listCategories(): Promise<CategoryRecord[]> {
	const db = createPrismaClient();
	const tags = await db.tag.findMany({
		where: { name: { startsWith: CATEGORY_PREFIX } },
		include: {
			objects: { where: { deleted_at: null }, select: { id: true } },
		},
		orderBy: { created_at: "asc" },
	});

	return tags.map((tag) => ({
		id: tag.id,
		name: tag.name.slice(CATEGORY_PREFIX.length),
		value: tag.name,
		metadata: (tag.metadata as CategoryMetadata | null) ?? null,
		objectCount: tag.objects.length,
	}));
}

export async function createCategory(
	name: string,
	metadata?: CategoryMetadata | null,
): Promise<CategoryRecord> {
	const db = createPrismaClient();
	const tagName = `${CATEGORY_PREFIX}${name}`;
	const tag = await db.tag.create({
		data: { name: tagName, metadata: metadata ?? undefined },
	});
	return {
		id: tag.id,
		name,
		value: tag.name,
		metadata: (tag.metadata as CategoryMetadata | null) ?? null,
		objectCount: 0,
	};
}

export async function updateCategory(
	id: string,
	newName: string,
	metadata?: CategoryMetadata | null,
): Promise<CategoryRecord> {
	const db = createPrismaClient();
	const tagName = `${CATEGORY_PREFIX}${newName}`;
	const data: Prisma.TagUpdateInput = { name: tagName };
	if (metadata !== undefined) {
		data.metadata = metadata ?? undefined;
	}
	const tag = await db.tag.update({ where: { id }, data });
	const count = await db.object.count({
		where: { deleted_at: null, tags: { some: { id } } },
	});
	return {
		id: tag.id,
		name: newName,
		value: tag.name,
		metadata: (tag.metadata as CategoryMetadata | null) ?? null,
		objectCount: count,
	};
}

export async function deleteCategory(id: string): Promise<void> {
	const db = createPrismaClient();
	await db.tag.delete({ where: { id } });
}

export interface CategoryObject {
	id: string;
	path: string;
	metadata: { mime: string; size: number; originalName: string };
}

export async function listCategoryObjects(
	categoryId: string | null,
): Promise<CategoryObject[]> {
	const db = createPrismaClient();
	const where = categoryId
		? { deleted_at: null, tags: { some: { id: categoryId } } }
		: {
				deleted_at: null,
				tags: { none: { name: { startsWith: CATEGORY_PREFIX } } },
			};
	const rows = await db.object.findMany({
		where,
		orderBy: { created_at: "desc" },
	});
	return rows.map((r) => ({
		id: r.id,
		path: r.path,
		metadata: r.metadata as CategoryObject["metadata"],
	}));
}

/** Fetch objects with their category tags in a single query, then group by category. */
export async function listAllCategoryObjects(): Promise<{
	categoryObjects: Record<string, CategoryObject[]>;
	uncategorizedObjects: CategoryObject[];
}> {
	const db = createPrismaClient();

	const categoryTags = await db.tag.findMany({
		where: { name: { startsWith: CATEGORY_PREFIX } },
		include: {
			objects: {
				where: { deleted_at: null },
				orderBy: { created_at: "desc" },
				select: { id: true, path: true, metadata: true },
			},
		},
	});

	const categoryObjects: Record<string, CategoryObject[]> = {};
	for (const tag of categoryTags) {
		categoryObjects[tag.id] = tag.objects.map((o) => ({
			id: o.id,
			path: o.path,
			metadata: o.metadata as CategoryObject["metadata"],
		}));
	}

	const uncategorizedRows = await db.object.findMany({
		where: {
			deleted_at: null,
			tags: { none: { name: { startsWith: CATEGORY_PREFIX } } },
		},
		orderBy: { created_at: "desc" },
		select: { id: true, path: true, metadata: true },
	});
	const uncategorizedObjects = uncategorizedRows.map((o) => ({
		id: o.id,
		path: o.path,
		metadata: o.metadata as CategoryObject["metadata"],
	}));

	return { categoryObjects, uncategorizedObjects };
}

export async function listAllCreatorObjects(): Promise<
	Record<string, CategoryObject[]>
> {
	const db = createPrismaClient();

	const creatorTags = await db.tag.findMany({
		where: { name: { startsWith: CREATOR_PREFIX } },
		include: {
			objects: {
				where: { deleted_at: null },
				orderBy: { created_at: "desc" },
				select: { id: true, path: true, metadata: true },
			},
		},
	});

	const result: Record<string, CategoryObject[]> = {};
	for (const tag of creatorTags) {
		result[tag.id] = tag.objects.map((o) => ({
			id: o.id,
			path: o.path,
			metadata: o.metadata as CategoryObject["metadata"],
		}));
	}
	return result;
}

export async function bindObjectToCategory(
	objectId: string,
	categoryId: string,
): Promise<void> {
	const db = createPrismaClient();
	// Disconnect existing category tags, then connect the new one
	const existingCategoryTags = await db.tag.findMany({
		where: {
			name: { startsWith: CATEGORY_PREFIX },
			objects: { some: { id: objectId } },
		},
		select: { id: true },
	});
	await db.object.update({
		where: { id: objectId },
		data: {
			tags: {
				disconnect: existingCategoryTags.map((t) => ({ id: t.id })),
				connect: { id: categoryId },
			},
		},
	});
}

export async function unbindObjectFromCategory(
	objectId: string,
	categoryId: string,
): Promise<void> {
	const db = createPrismaClient();
	await db.object.update({
		where: { id: objectId },
		data: { tags: { disconnect: { id: categoryId } } },
	});
}

// --- Creator (implemented as system:creator:{value} tags) ---

export interface CreatorRecord {
	id: string;
	name: string;
	value: string;
	metadata: Record<string, string> | null;
	objectCount: number;
}

export async function listCreators(): Promise<CreatorRecord[]> {
	const db = createPrismaClient();
	const tags = await db.tag.findMany({
		where: { name: { startsWith: CREATOR_PREFIX } },
		include: {
			objects: { where: { deleted_at: null }, select: { id: true } },
		},
		orderBy: { created_at: "asc" },
	});

	return tags.map((tag) => ({
		id: tag.id,
		name: tag.name.slice(CREATOR_PREFIX.length),
		value: tag.name,
		metadata: (tag.metadata as Record<string, string> | null) ?? null,
		objectCount: tag.objects.length,
	}));
}

export async function createCreator(
	name: string,
	metadata?: Record<string, string> | null,
): Promise<CreatorRecord> {
	const db = createPrismaClient();
	const tagName = `${CREATOR_PREFIX}${name}`;
	const tag = await db.tag.create({
		data: { name: tagName, metadata: metadata ?? undefined },
	});
	return {
		id: tag.id,
		name,
		value: tag.name,
		metadata: (tag.metadata as Record<string, string> | null) ?? null,
		objectCount: 0,
	};
}

export async function updateCreator(
	id: string,
	newName: string,
	metadata?: Record<string, string> | null,
): Promise<CreatorRecord> {
	const db = createPrismaClient();
	const tagName = `${CREATOR_PREFIX}${newName}`;
	const data: Prisma.TagUpdateInput = { name: tagName };
	if (metadata !== undefined) {
		data.metadata = metadata ?? undefined;
	}
	const tag = await db.tag.update({ where: { id }, data });
	const count = await db.object.count({
		where: { deleted_at: null, tags: { some: { id } } },
	});
	return {
		id: tag.id,
		name: newName,
		value: tag.name,
		metadata: (tag.metadata as Record<string, string> | null) ?? null,
		objectCount: count,
	};
}

export async function deleteCreator(id: string): Promise<void> {
	const db = createPrismaClient();
	await db.tag.delete({ where: { id } });
}

export async function bindObjectToCreator(
	objectId: string,
	creatorId: string,
): Promise<void> {
	const db = createPrismaClient();
	await db.object.update({
		where: { id: objectId },
		data: { tags: { connect: { id: creatorId } } },
	});
}

export async function unbindObjectFromCreator(
	objectId: string,
	creatorId: string,
): Promise<void> {
	const db = createPrismaClient();
	await db.object.update({
		where: { id: objectId },
		data: { tags: { disconnect: { id: creatorId } } },
	});
}

// --- Public visibility (system:public tag) ---

export async function setObjectPublic(objectId: string): Promise<void> {
	const db = createPrismaClient();
	await db.tag.upsert({
		where: { name: PUBLIC_TAG },
		create: { name: PUBLIC_TAG },
		update: {},
	});
	await db.object.update({
		where: { id: objectId },
		data: { tags: { connect: { name: PUBLIC_TAG } } },
	});
}

export async function unsetObjectPublic(objectId: string): Promise<void> {
	const db = createPrismaClient();
	await db.object.update({
		where: { id: objectId },
		data: { tags: { disconnect: { name: PUBLIC_TAG } } },
	});
}

// --- Public page queries ---

export interface PublicCategoryWithCover {
	id: string;
	name: string;
	displayName: string;
	objectCount: number;
	cover: {
		path: string;
		metadata: { mime: string; originalName: string };
	} | null;
}

/** List categories that contain at least one public object, with a cover image. */
export async function listPublicCategories(): Promise<
	PublicCategoryWithCover[]
> {
	const db = createPrismaClient();
	const tags = await db.tag.findMany({
		where: { name: { startsWith: CATEGORY_PREFIX } },
		include: {
			objects: {
				where: {
					deleted_at: null,
					tags: { some: { name: PUBLIC_TAG } },
				},
				orderBy: { created_at: "desc" },
				select: {
					id: true,
					path: true,
					metadata: true,
				},
			},
		},
		orderBy: { created_at: "desc" },
	});

	return tags
		.filter((tag) => tag.objects.length > 0)
		.map((tag) => {
			const first = tag.objects[0];
			const meta = first?.metadata as Record<string, unknown> | undefined;
			const catMeta = tag.metadata as CategoryMetadata | null;
			const name = tag.name.slice(CATEGORY_PREFIX.length);
			return {
				id: tag.id,
				name,
				displayName: catMeta?.displayName || name,
				objectCount: tag.objects.length,
				cover: first
					? {
							path: first.path,
							metadata: {
								mime: (meta?.mime as string) ?? "application/octet-stream",
								originalName: (meta?.originalName as string) ?? "",
							},
						}
					: null,
			};
		});
}

export interface PublicCreator {
	name: string;
	metadata: Record<string, string> | null;
}

export interface PublicObject {
	id: string;
	path: string;
	metadata: { mime: string; size: number; originalName: string };
	creators: PublicCreator[];
	userTags: string[];
}

/** List public objects within a category, identified by category name. */
export async function listPublicCategoryObjects(
	categoryName: string,
	page = 1,
	perPage = 24,
): Promise<{
	items: PublicObject[];
	total: number;
	categoryId: string | null;
	displayName: string;
}> {
	const db = createPrismaClient();
	const tagName = `${CATEGORY_PREFIX}${categoryName}`;
	const tag = await db.tag.findUnique({ where: { name: tagName } });
	if (!tag)
		return { items: [], total: 0, categoryId: null, displayName: categoryName };
	const catMeta = tag.metadata as CategoryMetadata | null;

	const where = {
		deleted_at: null,
		tags: {
			some: { name: PUBLIC_TAG },
		},
		AND: {
			tags: { some: { id: tag.id } },
		},
	};

	const [rows, total] = await Promise.all([
		db.object.findMany({
			where,
			include: {
				tags: {
					where: {
						OR: [
							{ name: { startsWith: CREATOR_PREFIX } },
							{ name: { startsWith: "user:" } },
						],
					},
					select: { name: true, metadata: true },
				},
			},
			orderBy: { created_at: "desc" },
			skip: (page - 1) * perPage,
			take: perPage,
		}),
		db.object.count({ where }),
	]);

	return {
		items: rows.map((r) => {
			const creators = r.tags
				.filter((t) => t.name.startsWith(CREATOR_PREFIX))
				.map((t) => ({
					name: t.name.slice(CREATOR_PREFIX.length),
					metadata: (t.metadata as Record<string, string> | null) ?? null,
				}));
			const userTags = r.tags
				.filter((t) => t.name.startsWith("user:"))
				.map((t) => t.name.slice(5));
			return {
				id: r.id,
				path: r.path,
				metadata: r.metadata as PublicObject["metadata"],
				creators,
				userTags,
			};
		}),
		total,
		categoryId: tag.id,
		displayName: catMeta?.displayName || categoryName,
	};
}

/** List the latest public objects across all categories (for hero/featured). */
export async function listFeaturedPublicObjects(limit = 5): Promise<
	(PublicObject & {
		category: string | null;
		categoryDisplayName: string | null;
	})[]
> {
	const db = createPrismaClient();
	const rows = await db.object.findMany({
		where: {
			deleted_at: null,
			tags: { some: { name: PUBLIC_TAG } },
		},
		include: {
			tags: {
				where: {
					OR: [
						{ name: { startsWith: CATEGORY_PREFIX } },
						{ name: { startsWith: CREATOR_PREFIX } },
						{ name: { startsWith: "user:" } },
					],
				},
				select: { name: true, metadata: true },
			},
		},
		orderBy: { created_at: "desc" },
		take: limit,
	});

	return rows.map((r) => {
		const categoryTag = r.tags.find((t) => t.name.startsWith(CATEGORY_PREFIX));
		const catMeta = categoryTag?.metadata as CategoryMetadata | null;
		const categoryName = categoryTag
			? categoryTag.name.slice(CATEGORY_PREFIX.length)
			: null;
		const creators = r.tags
			.filter((t) => t.name.startsWith(CREATOR_PREFIX))
			.map((t) => ({
				name: t.name.slice(CREATOR_PREFIX.length),
				metadata: (t.metadata as Record<string, string> | null) ?? null,
			}));
		const userTags = r.tags
			.filter((t) => t.name.startsWith("user:"))
			.map((t) => t.name.slice(5));
		return {
			id: r.id,
			path: r.path,
			metadata: r.metadata as PublicObject["metadata"],
			category: categoryName,
			categoryDisplayName: catMeta?.displayName || categoryName,
			creators,
			userTags,
		};
	});
}
