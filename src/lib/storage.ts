import { env } from "cloudflare:workers";
import { uuidv7 } from "uuidv7";
import { CATEGORY_PREFIX, CREATOR_PREFIX } from "#/lib/constants";
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

export interface CategoryRecord {
	id: string;
	name: string;
	value: string;
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
		objectCount: tag.objects.length,
	}));
}

export async function createCategory(name: string): Promise<CategoryRecord> {
	const db = createPrismaClient();
	const tagName = `${CATEGORY_PREFIX}${name}`;
	const tag = await db.tag.create({ data: { name: tagName } });
	return { id: tag.id, name, value: tag.name, objectCount: 0 };
}

export async function updateCategory(
	id: string,
	newName: string,
): Promise<CategoryRecord> {
	const db = createPrismaClient();
	const tagName = `${CATEGORY_PREFIX}${newName}`;
	const tag = await db.tag.update({ where: { id }, data: { name: tagName } });
	const count = await db.object.count({
		where: { deleted_at: null, tags: { some: { id } } },
	});
	return { id: tag.id, name: newName, value: tag.name, objectCount: count };
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
export async function listAllCategoryObjects(
	page = 1,
	perPage = 24,
): Promise<{
	categoryObjects: Record<string, CategoryObject[]>;
	uncategorizedObjects: CategoryObject[];
	total: number;
}> {
	const db = createPrismaClient();
	const where = { deleted_at: null };
	const [rows, total] = await Promise.all([
		db.object.findMany({
			where,
			include: {
				tags: {
					where: { name: { startsWith: CATEGORY_PREFIX } },
					select: { id: true },
				},
			},
			orderBy: { created_at: "desc" },
			skip: (page - 1) * perPage,
			take: perPage,
		}),
		db.object.count({ where }),
	]);

	const categoryObjects: Record<string, CategoryObject[]> = {};
	const uncategorizedObjects: CategoryObject[] = [];

	for (const r of rows) {
		const obj: CategoryObject = {
			id: r.id,
			path: r.path,
			metadata: r.metadata as CategoryObject["metadata"],
		};
		if (r.tags.length === 0) {
			uncategorizedObjects.push(obj);
		} else {
			for (const tag of r.tags) {
				if (!categoryObjects[tag.id]) {
					categoryObjects[tag.id] = [];
				}
				categoryObjects[tag.id].push(obj);
			}
		}
	}

	return { categoryObjects, uncategorizedObjects, total };
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
	metadata: Record<string, unknown> | null;
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
		metadata: tag.metadata as Record<string, unknown> | null,
		objectCount: tag.objects.length,
	}));
}

export async function createCreator(
	name: string,
	metadata?: Record<string, unknown> | null,
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
		metadata: (tag.metadata as Record<string, unknown> | null) ?? null,
		objectCount: 0,
	};
}

export async function updateCreator(
	id: string,
	newName: string,
	metadata?: Record<string, unknown> | null,
): Promise<CreatorRecord> {
	const db = createPrismaClient();
	const tagName = `${CREATOR_PREFIX}${newName}`;
	const data: { name: string; metadata?: unknown } = { name: tagName };
	if (metadata !== undefined) {
		data.metadata = metadata;
	}
	const tag = await db.tag.update({ where: { id }, data });
	const count = await db.object.count({
		where: { deleted_at: null, tags: { some: { id } } },
	});
	return {
		id: tag.id,
		name: newName,
		value: tag.name,
		metadata: (tag.metadata as Record<string, unknown> | null) ?? null,
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
