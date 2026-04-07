import { createFileRoute } from "@tanstack/react-router";
import {
	EditIcon,
	FileIcon,
	FolderTreeIcon,
	LinkIcon,
	Music2Icon,
	PlusIcon,
	Trash2Icon,
	UnlinkIcon,
	VideoIcon,
} from "lucide-react";
import { useState } from "react";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
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
import { Textarea } from "#/components/ui/textarea";

export const Route = createFileRoute("/admin/category")({
	component: CategoryPage,
});

interface Category {
	id: string;
	name: string;
	description: string;
	objectCount: number;
}

interface ObjectRecord {
	id: string;
	name: string;
	path: string;
	mime: string;
	categoryId: string | null;
}

const INITIAL_CATEGORIES: Category[] = [
	{
		id: "cat-1",
		name: "人像",
		description: "人物肖像與生活照",
		objectCount: 3,
	},
	{
		id: "cat-2",
		name: "風景",
		description: "自然風光與城市景觀",
		objectCount: 2,
	},
	{
		id: "cat-3",
		name: "音樂",
		description: "音樂相關檔案與素材",
		objectCount: 0,
	},
];

const INITIAL_OBJECTS: ObjectRecord[] = [
	{
		id: "obj-1",
		name: "portrait-01.jpg",
		path: "img/portrait-01.jpg",
		mime: "image/jpeg",
		categoryId: "cat-1",
	},
	{
		id: "obj-2",
		name: "portrait-02.jpg",
		path: "img/portrait-02.jpg",
		mime: "image/jpeg",
		categoryId: "cat-1",
	},
	{
		id: "obj-3",
		name: "selfie.png",
		path: "img/selfie.png",
		mime: "image/png",
		categoryId: "cat-1",
	},
	{
		id: "obj-4",
		name: "sunset.jpg",
		path: "img/sunset.jpg",
		mime: "image/jpeg",
		categoryId: "cat-2",
	},
	{
		id: "obj-5",
		name: "city-night.jpg",
		path: "img/city-night.jpg",
		mime: "image/jpeg",
		categoryId: "cat-2",
	},
	{
		id: "obj-6",
		name: "demo-video.mp4",
		path: "vid/demo-video.mp4",
		mime: "video/mp4",
		categoryId: null,
	},
	{
		id: "obj-7",
		name: "notes.pdf",
		path: "doc/notes.pdf",
		mime: "application/pdf",
		categoryId: null,
	},
];

function ObjectPreview({ mime }: { mime: string }) {
	if (mime.startsWith("image/")) {
		return (
			<div className="flex size-full items-center justify-center bg-muted/50 text-muted-foreground">
				<FileIcon className="size-6" />
			</div>
		);
	}
	if (mime.startsWith("video/")) {
		return (
			<div className="flex size-full items-center justify-center bg-muted/50 text-muted-foreground">
				<VideoIcon className="size-6" />
			</div>
		);
	}
	if (mime.startsWith("audio/")) {
		return (
			<div className="flex size-full items-center justify-center bg-muted/50 text-muted-foreground">
				<Music2Icon className="size-6" />
			</div>
		);
	}
	return (
		<div className="flex size-full items-center justify-center bg-muted/50 text-muted-foreground">
			<FileIcon className="size-6" />
		</div>
	);
}

function CategoryPage() {
	const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
	const [objects, setObjects] = useState<ObjectRecord[]>(INITIAL_OBJECTS);

	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<Category | null>(null);
	const [formName, setFormName] = useState("");
	const [formDescription, setFormDescription] = useState("");

	const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

	function openCreate() {
		setEditTarget(null);
		setFormName("");
		setFormDescription("");
		setEditDialogOpen(true);
	}

	function openEdit(cat: Category) {
		setEditTarget(cat);
		setFormName(cat.name);
		setFormDescription(cat.description);
		setEditDialogOpen(true);
	}

	function handleSave() {
		if (!formName.trim()) return;

		if (editTarget) {
			setCategories((prev) =>
				prev.map((c) =>
					c.id === editTarget.id
						? {
								...c,
								name: formName.trim(),
								description: formDescription.trim(),
							}
						: c,
				),
			);
		} else {
			const newCat: Category = {
				id: `cat-${Date.now()}`,
				name: formName.trim(),
				description: formDescription.trim(),
				objectCount: 0,
			};
			setCategories((prev) => [...prev, newCat]);
		}
		setEditDialogOpen(false);
	}

	function handleDelete() {
		if (!deleteTarget) return;
		setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
		setObjects((prev) =>
			prev.map((o) =>
				o.categoryId === deleteTarget.id ? { ...o, categoryId: null } : o,
			),
		);
		setDeleteTarget(null);
	}

	function handleBind(categoryId: string, objectId: string) {
		setObjects((prev) =>
			prev.map((o) => (o.id === objectId ? { ...o, categoryId } : o)),
		);
		setCategories((prev) =>
			prev.map((c) =>
				c.id === categoryId ? { ...c, objectCount: c.objectCount + 1 } : c,
			),
		);
	}

	function handleUnbind(categoryId: string, objectId: string) {
		setObjects((prev) =>
			prev.map((o) => (o.id === objectId ? { ...o, categoryId: null } : o)),
		);
		setCategories((prev) =>
			prev.map((c) =>
				c.id === categoryId ? { ...c, objectCount: c.objectCount - 1 } : c,
			),
		);
	}

	const unboundObjects = objects.filter((o) => o.categoryId === null);

	return (
		<>
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-bold tracking-tight">分類管理</h1>
				<Button size="sm" onClick={openCreate}>
					<PlusIcon className="size-4" />
					新增分類
				</Button>
			</div>

			{categories.length === 0 ? (
				<Empty className="border">
					<FolderTreeIcon className="size-10 text-muted-foreground" />
					<EmptyHeader>
						<EmptyTitle>尚無分類</EmptyTitle>
						<EmptyDescription>建立分類來組織你的媒體檔案</EmptyDescription>
					</EmptyHeader>
					<Button size="sm" onClick={openCreate}>
						<PlusIcon className="size-4" />
						新增分類
					</Button>
				</Empty>
			) : (
				<Accordion type="single" collapsible className="rounded-xl border px-4">
					{categories.map((cat) => {
						const bound = objects.filter((o) => o.categoryId === cat.id);
						return (
							<AccordionItem key={cat.id} value={cat.id}>
								<AccordionTrigger>
									<div className="flex flex-1 items-center gap-3">
										<span className="font-medium">{cat.name}</span>
										{cat.description && (
											<span className="hidden text-muted-foreground sm:inline">
												{cat.description}
											</span>
										)}
										<Badge variant="secondary">{cat.objectCount}</Badge>
									</div>
									<span className="flex items-center gap-1">
										<Button
											variant="ghost"
											size="icon-xs"
											onClick={(e) => {
												e.stopPropagation();
												openEdit(cat);
											}}
											title="編輯"
										>
											<EditIcon className="size-3.5" />
										</Button>
										<Button
											variant="ghost"
											size="icon-xs"
											onClick={(e) => {
												e.stopPropagation();
												setDeleteTarget(cat);
											}}
											title="刪除"
										>
											<Trash2Icon className="size-3.5 text-destructive" />
										</Button>
									</span>
								</AccordionTrigger>
								<AccordionContent>
									<div className="grid gap-6 px-2">
										{/* Bound objects */}
										<div>
											<h4 className="mb-3 text-sm font-medium">
												已分類（{bound.length}）
											</h4>
											{bound.length === 0 ? (
												<p className="text-sm text-muted-foreground">
													尚未綁定任何物件
												</p>
											) : (
												<Carousel
													opts={{ align: "start" }}
													className="mx-auto w-full"
												>
													<CarouselContent>
														{bound.map((obj) => (
															<CarouselItem
																key={obj.id}
																className="basis-1/2 sm:basis-1/3 lg:basis-1/4"
															>
																<Card className="group overflow-hidden">
																	<div className="aspect-video w-full">
																		<ObjectPreview mime={obj.mime} />
																	</div>
																	<div className="flex items-center justify-between gap-2 px-3 py-2">
																		<span className="truncate text-sm font-medium">
																			{obj.name}
																		</span>
																		<Button
																			variant="ghost"
																			size="icon-xs"
																			className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
																			onClick={() =>
																				handleUnbind(cat.id, obj.id)
																			}
																			title="解除綁定"
																		>
																			<UnlinkIcon className="size-3.5 text-destructive" />
																		</Button>
																	</div>
																</Card>
															</CarouselItem>
														))}
													</CarouselContent>
													<CarouselPrevious className="-left-4" />
													<CarouselNext className="-right-4" />
												</Carousel>
											)}
										</div>

										{/* Unbound objects */}
										<div>
											<h4 className="mb-3 text-sm font-medium">
												未分類（{unboundObjects.length}）
											</h4>
											{unboundObjects.length === 0 ? (
												<p className="text-sm text-muted-foreground">
													所有物件皆已分類
												</p>
											) : (
												<Carousel
													opts={{ align: "start" }}
													className="mx-auto w-full"
												>
													<CarouselContent>
														{unboundObjects.map((obj) => (
															<CarouselItem
																key={obj.id}
																className="basis-1/2 sm:basis-1/3 lg:basis-1/4"
															>
																<Card className="group overflow-hidden">
																	<div className="aspect-video w-full">
																		<ObjectPreview mime={obj.mime} />
																	</div>
																	<div className="flex items-center justify-between gap-2 px-3 py-2">
																		<span className="truncate text-sm font-medium">
																			{obj.name}
																		</span>
																		<Button
																			variant="ghost"
																			size="icon-xs"
																			className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
																			onClick={() => handleBind(cat.id, obj.id)}
																			title="綁定至此分類"
																		>
																			<LinkIcon className="size-3.5" />
																		</Button>
																	</div>
																</Card>
															</CarouselItem>
														))}
													</CarouselContent>
													<CarouselPrevious className="-left-4" />
													<CarouselNext className="-right-4" />
												</Carousel>
											)}
										</div>
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
						<DialogTitle>{editTarget ? "編輯分類" : "新增分類"}</DialogTitle>
						<DialogDescription>
							{editTarget
								? "修改分類的名稱與描述"
								: "建立一個新的分類來組織你的媒體檔案"}
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-2">
						<div className="grid gap-2">
							<Label htmlFor="cat-name">名稱</Label>
							<Input
								id="cat-name"
								value={formName}
								onChange={(e) => setFormName(e.target.value)}
								placeholder="例如：人像、風景"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="cat-desc">描述</Label>
							<Textarea
								id="cat-desc"
								value={formDescription}
								onChange={(e) => setFormDescription(e.target.value)}
								placeholder="選填，簡短描述此分類的用途"
								rows={3}
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
							即將刪除分類「{deleteTarget?.name}
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
