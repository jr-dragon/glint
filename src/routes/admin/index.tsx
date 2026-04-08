import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import {
	FileIcon,
	LoaderCircleIcon,
	Trash2Icon,
	UploadCloudIcon,
} from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { z } from "zod/v4";
import { FilePreview } from "#/components/FilePreview";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { TagsInput } from "#/components/ui/tags-input";
import {
	addTagsToFile,
	deleteFile,
	listFiles,
	removeTagFromFile,
	uploadFile,
} from "#/lib/storage";

const listFilesFn = createServerFn({ method: "GET" }).handler(async () => {
	return listFiles();
});

const uploadFileFn = createServerFn({ method: "POST" })
	.inputValidator((input: unknown) => {
		if (!(input instanceof FormData)) throw new Error("Expected FormData");
		const file = input.get("file");
		if (!(file instanceof File)) throw new Error("No file provided");
		return input;
	})
	.handler(async ({ data }) => {
		const file = data.get("file") as File;
		return uploadFile(file);
	});

const deleteFileFn = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		await deleteFile(data.id);
	});

const addTagsFn = createServerFn({ method: "POST" })
	.inputValidator(z.object({ fileId: z.string(), tags: z.array(z.string()) }))
	.handler(async ({ data }) => {
		await addTagsToFile(data.fileId, data.tags);
	});

const removeTagFn = createServerFn({ method: "POST" })
	.inputValidator(z.object({ fileId: z.string(), tagName: z.string() }))
	.handler(async ({ data }) => {
		await removeTagFromFile(data.fileId, data.tagName);
	});

export const Route = createFileRoute("/admin/")({
	component: AdminPage,
	loader: () => listFilesFn(),
});

interface TagRecord {
	id: string;
	name: string;
}

interface FileRecord {
	id: string;
	path: string;
	metadata: { mime: string; size: number; originalName: string };
	created_at: string;
	tags: TagRecord[];
}

const CATEGORY_PREFIX = "system:category:";

function getCategoryName(tags: TagRecord[]): string | null {
	const tag = tags.find((t) => t.name.startsWith(CATEGORY_PREFIX));
	return tag ? tag.name.slice(CATEGORY_PREFIX.length) : null;
}

function displayTagName(name: string) {
	return name.replace(/^user:/, "");
}

function formatSize(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getTypeBadge(mime: string) {
	if (mime.startsWith("image/")) return <Badge variant="secondary">圖片</Badge>;
	if (mime.startsWith("video/")) return <Badge variant="secondary">影片</Badge>;
	if (mime.startsWith("audio/")) return <Badge variant="secondary">音訊</Badge>;
	return <Badge variant="outline">文件</Badge>;
}

function TagEditor({
	file,
	onTagsChange,
}: {
	file: FileRecord;
	onTagsChange: (fileId: string, tags: TagRecord[]) => void;
}) {
	const router = useRouter();
	const addTags = useServerFn(addTagsFn);
	const removeTag = useServerFn(removeTagFn);

	const userTags = file.tags.filter((t) => !t.name.startsWith("system:"));
	const tagNames = userTags.map((t) => t.name);

	async function handleChange(next: string[]) {
		const currentSet = new Set(tagNames);
		const nextSet = new Set(next);

		const added = next.filter((t) => !currentSet.has(t));
		const removed = tagNames.filter((t) => !nextSet.has(t));

		// Optimistic update: preserve system tags, update user tags
		const systemTags = file.tags.filter((t) => t.name.startsWith("system:"));
		const newUserTags = next.map((name) => {
			const existing = userTags.find((t) => t.name === name);
			return existing ?? { id: name, name };
		});
		onTagsChange(file.id, [...systemTags, ...newUserTags]);

		if (added.length > 0) {
			await addTags({
				data: {
					fileId: file.id,
					tags: added.map((t) => t.replace(/^user:/, "")),
				},
			});
		}
		for (const tagName of removed) {
			await removeTag({ data: { fileId: file.id, tagName } });
		}

		router.invalidate();
	}

	return (
		<div className="border-t px-3 py-2">
			<TagsInput
				value={tagNames}
				onChange={handleChange}
				placeholder="新增標籤…"
				renderTag={displayTagName}
				transformTag={(t) => `user:${t}`}
			/>
		</div>
	);
}

function AdminPage() {
	const loaderData = Route.useLoaderData() as FileRecord[];
	const [files, setFiles] = useState<FileRecord[]>(loaderData);

	useEffect(() => {
		setFiles(loaderData);
	}, [loaderData]);

	const [dragging, setDragging] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<FileRecord | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const uploadFn = useServerFn(uploadFileFn);
	const deleteFn = useServerFn(deleteFileFn);

	function handleTagsChange(fileId: string, tags: TagRecord[]) {
		setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, tags } : f)));
	}

	async function handleFiles(fileList: FileList | null) {
		if (!fileList || fileList.length === 0) return;
		setUploading(true);
		try {
			for (const file of fileList) {
				const formData = new FormData();
				formData.append("file", file);
				const result = await uploadFn({ data: formData });
				setFiles((prev) => [
					{
						id: result.id,
						path: result.path,
						metadata: result.metadata,
						created_at: new Date().toISOString(),
						tags: [],
					},
					...prev,
				]);
			}
		} finally {
			setUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	}

	async function handleDelete() {
		if (!deleteTarget) return;
		await deleteFn({ data: { id: deleteTarget.id } });
		setFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id));
		setDeleteTarget(null);
	}

	function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
		handleFiles(e.target.files);
	}

	return (
		<>
			<h1 className="mb-6 text-2xl font-bold tracking-tight">檔案管理</h1>

			{/* Upload Zone */}
			<label
				onDragOver={(e) => {
					e.preventDefault();
					setDragging(true);
				}}
				onDragLeave={() => setDragging(false)}
				onDrop={(e) => {
					e.preventDefault();
					setDragging(false);
					handleFiles(e.dataTransfer.files);
				}}
				className={`mb-8 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors ${
					dragging
						? "border-primary bg-primary/5"
						: "border-muted-foreground/25 hover:border-muted-foreground/50"
				}`}
			>
				<input
					ref={fileInputRef}
					type="file"
					className="hidden"
					multiple
					onChange={handleInputChange}
				/>
				{uploading ? (
					<>
						<LoaderCircleIcon className="mb-3 size-10 animate-spin text-primary" />
						<p className="text-sm font-medium">上傳中…</p>
					</>
				) : (
					<>
						<UploadCloudIcon
							className={`mb-3 size-10 ${dragging ? "text-primary" : "text-muted-foreground"}`}
						/>
						<p className="mb-1 text-sm font-medium">
							拖放檔案至此處，或點擊上傳
						</p>
						<p className="mb-4 text-xs text-muted-foreground">
							支援圖片、影片、音訊及文件，單檔上限 50 MB
						</p>
						<span className="inline-flex h-8 items-center rounded-[min(var(--radius-md),10px)] border border-border bg-background px-2.5 text-sm font-medium shadow-xs">
							選擇檔案
						</span>
					</>
				)}
			</label>

			{/* File Cards */}
			{files.length === 0 ? (
				<div className="flex flex-col items-center py-16 text-muted-foreground">
					<FileIcon className="mb-3 size-10" />
					<p className="text-sm">尚無檔案</p>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{files.map((file) => (
						<div
							key={file.id}
							className="group overflow-hidden rounded-xl border bg-card"
						>
							<div className="relative aspect-video w-full bg-muted">
								<FilePreview
									path={file.path}
									mime={file.metadata.mime}
									alt={file.metadata.originalName}
								/>
								{getCategoryName(file.tags) && (
									<Badge
										variant="secondary"
										className="absolute right-2 top-2 bg-background/80 backdrop-blur-sm"
									>
										{getCategoryName(file.tags)}
									</Badge>
								)}
							</div>
							<div className="flex items-start justify-between gap-2 p-3">
								<div className="min-w-0">
									<p className="truncate text-sm font-medium">
										{file.metadata.originalName}
									</p>
									<div className="mt-1.5 flex items-center gap-2">
										{getTypeBadge(file.metadata.mime)}
										<span className="text-xs text-muted-foreground">
											{formatSize(file.metadata.size)}
										</span>
										<span className="text-xs text-muted-foreground">
											{new Date(file.created_at).toLocaleDateString()}
										</span>
									</div>
								</div>
								<Button
									variant="ghost"
									size="icon-xs"
									className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
									onClick={() => setDeleteTarget(file)}
								>
									<Trash2Icon className="size-3.5 text-destructive" />
								</Button>
							</div>
							<TagEditor file={file} onTagsChange={handleTagsChange} />
						</div>
					))}
				</div>
			)}

			{/* Delete Confirmation */}
			<AlertDialog
				open={!!deleteTarget}
				onOpenChange={(open) => !open && setDeleteTarget(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>確認刪除</AlertDialogTitle>
						<AlertDialogDescription>
							即將刪除「{deleteTarget?.metadata.originalName}
							」，此操作無法復原。確定要繼續嗎？
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>取消</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete}>刪除</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
