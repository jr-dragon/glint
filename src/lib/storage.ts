import { env } from "cloudflare:workers";
import { uuidv7 } from "uuidv7";
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

export async function deleteFile(id: string): Promise<void> {
	const db = createPrismaClient();
	const record = await db.object.findUnique({ where: { id } });
	if (!record) throw new Error("File not found");

	await db.object.update({
		where: { id },
		data: { deleted_at: new Date() },
	});
}

export async function listFiles() {
	const db = createPrismaClient();
	return db.object.findMany({
		where: { deleted_at: null },
		orderBy: { created_at: "desc" },
		include: { tags: true },
	});
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
