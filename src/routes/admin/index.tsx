import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import {
	CheckIcon,
	EarthIcon,
	EarthLockIcon,
	ExpandIcon,
	FileIcon,
	LoaderCircleIcon,
	PencilIcon,
	PlusIcon,
	Trash2Icon,
	UploadCloudIcon,
	UserPlusIcon,
	XIcon,
} from "lucide-react";
import {
	type ChangeEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
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
import { Checkbox } from "#/components/ui/checkbox";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "#/components/ui/command";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { TagsInput } from "#/components/ui/tags-input";
import { CATEGORY_PREFIX, CREATOR_PREFIX, PUBLIC_TAG } from "#/lib/constants";
import {
	addTagsToFile,
	bindObjectToCategory,
	bindObjectToCreator,
	type CategoryRecord,
	type CreatorRecord,
	createCategory,
	createCreator,
	deleteFile,
	listCategories,
	listCreators,
	listFiles,
	removeTagFromFile,
	renameFile,
	setObjectPublic,
	unbindObjectFromCreator,
	unsetObjectPublic,
	updateCreator,
	uploadFile,
} from "#/lib/storage";

const listFilesFn = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			page: z.number().int().min(1),
			perPage: z.number().int().min(1).max(300),
		}),
	)
	.handler(async ({ data }) => {
		const [files, creators, categories] = await Promise.all([
			listFiles(data.page, data.perPage),
			listCreators(),
			listCategories(),
		]);
		return { ...files, creators, categories };
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

const updateCreatorFn = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			id: z.string(),
			name: z.string().min(1),
			metadata: z.record(z.string(), z.string()).nullable(),
		}),
	)
	.handler(async ({ data }) => {
		return updateCreator(data.id, data.name, data.metadata);
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

const createCategoryFn = createServerFn({ method: "POST" })
	.inputValidator(z.object({ name: z.string().min(1) }))
	.handler(async ({ data }) => {
		return createCategory(data.name);
	});

const setPublicFn = createServerFn({ method: "POST" })
	.inputValidator(z.object({ objectId: z.string(), isPublic: z.boolean() }))
	.handler(async ({ data }) => {
		if (data.isPublic) {
			await setObjectPublic(data.objectId);
		} else {
			await unsetObjectPublic(data.objectId);
		}
	});

const bindCategoryFn = createServerFn({ method: "POST" })
	.inputValidator(z.object({ objectId: z.string(), categoryId: z.string() }))
	.handler(async ({ data }) => {
		await bindObjectToCategory(data.objectId, data.categoryId);
	});

const batchBindCategoryFn = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({ objectIds: z.array(z.string()), categoryId: z.string() }),
	)
	.handler(async ({ data }) => {
		for (const objectId of data.objectIds) {
			await bindObjectToCategory(objectId, data.categoryId);
		}
	});

const batchBindCreatorFn = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({ objectIds: z.array(z.string()), creatorId: z.string() }),
	)
	.handler(async ({ data }) => {
		for (const objectId of data.objectIds) {
			await bindObjectToCreator(objectId, data.creatorId);
		}
	});

const PER_PAGE_OPTIONS = [12, 24, 48, 96, 300] as const;

const searchSchema = z.object({
	page: z.coerce.number().int().min(1).catch(1),
	perPage: z.coerce.number().int().min(1).max(300).catch(12),
});

export const Route = createFileRoute("/admin/")({
	component: AdminPage,
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({ page: search.page, perPage: search.perPage }),
	loader: ({ deps }) =>
		listFilesFn({ data: { page: deps.page, perPage: deps.perPage } }),
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

function isPublic(tags: TagRecord[]): boolean {
	return tags.some((t) => t.name === PUBLIC_TAG);
}

function PublicToggle({
	file,
	onTagsChange,
}: {
	file: FileRecord;
	onTagsChange: (fileId: string, tags: TagRecord[]) => void;
}) {
	const router = useRouter();
	const setPublic = useServerFn(setPublicFn);
	const pub = isPublic(file.tags);

	async function handleToggle() {
		const next = !pub;
		// Optimistic update
		if (next) {
			onTagsChange(file.id, [
				...file.tags,
				{ id: PUBLIC_TAG, name: PUBLIC_TAG },
			]);
		} else {
			onTagsChange(
				file.id,
				file.tags.filter((t) => t.name !== PUBLIC_TAG),
			);
		}
		await setPublic({ data: { objectId: file.id, isPublic: next } });
		router.invalidate();
	}

	return (
		<Button
			variant="ghost"
			size="icon-xs"
			className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
			title={pub ? "設為非公開" : "設為公開"}
			onClick={handleToggle}
		>
			{pub ? (
				<EarthIcon className="size-3.5" />
			) : (
				<EarthLockIcon className="size-3.5 text-muted-foreground" />
			)}
		</Button>
	);
}

function getCategoryTag(
	tags: TagRecord[],
): { id: string; name: string } | null {
	const tag = tags.find((t) => t.name.startsWith(CATEGORY_PREFIX));
	return tag
		? { id: tag.id, name: tag.name.slice(CATEGORY_PREFIX.length) }
		: null;
}

function CategoryEditor({
	file,
	allCategories,
	onTagsChange,
}: {
	file: FileRecord;
	allCategories: CategoryRecord[];
	onTagsChange: (fileId: string, tags: TagRecord[]) => void;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const createCat = useServerFn(createCategoryFn);
	const bindCat = useServerFn(bindCategoryFn);

	const current = getCategoryTag(file.tags);

	const trimmed = search.trim();
	const hasExactMatch = allCategories.some(
		(c) => c.name.toLowerCase() === trimmed.toLowerCase(),
	);
	const showCreate = trimmed.length > 0 && !hasExactMatch;

	async function handleSelect(cat: CategoryRecord) {
		// Optimistic: replace category tag
		const nonCategoryTags = file.tags.filter(
			(t) => !t.name.startsWith(CATEGORY_PREFIX),
		);
		onTagsChange(file.id, [
			...nonCategoryTags,
			{ id: cat.id, name: cat.value },
		]);
		setOpen(false);
		setSearch("");
		await bindCat({ data: { objectId: file.id, categoryId: cat.id } });
		router.invalidate();
	}

	async function handleCreate() {
		if (!trimmed) return;
		setOpen(false);
		setSearch("");
		const created = await createCat({ data: { name: trimmed } });
		const nonCategoryTags = file.tags.filter(
			(t) => !t.name.startsWith(CATEGORY_PREFIX),
		);
		onTagsChange(file.id, [
			...nonCategoryTags,
			{ id: created.id, name: created.value },
		]);
		await bindCat({ data: { objectId: file.id, categoryId: created.id } });
		router.invalidate();
	}

	return (
		<Popover
			open={open}
			onOpenChange={(v) => {
				setOpen(v);
				if (!v) setSearch("");
			}}
		>
			<PopoverTrigger asChild>
				{current ? (
					<Badge
						variant="secondary"
						className="cursor-pointer bg-background/80 backdrop-blur-sm hover:bg-background/90"
					>
						{current.name}
					</Badge>
				) : (
					<Badge
						variant="destructive"
						className="cursor-pointer backdrop-blur-sm"
					>
						未分類
					</Badge>
				)}
			</PopoverTrigger>
			<PopoverContent className="w-52 p-0" align="end">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="搜尋分類…"
						value={search}
						onValueChange={setSearch}
					/>
					<CommandList>
						{allCategories.filter(
							(c) =>
								!trimmed ||
								c.name.toLowerCase().includes(trimmed.toLowerCase()),
						).length === 0 &&
							!showCreate && <CommandEmpty>找不到分類</CommandEmpty>}
						<CommandGroup>
							{allCategories
								.filter(
									(c) =>
										!trimmed ||
										c.name.toLowerCase().includes(trimmed.toLowerCase()),
								)
								.map((cat) => (
									<CommandItem
										key={cat.id}
										onSelect={() => handleSelect(cat)}
										className={
											current?.id === cat.id ? "font-medium" : undefined
										}
									>
										{cat.name}
										{current?.id === cat.id && (
											<CheckIcon className="ml-auto size-3.5" />
										)}
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
	);
}

function displayTagName(name: string) {
	return name.replace(/^user:/, "");
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
	const [editTarget, setEditTarget] = useState<{
		id: string;
		name: string;
		facebook: string;
		twitter: string;
		pixiv: string;
	} | null>(null);
	const createCrt = useServerFn(createCreatorFn);
	const updateCrt = useServerFn(updateCreatorFn);
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

	function openEditDialog(tag: TagRecord) {
		const meta = (tag.metadata ?? {}) as Record<string, string>;
		setEditTarget({
			id: tag.id,
			name: tag.name.slice(CREATOR_PREFIX.length),
			facebook: meta.facebook ?? "",
			twitter: meta.twitter ?? "",
			pixiv: meta.pixiv ?? "",
		});
	}

	async function handleEditSave() {
		if (!editTarget) return;
		const metadata: Record<string, string> = {};
		if (editTarget.facebook.trim())
			metadata.facebook = editTarget.facebook.trim();
		if (editTarget.twitter.trim()) metadata.twitter = editTarget.twitter.trim();
		if (editTarget.pixiv.trim()) metadata.pixiv = editTarget.pixiv.trim();
		const meta = Object.keys(metadata).length > 0 ? metadata : null;
		await updateCrt({
			data: { id: editTarget.id, name: editTarget.name, metadata: meta },
		});
		setEditTarget(null);
		router.invalidate();
	}

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
				const hasLinks = meta.facebook || meta.twitter || meta.pixiv;
				return (
					<Badge key={tag.id} variant="outline" className="gap-1 pr-1">
						<button
							type="button"
							className="text-xs hover:underline"
							onClick={() => openEditDialog(tag)}
						>
							@{tag.name.slice(CREATOR_PREFIX.length)}
						</button>
						{hasLinks && (
							<span className="flex items-center gap-0.5">
								{meta.facebook && (
									<a
										href={meta.facebook}
										target="_blank"
										rel="noopener noreferrer"
										className="text-xs opacity-60 hover:opacity-100"
										title="Facebook"
									>
										f
									</a>
								)}
								{meta.twitter && (
									<a
										href={meta.twitter}
										target="_blank"
										rel="noopener noreferrer"
										className="text-xs opacity-60 hover:opacity-100"
										title="Twitter / X"
									>
										𝕏
									</a>
								)}
								{meta.pixiv && (
									<a
										href={meta.pixiv}
										target="_blank"
										rel="noopener noreferrer"
										className="text-xs opacity-60 hover:opacity-100"
										title="Pixiv"
									>
										P
									</a>
								)}
							</span>
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

			{/* Edit Creator Dialog */}
			<Dialog
				open={!!editTarget}
				onOpenChange={(v) => !v && setEditTarget(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>編輯創作者「{editTarget?.name}」</DialogTitle>
						<DialogDescription>設定創作者的社群連結</DialogDescription>
					</DialogHeader>
					{editTarget && (
						<div className="grid gap-4 py-2">
							<div className="grid gap-2">
								<Label htmlFor="creator-facebook">Facebook</Label>
								<Input
									id="creator-facebook"
									value={editTarget.facebook}
									onChange={(e) =>
										setEditTarget({
											...editTarget,
											facebook: e.target.value,
										})
									}
									placeholder="https://www.facebook.com/..."
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="creator-twitter">Twitter / X</Label>
								<Input
									id="creator-twitter"
									value={editTarget.twitter}
									onChange={(e) =>
										setEditTarget({
											...editTarget,
											twitter: e.target.value,
										})
									}
									placeholder="https://x.com/..."
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="creator-pixiv">Pixiv</Label>
								<Input
									id="creator-pixiv"
									value={editTarget.pixiv}
									onChange={(e) =>
										setEditTarget({
											...editTarget,
											pixiv: e.target.value,
										})
									}
									placeholder="https://www.pixiv.net/users/..."
								/>
							</div>
						</div>
					)}
					<DialogFooter>
						<DialogClose asChild>
							<Button variant="outline">取消</Button>
						</DialogClose>
						<Button onClick={handleEditSave}>儲存</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
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

function BatchActionBar({
	selectedIds,
	allCategories,
	allCreators,
	onDone,
}: {
	selectedIds: Set<string>;
	allCategories: CategoryRecord[];
	allCreators: CreatorRecord[];
	onDone: () => void;
}) {
	const router = useRouter();
	const [catOpen, setCatOpen] = useState(false);
	const [catSearch, setCatSearch] = useState("");
	const [creatorOpen, setCreatorOpen] = useState(false);
	const [creatorSearch, setCreatorSearch] = useState("");
	const [loading, setLoading] = useState(false);

	const batchBindCat = useServerFn(batchBindCategoryFn);
	const batchBindCrt = useServerFn(batchBindCreatorFn);
	const createCat = useServerFn(createCategoryFn);
	const createCrt = useServerFn(createCreatorFn);

	const objectIds = Array.from(selectedIds);

	const catTrimmed = catSearch.trim();
	const catHasExact = allCategories.some(
		(c) => c.name.toLowerCase() === catTrimmed.toLowerCase(),
	);
	const catShowCreate = catTrimmed.length > 0 && !catHasExact;

	const crtTrimmed = creatorSearch.trim();
	const crtHasExact = allCreators.some(
		(c) => c.name.toLowerCase() === crtTrimmed.toLowerCase(),
	);
	const crtShowCreate = crtTrimmed.length > 0 && !crtHasExact;

	async function handleAssignCategory(cat: CategoryRecord) {
		setCatOpen(false);
		setCatSearch("");
		setLoading(true);
		await batchBindCat({ data: { objectIds, categoryId: cat.id } });
		setLoading(false);
		router.invalidate();
		onDone();
	}

	async function handleCreateAndAssignCategory() {
		if (!catTrimmed) return;
		setCatOpen(false);
		setCatSearch("");
		setLoading(true);
		const created = await createCat({ data: { name: catTrimmed } });
		await batchBindCat({ data: { objectIds, categoryId: created.id } });
		setLoading(false);
		router.invalidate();
		onDone();
	}

	async function handleAssignCreator(creator: CreatorRecord) {
		setCreatorOpen(false);
		setCreatorSearch("");
		setLoading(true);
		await batchBindCrt({ data: { objectIds, creatorId: creator.id } });
		setLoading(false);
		router.invalidate();
		onDone();
	}

	async function handleCreateAndAssignCreator() {
		if (!crtTrimmed) return;
		setCreatorOpen(false);
		setCreatorSearch("");
		setLoading(true);
		const created = await createCrt({ data: { name: crtTrimmed } });
		await batchBindCrt({ data: { objectIds, creatorId: created.id } });
		setLoading(false);
		router.invalidate();
		onDone();
	}

	return (
		<div className="mb-4 flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2.5">
			<span className="text-sm font-medium">
				已選取 {selectedIds.size} 個檔案
			</span>
			<div className="flex items-center gap-2">
				{/* Batch Category */}
				<Popover
					open={catOpen}
					onOpenChange={(v) => {
						setCatOpen(v);
						if (!v) setCatSearch("");
					}}
				>
					<PopoverTrigger asChild>
						<Button variant="outline" size="sm" disabled={loading}>
							批次分類
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-52 p-0" align="start">
						<Command shouldFilter={false}>
							<CommandInput
								placeholder="搜尋分類…"
								value={catSearch}
								onValueChange={setCatSearch}
							/>
							<CommandList>
								{allCategories.filter(
									(c) =>
										!catTrimmed ||
										c.name.toLowerCase().includes(catTrimmed.toLowerCase()),
								).length === 0 &&
									!catShowCreate && <CommandEmpty>找不到分類</CommandEmpty>}
								<CommandGroup>
									{allCategories
										.filter(
											(c) =>
												!catTrimmed ||
												c.name.toLowerCase().includes(catTrimmed.toLowerCase()),
										)
										.map((cat) => (
											<CommandItem
												key={cat.id}
												onSelect={() => handleAssignCategory(cat)}
											>
												{cat.name}
											</CommandItem>
										))}
									{catShowCreate && (
										<CommandItem onSelect={handleCreateAndAssignCategory}>
											<PlusIcon className="size-3.5" />
											建立「{catTrimmed}」
										</CommandItem>
									)}
								</CommandGroup>
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>

				{/* Batch Creator */}
				<Popover
					open={creatorOpen}
					onOpenChange={(v) => {
						setCreatorOpen(v);
						if (!v) setCreatorSearch("");
					}}
				>
					<PopoverTrigger asChild>
						<Button variant="outline" size="sm" disabled={loading}>
							批次創作者
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-52 p-0" align="start">
						<Command shouldFilter={false}>
							<CommandInput
								placeholder="搜尋創作者…"
								value={creatorSearch}
								onValueChange={setCreatorSearch}
							/>
							<CommandList>
								{allCreators.filter(
									(c) =>
										!crtTrimmed ||
										c.name.toLowerCase().includes(crtTrimmed.toLowerCase()),
								).length === 0 &&
									!crtShowCreate && <CommandEmpty>找不到創作者</CommandEmpty>}
								<CommandGroup>
									{allCreators
										.filter(
											(c) =>
												!crtTrimmed ||
												c.name.toLowerCase().includes(crtTrimmed.toLowerCase()),
										)
										.map((creator) => (
											<CommandItem
												key={creator.id}
												onSelect={() => handleAssignCreator(creator)}
											>
												@{creator.name}
											</CommandItem>
										))}
									{crtShowCreate && (
										<CommandItem onSelect={handleCreateAndAssignCreator}>
											<PlusIcon className="size-3.5" />
											建立「{crtTrimmed}」
										</CommandItem>
									)}
								</CommandGroup>
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
			</div>
			{loading && (
				<LoaderCircleIcon className="size-4 animate-spin text-muted-foreground" />
			)}
			<Button
				variant="ghost"
				size="sm"
				className="ml-auto"
				onClick={onDone}
				disabled={loading}
			>
				取消選取
			</Button>
		</div>
	);
}

function AdminPage() {
	const {
		items: loaderItems,
		total,
		creators,
		categories,
	} = Route.useLoaderData();
	const { page, perPage } = Route.useSearch();
	const router = useRouter();
	const totalPages = Math.ceil(total / perPage);
	const [files, setFiles] = useState(() => toFileRecords(loaderItems));

	useEffect(() => {
		setFiles(toFileRecords(loaderItems));
	}, [loaderItems]);

	const [selected, setSelected] = useState<Set<string>>(new Set());
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

	const toggleSelect = useCallback((fileId: string) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(fileId)) next.delete(fileId);
			else next.add(fileId);
			return next;
		});
	}, []);

	const selectAll = useCallback(() => {
		setSelected(new Set(files.map((f) => f.id)));
	}, [files]);

	const clearSelection = useCallback(() => {
		setSelected(new Set());
	}, []);

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
			<h1 className="mb-6 text-2xl font-bold tracking-tight">總覽</h1>

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

			{/* Batch Actions */}
			{files.length > 0 && (
				<div className="mb-4 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Checkbox
							checked={
								selected.size === files.length
									? true
									: selected.size > 0
										? "indeterminate"
										: false
							}
							onCheckedChange={(checked) => {
								if (checked) selectAll();
								else clearSelection();
							}}
						/>
						<span className="text-sm text-muted-foreground">全選</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-sm text-muted-foreground">每頁顯示</span>
						<Select
							value={String(perPage)}
							onValueChange={(value) => {
								router.navigate({
									search: { page: 1, perPage: Number(value) },
								});
							}}
						>
							<SelectTrigger className="w-20">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{PER_PAGE_OPTIONS.map((n) => (
									<SelectItem key={n} value={String(n)}>
										{n}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<span className="text-sm text-muted-foreground">筆</span>
					</div>
				</div>
			)}

			{selected.size > 0 && (
				<BatchActionBar
					selectedIds={selected}
					allCategories={categories}
					allCreators={creators}
					onDone={clearSelection}
				/>
			)}

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
							className={`group overflow-hidden rounded-xl border bg-card ${selected.has(file.id) ? "ring-2 ring-primary" : ""}`}
						>
							<div className="relative aspect-video w-full bg-muted">
								<FilePreview
									path={file.path}
									mime={file.metadata.mime}
									alt={file.metadata.originalName}
									optimize
								/>
								<div className="absolute left-2 top-2 flex items-center gap-1">
									<PublicToggle file={file} onTagsChange={handleTagsChange} />
									{file.metadata.mime.startsWith("image/") && (
										<Dialog>
											<Button
												variant="ghost"
												size="icon-xs"
												className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
												title="瀏覽全圖"
												asChild
											>
												<DialogTrigger>
													<ExpandIcon className="size-3.5" />
												</DialogTrigger>
											</Button>
											<DialogContent className="max-w-4xl">
												<DialogHeader>
													<DialogTitle>
														{file.metadata.originalName}
													</DialogTitle>
													<DialogDescription>原始圖片預覽</DialogDescription>
												</DialogHeader>
												<img
													src={`/api/files/${file.path}`}
													alt={file.metadata.originalName}
													className="w-full object-contain"
												/>
											</DialogContent>
										</Dialog>
									)}
								</div>
								<div className="absolute right-2 top-2 flex flex-col items-end gap-1">
									<CategoryEditor
										file={file}
										allCategories={categories}
										onTagsChange={handleTagsChange}
									/>
								</div>
							</div>
							<div className="flex items-start justify-between gap-2 p-3">
								<div className="flex min-w-0 items-start gap-2">
									<Checkbox
										checked={selected.has(file.id)}
										onCheckedChange={() => toggleSelect(file.id)}
										className="mt-0.5 shrink-0"
									/>
									<div className="min-w-0">
										<FileNameEditor
											name={file.metadata.originalName}
											onRename={(n) => handleRename(file.id, n)}
										/>
										<div className="mt-1.5 flex items-center gap-2">
											{getTypeBadge(file.metadata.mime)}
										</div>
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
					))}
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
