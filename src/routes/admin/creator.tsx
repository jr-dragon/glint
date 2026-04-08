import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import {
	ChevronDownIcon,
	EditIcon,
	PlusIcon,
	Trash2Icon,
	UsersIcon,
} from "lucide-react";
import { Accordion as AccordionPrimitive } from "radix-ui";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod/v4";
import { FilePreview } from "#/components/FilePreview";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
} from "#/components/ui/accordion";
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
import { Card } from "#/components/ui/card";

import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "#/components/ui/carousel";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "#/components/ui/empty";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	type CategoryObject,
	type CreatorRecord,
	createCreator,
	deleteCreator,
	listCreators,
	listFiles,
	updateCreator,
} from "#/lib/storage";

// --- Server Functions ---

const listCreatorsFn = createServerFn({ method: "GET" })
	.inputValidator(z.object({ page: z.number().int().min(1) }))
	.handler(async ({ data }) => {
		const [creators, { items, total }] = await Promise.all([
			listCreators(),
			listFiles(data.page),
		]);
		return { creators, objects: items, total };
	});

const createCreatorFn = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			name: z.string().min(1),
			metadata: z.record(z.string(), z.string()).nullable().optional(),
		}),
	)
	.handler(async ({ data }) => {
		return createCreator(data.name, data.metadata);
	});

const updateCreatorFn = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			id: z.string(),
			name: z.string().min(1),
			metadata: z.record(z.string(), z.string()).nullable().optional(),
		}),
	)
	.handler(async ({ data }) => {
		return updateCreator(data.id, data.name, data.metadata);
	});

const deleteCreatorFn = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		await deleteCreator(data.id);
	});

// --- Route ---

const searchSchema = z.object({
	page: z.coerce.number().int().min(1).catch(1),
});

export const Route = createFileRoute("/admin/creator")({
	component: CreatorPage,
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({ page: search.page }),
	loader: ({ deps }) => listCreatorsFn({ data: { page: deps.page } }),
});

// --- Types ---

interface MetadataFields {
	facebook?: string;
	twitter?: string;
	pixiv?: string;
}

// --- Components ---

function ObjectCarousel({ objects }: { objects: CategoryObject[] }) {
	return (
		<Carousel opts={{ align: "start" }} className="mx-auto w-full">
			<CarouselContent>
				{objects.map((obj) => (
					<CarouselItem
						key={obj.id}
						className="basis-1/2 sm:basis-1/3 lg:basis-1/4"
					>
						<Card className="overflow-hidden">
							<div className="aspect-video w-full">
								<FilePreview
									path={obj.path}
									mime={obj.metadata.mime}
									alt={obj.metadata.originalName}
								/>
							</div>
							<div className="px-3 py-2">
								<span className="truncate text-sm font-medium">
									{obj.metadata.originalName}
								</span>
							</div>
						</Card>
					</CarouselItem>
				))}
			</CarouselContent>
			<CarouselPrevious className="-left-4" />
			<CarouselNext className="-right-4" />
		</Carousel>
	);
}

function CreatorPage() {
	const loaderData = Route.useLoaderData();
	const router = useRouter();

	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<CreatorRecord | null>(null);
	const [formName, setFormName] = useState("");
	const [formFacebook, setFormFacebook] = useState("");
	const [formTwitter, setFormTwitter] = useState("");
	const [formPixiv, setFormPixiv] = useState("");
	const [deleteTarget, setDeleteTarget] = useState<CreatorRecord | null>(null);

	const createCrt = useServerFn(createCreatorFn);
	const updateCrt = useServerFn(updateCreatorFn);
	const deleteCrt = useServerFn(deleteCreatorFn);

	const { creators, objects } = loaderData;

	function buildMetadata(): Record<string, string> | null {
		const meta: Record<string, string> = {};
		if (formFacebook.trim()) meta.facebook = formFacebook.trim();
		if (formTwitter.trim()) meta.twitter = formTwitter.trim();
		if (formPixiv.trim()) meta.pixiv = formPixiv.trim();
		return Object.keys(meta).length > 0 ? meta : null;
	}

	function openCreate() {
		setEditTarget(null);
		setFormName("");
		setFormFacebook("");
		setFormTwitter("");
		setFormPixiv("");
		setEditDialogOpen(true);
	}

	function openEdit(creator: CreatorRecord) {
		setEditTarget(creator);
		setFormName(creator.name);
		const meta = (creator.metadata ?? {}) as MetadataFields;
		setFormFacebook(meta.facebook ?? "");
		setFormTwitter(meta.twitter ?? "");
		setFormPixiv(meta.pixiv ?? "");
		setEditDialogOpen(true);
	}

	async function handleSave() {
		if (!formName.trim()) return;
		const metadata = buildMetadata();
		try {
			if (editTarget) {
				await updateCrt({
					data: { id: editTarget.id, name: formName.trim(), metadata },
				});
			} else {
				await createCrt({ data: { name: formName.trim(), metadata } });
			}
			setEditDialogOpen(false);
			router.invalidate();
		} catch {
			toast.error(editTarget ? "創作者更新失敗" : "創作者新增失敗");
		}
	}

	async function handleDelete() {
		if (!deleteTarget) return;
		try {
			await deleteCrt({ data: { id: deleteTarget.id } });
			setDeleteTarget(null);
			router.invalidate();
		} catch {
			toast.error("創作者刪除失敗");
		}
	}

	// Build per-creator bound objects from the loaded objects
	const creatorBoundObjects: Record<string, CategoryObject[]> = {};
	for (const creator of creators) {
		creatorBoundObjects[creator.id] = [];
	}
	for (const obj of objects) {
		const tags = (obj as { tags?: { name: string; id: string }[] }).tags ?? [];
		for (const tag of tags) {
			if (creatorBoundObjects[tag.id]) {
				creatorBoundObjects[tag.id].push({
					id: obj.id,
					path: obj.path,
					metadata: obj.metadata as CategoryObject["metadata"],
				});
			}
		}
	}

	return (
		<>
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-bold tracking-tight">創作者管理</h1>
				<Button size="sm" onClick={openCreate}>
					<PlusIcon className="size-4" />
					新增創作者
				</Button>
			</div>

			{creators.length === 0 ? (
				<Empty className="border">
					<UsersIcon className="size-10 text-muted-foreground" />
					<EmptyHeader>
						<EmptyTitle>尚無創作者</EmptyTitle>
						<EmptyDescription>建立創作者來標記你的媒體檔案</EmptyDescription>
					</EmptyHeader>
					<Button size="sm" onClick={openCreate}>
						<PlusIcon className="size-4" />
						新增創作者
					</Button>
				</Empty>
			) : (
				<Accordion type="single" collapsible className="rounded-xl border px-4">
					{creators.map((creator) => {
						const bound = creatorBoundObjects[creator.id] ?? [];
						const meta = (creator.metadata ?? {}) as MetadataFields;
						return (
							<AccordionItem key={creator.id} value={creator.id}>
								<AccordionPrimitive.Header className="flex items-center">
									<AccordionPrimitive.Trigger className="flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&[data-state=open]>svg]:rotate-180">
										<div className="flex flex-1 items-center gap-3">
											<span className="font-medium">{creator.name}</span>
											<Badge variant="secondary">{creator.objectCount}</Badge>
											{meta.facebook && (
												<a
													href={meta.facebook}
													target="_blank"
													rel="noopener noreferrer"
													className="text-xs text-muted-foreground hover:underline"
													onClick={(e) => e.stopPropagation()}
												>
													Facebook
												</a>
											)}
											{meta.twitter && (
												<a
													href={meta.twitter}
													target="_blank"
													rel="noopener noreferrer"
													className="text-xs text-muted-foreground hover:underline"
													onClick={(e) => e.stopPropagation()}
												>
													Twitter
												</a>
											)}
											{meta.pixiv && (
												<a
													href={meta.pixiv}
													target="_blank"
													rel="noopener noreferrer"
													className="text-xs text-muted-foreground hover:underline"
													onClick={(e) => e.stopPropagation()}
												>
													Pixiv
												</a>
											)}
										</div>
										<ChevronDownIcon className="pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-200" />
									</AccordionPrimitive.Trigger>
									<Button
										variant="ghost"
										size="icon-xs"
										onClick={() => openEdit(creator)}
										title="編輯"
									>
										<EditIcon className="size-3.5" />
									</Button>
									<Button
										variant="ghost"
										size="icon-xs"
										onClick={() => setDeleteTarget(creator)}
										title="刪除"
									>
										<Trash2Icon className="size-3.5 text-destructive" />
									</Button>
								</AccordionPrimitive.Header>
								<AccordionContent>
									<div className="px-2">
										{bound.length === 0 ? (
											<p className="text-sm text-muted-foreground">
												尚未綁定任何物件
											</p>
										) : (
											<ObjectCarousel objects={bound} />
										)}
									</div>
								</AccordionContent>
							</AccordionItem>
						);
					})}
				</Accordion>
			)}

			{/* Create / Edit Dialog */}
			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editTarget ? "編輯創作者" : "新增創作者"}
						</DialogTitle>
						<DialogDescription>
							{editTarget
								? "修改創作者的名稱與社群資訊"
								: "建立一個新的創作者來標記你的媒體檔案"}
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-2">
						<div className="grid gap-2">
							<Label htmlFor="creator-name">名稱</Label>
							<Input
								id="creator-name"
								value={formName}
								onChange={(e) => setFormName(e.target.value)}
								placeholder="例如：張三"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="creator-facebook">Facebook</Label>
							<Input
								id="creator-facebook"
								value={formFacebook}
								onChange={(e) => setFormFacebook(e.target.value)}
								placeholder="https://www.facebook.com/..."
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="creator-twitter">Twitter / X</Label>
							<Input
								id="creator-twitter"
								value={formTwitter}
								onChange={(e) => setFormTwitter(e.target.value)}
								placeholder="https://x.com/..."
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="creator-pixiv">Pixiv</Label>
							<Input
								id="creator-pixiv"
								value={formPixiv}
								onChange={(e) => setFormPixiv(e.target.value)}
								placeholder="https://www.pixiv.net/users/..."
							/>
						</div>
					</div>
					<DialogFooter>
						<DialogClose asChild>
							<Button variant="outline">取消</Button>
						</DialogClose>
						<Button onClick={handleSave} disabled={!formName.trim()}>
							{editTarget ? "儲存" : "新增"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation */}
			<AlertDialog
				open={!!deleteTarget}
				onOpenChange={(open) => !open && setDeleteTarget(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>確認刪除</AlertDialogTitle>
						<AlertDialogDescription>
							即將刪除創作者「{deleteTarget?.name}
							」，已綁定的物件將被解除關聯。此操作無法復原，確定要繼續嗎？
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
