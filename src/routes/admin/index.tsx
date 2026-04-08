import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import {
	CheckIcon,
	FileIcon,
	LoaderCircleIcon,
	PencilIcon,
	PlusIcon,
	Trash2Icon,
	UploadCloudIcon,
	UserPlusIcon,
	XIcon,
} from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { z } from "zod/v4";
import { FilePreview } from "#/components/FilePreview";
import { PaginationBar } from "#/components/PaginationBar";
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
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "#/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { TagsInput } from "#/components/ui/tags-input";
import { CATEGORY_PREFIX, CREATOR_PREFIX } from "#/lib/constants";
import {
	addTagsToFile,
	bindObjectToCreator,
	type CreatorRecord,
	createCreator,
	deleteFile,
	listCreators,
	listFiles,
	removeTagFromFile,
	renameFile,
	unbindObjectFromCreator,
	uploadFile,
} from "#/lib/storage";

const listFilesFn = createServerFn({ method: "GET" })
	.inputValidator(z.object({ page: z.number().int().min(1) }))
	.handler(async ({ data }) => {
		const [files, creators] = await Promise.all([
			listFiles(data.page),
			listCreators(),
		]);
		return { ...files, creators };
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

const renameFileFn = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string(), name: z.string().min(1) }))
	.handler(async ({ data }) => {
		await renameFile(data.id, data.name);
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

const createCreatorFn = createServerFn({ method: "POST" })
	.inputValidator(z.object({ name: z.string().min(1) }))
	.handler(async ({ data }) => {
		return createCreator(data.name);
	});

const bindCreatorFn = createServerFn({ method: "POST" })
	.inputValidator(z.object({ objectId: z.string(), creatorId: z.string() }))
	.handler(async ({ data }) => {
		await bindObjectToCreator(data.objectId, data.creatorId);
	});

const unbindCreatorFn = createServerFn({ method: "POST" })
	.inputValidator(z.object({ objectId: z.string(), creatorId: z.string() }))
	.handler(async ({ data }) => {
		await unbindObjectFromCreator(data.objectId, data.creatorId);
	});

const searchSchema = z.object({
	page: z.coerce.number().int().min(1).catch(1),
});

export const Route = createFileRoute("/admin/")({
	component: AdminPage,
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({ page: search.page }),
	loader: ({ deps }) => listFilesFn({ data: { page: deps.page } }),
});

interface TagRecord {
	id: string;
	name: string;
	metadata?: unknown;
}

interface FileRecord {
	id: string;
	path: string;
	metadata: { mime: string; size: number; originalName: string };
	created_at: string;
	tags: TagRecord[];
}

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

function FileNameEditor({
	name,
	onRename,
}: {
	name: string;
	onRename: (newName: string) => void;
}) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(name);
	const inputRef = useRef<HTMLInputElement>(null);

	function startEdit() {
		setDraft(name);
		setEditing(true);
		requestAnimationFrame(() => inputRef.current?.select());
	}

	function commit() {
		const trimmed = draft.trim();
		if (trimmed && trimmed !== name) {
			onRename(trimmed);
		}
		setEditing(false);
	}

	if (editing) {
		return (
			<div className="flex items-center gap-1">
				<input
					ref={inputRef}
					className="min-w-0 flex-1 rounded border bg-background px-1.5 py-0.5 text-sm font-medium outline-none focus:ring-1 focus:ring-ring"
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") commit();
						if (e.key === "Escape") setEditing(false);
					}}
					onBlur={commit}
				/>
				<Button
					variant="ghost"
					size="icon-xs"
					onMouseDown={(e) => e.preventDefault()}
					onClick={commit}
				>
					<CheckIcon className="size-3.5" />
				</Button>
				<Button
					variant="ghost"
					size="icon-xs"
					onMouseDown={(e) => e.preventDefault()}
					onClick={() => setEditing(false)}
				>
					<XIcon className="size-3.5" />
				</Button>
			</div>
		);
	}

	return (
		<button
			type="button"
			className="group/name flex min-w-0 items-center gap-1 text-left"
			onClick={startEdit}
		>
			<span className="truncate text-sm font-medium">{name}</span>
			<PencilIcon className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/name:opacity-100" />
		</button>
	);
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

function CreatorEditor({
	file,
	allCreators,
	onCreatorsChange,
}: {
	file: FileRecord;
	allCreators: CreatorRecord[];
	onCreatorsChange: (fileId: string, tags: TagRecord[]) => void;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const createCrt = useServerFn(createCreatorFn);
	const bindCreator = useServerFn(bindCreatorFn);
	const unbindCreator = useServerFn(unbindCreatorFn);

	const boundCreatorTags = file.tags.filter((t) =>
		t.name.startsWith(CREATOR_PREFIX),
	);
	const boundCreatorIds = new Set(boundCreatorTags.map((t) => t.id));

	const availableCreators = allCreators.filter(
		(c) => !boundCreatorIds.has(c.id),
	);

	const trimmed = search.trim();
	const hasExactMatch = allCreators.some(
		(c) => c.name.toLowerCase() === trimmed.toLowerCase(),
	);
	const showCreate = trimmed.length > 0 && !hasExactMatch;

	async function handleBind(creator: CreatorRecord) {
		onCreatorsChange(file.id, [
			...file.tags,
			{ id: creator.id, name: creator.value, metadata: creator.metadata },
		]);
		setOpen(false);
		setSearch("");
		await bindCreator({ data: { objectId: file.id, creatorId: creator.id } });
		router.invalidate();
	}

	async function handleCreate() {
		if (!trimmed) return;
		setOpen(false);
		setSearch("");
		const created = await createCrt({ data: { name: trimmed } });
		onCreatorsChange(file.id, [
			...file.tags,
			{ id: created.id, name: created.value, metadata: created.metadata },
		]);
		await bindCreator({
			data: { objectId: file.id, creatorId: created.id },
		});
		router.invalidate();
	}

	async function handleUnbind(tag: TagRecord) {
		onCreatorsChange(
			file.id,
			file.tags.filter((t) => t.id !== tag.id),
		);
		await unbindCreator({ data: { objectId: file.id, creatorId: tag.id } });
		router.invalidate();
	}

	return (
		<div className="flex flex-wrap items-center gap-1.5 border-t px-3 py-2">
			{boundCreatorTags.map((tag) => {
				const meta = (tag.metadata ?? {}) as Record<string, string>;
				return (
					<Badge key={tag.id} variant="outline" className="gap-1 pr-1">
						<span className="text-xs">
							@{tag.name.slice(CREATOR_PREFIX.length)}
						</span>
						{meta.url && (
							<a
								href={meta.url}
								target="_blank"
								rel="noopener noreferrer"
								className="text-xs opacity-60 hover:opacity-100"
								title="Website"
							>
								🔗
							</a>
						)}
						{meta.twitter && (
							<a
								href={`https://x.com/${meta.twitter}`}
								target="_blank"
								rel="noopener noreferrer"
								className="text-xs opacity-60 hover:opacity-100"
								title={`@${meta.twitter}`}
							>
								𝕏
							</a>
						)}
						{meta.pixiv && (
							<a
								href={`https://www.pixiv.net/users/${meta.pixiv}`}
								target="_blank"
								rel="noopener noreferrer"
								className="text-xs opacity-60 hover:opacity-100"
								title="Pixiv"
							>
								P
							</a>
						)}
						<button
							type="button"
							className="rounded-sm opacity-60 hover:opacity-100"
							onClick={() => handleUnbind(tag)}
						>
							<XIcon className="size-3" />
						</button>
					</Badge>
				);
			})}
			<Popover
				open={open}
				onOpenChange={(v) => {
					setOpen(v);
					if (!v) setSearch("");
				}}
			>
				<PopoverTrigger asChild>
					<Button variant="ghost" size="icon-xs" title="新增創作者">
						<UserPlusIcon className="size-3.5 text-muted-foreground" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-52 p-0" align="start">
					<Command shouldFilter={false}>
						<CommandInput
							placeholder="搜尋創作者…"
							value={search}
							onValueChange={setSearch}
						/>
						<CommandList>
							{availableCreators.filter(
								(c) =>
									!trimmed ||
									c.name.toLowerCase().includes(trimmed.toLowerCase()),
							).length === 0 &&
								!showCreate && <CommandEmpty>找不到創作者</CommandEmpty>}
							<CommandGroup>
								{availableCreators
									.filter(
										(c) =>
											!trimmed ||
											c.name.toLowerCase().includes(trimmed.toLowerCase()),
									)
									.map((creator) => (
										<CommandItem
											key={creator.id}
											onSelect={() => handleBind(creator)}
										>
											@{creator.name}
										</CommandItem>
									))}
								{showCreate && (
									<CommandItem onSelect={handleCreate}>
										<PlusIcon className="size-3.5" />
										建立「{trimmed}」
									</CommandItem>
								)}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
}

function toFileRecords(
	items: Awaited<ReturnType<typeof listFiles>>["items"],
): FileRecord[] {
	return items.map((item) => ({
		...item,
		metadata: item.metadata as FileRecord["metadata"],
		created_at: String(item.created_at),
		tags: item.tags.map((t) => ({
			id: t.id,
			name: t.name,
			metadata: t.metadata,
		})),
	}));
}

function AdminPage() {
	const { items: loaderItems, total, creators } = Route.useLoaderData();
	const { page } = Route.useSearch();
	const totalPages = Math.ceil(total / 12);
	const [files, setFiles] = useState(() => toFileRecords(loaderItems));

	useEffect(() => {
		setFiles(toFileRecords(loaderItems));
	}, [loaderItems]);

	const [dragging, setDragging] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<FileRecord | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const uploadFn = useServerFn(uploadFileFn);
	const renameFn = useServerFn(renameFileFn);
	const deleteFn = useServerFn(deleteFileFn);

	function handleTagsChange(fileId: string, tags: TagRecord[]) {
		setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, tags } : f)));
	}

	async function handleRename(fileId: string, newName: string) {
		const trimmed = newName.trim();
		if (!trimmed) return;
		setFiles((prev) =>
			prev.map((f) =>
				f.id === fileId
					? { ...f, metadata: { ...f.metadata, originalName: trimmed } }
					: f,
			),
		);
		await renameFn({ data: { id: fileId, name: trimmed } });
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
					{files.map((file) => {
						const categoryName = getCategoryName(file.tags);
						return (
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
									<div className="absolute right-2 top-2 flex flex-col items-end gap-1">
										{categoryName ? (
											<Badge
												variant="secondary"
												className="bg-background/80 backdrop-blur-sm"
											>
												{categoryName}
											</Badge>
										) : (
											<Badge variant="destructive" className="backdrop-blur-sm">
												未分類
											</Badge>
										)}
									</div>
								</div>
								<div className="flex items-start justify-between gap-2 p-3">
									<div className="min-w-0">
										<FileNameEditor
											name={file.metadata.originalName}
											onRename={(n) => handleRename(file.id, n)}
										/>
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
								<CreatorEditor
									file={file}
									allCreators={creators}
									onCreatorsChange={handleTagsChange}
								/>
							</div>
						);
					})}
				</div>
			)}

			<PaginationBar page={page} totalPages={totalPages} />

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
