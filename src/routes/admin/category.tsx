import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { format, parseISO } from "date-fns";
import {
	CalendarIcon,
	ChevronDownIcon,
	EditIcon,
	FolderTreeIcon,
	PlusIcon,
	Trash2Icon,
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
import { Calendar } from "#/components/ui/calendar";
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
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import {
	type CategoryMetadata,
	type CategoryObject,
	type CategoryRecord,
	createCategory,
	deleteCategory,
	listAllCategoryObjects,
	listCategories,
	updateCategory,
} from "#/lib/storage";

// --- Server Functions ---

const listCategoriesFn = createServerFn({ method: "GET" })
	.inputValidator(z.object({ page: z.number().int().min(1) }))
	.handler(async ({ data: _data }) => {
		const [categories, { categoryObjects, uncategorizedObjects }] =
			await Promise.all([listCategories(), listAllCategoryObjects()]);

		return { categories, uncategorizedObjects, categoryObjects };
	});

const categoryMetadataSchema = z
	.object({
		displayName: z.string().optional(),
		period: z.string().optional(),
	})
	.nullable()
	.optional();

const createCategoryFn = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			name: z.string().min(1),
			metadata: categoryMetadataSchema,
		}),
	)
	.handler(async ({ data }) => {
		return createCategory(data.name, data.metadata);
	});

const updateCategoryFn = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			id: z.string(),
			name: z.string().min(1),
			metadata: categoryMetadataSchema,
		}),
	)
	.handler(async ({ data }) => {
		return updateCategory(data.id, data.name, data.metadata);
	});

const deleteCategoryFn = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		await deleteCategory(data.id);
	});

// --- Route ---

const searchSchema = z.object({
	page: z.coerce.number().int().min(1).catch(1),
});

export const Route = createFileRoute("/admin/category")({
	component: CategoryPage,
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({ page: search.page }),
	loader: ({ deps }) => listCategoriesFn({ data: { page: deps.page } }),
});

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

function DatePicker({
	value,
	onChange,
	placeholder,
}: {
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
}) {
	const [open, setOpen] = useState(false);
	const selected = value ? parseISO(value) : undefined;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className="w-full justify-start text-left font-normal"
				>
					<CalendarIcon className="mr-2 size-4" />
					{selected ? (
						format(selected, "yyyy-MM-dd")
					) : (
						<span className="text-muted-foreground">{placeholder}</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={selected}
					onSelect={(date) => {
						onChange(date ? format(date, "yyyy-MM-dd") : "");
						setOpen(false);
					}}
				/>
			</PopoverContent>
		</Popover>
	);
}

function CategoryPage() {
	const loaderData = Route.useLoaderData();
	const router = useRouter();

	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<CategoryRecord | null>(null);
	const [formName, setFormName] = useState("");
	const [formDisplayName, setFormDisplayName] = useState("");
	const [formPeriodStart, setFormPeriodStart] = useState("");
	const [formPeriodEnd, setFormPeriodEnd] = useState("");
	const [deleteTarget, setDeleteTarget] = useState<CategoryRecord | null>(null);

	const createCat = useServerFn(createCategoryFn);
	const updateCat = useServerFn(updateCategoryFn);
	const deleteCat = useServerFn(deleteCategoryFn);

	const { categories, categoryObjects } = loaderData;

	function parsePeriod(period?: string): { start: string; end: string } {
		if (!period) return { start: "", end: "" };
		const parts = period.split(",");
		return { start: parts[0] ?? "", end: parts[1] ?? "" };
	}

	function buildMetadata(): CategoryMetadata | null {
		const meta: CategoryMetadata = {};
		if (formDisplayName.trim()) meta.displayName = formDisplayName.trim();
		const start = formPeriodStart.trim();
		const end = formPeriodEnd.trim();
		if (start) {
			meta.period = end ? `${start},${end}` : start;
		}
		return Object.keys(meta).length > 0 ? meta : null;
	}

	function openCreate() {
		setEditTarget(null);
		setFormName("");
		setFormDisplayName("");
		setFormPeriodStart("");
		setFormPeriodEnd("");
		setEditDialogOpen(true);
	}

	function openEdit(cat: CategoryRecord) {
		setEditTarget(cat);
		setFormName(cat.name);
		setFormDisplayName(cat.metadata?.displayName ?? "");
		const { start, end } = parsePeriod(cat.metadata?.period);
		setFormPeriodStart(start);
		setFormPeriodEnd(end);
		setEditDialogOpen(true);
	}

	async function handleSave() {
		if (!formName.trim()) return;
		const metadata = buildMetadata();
		try {
			if (editTarget) {
				await updateCat({
					data: { id: editTarget.id, name: formName.trim(), metadata },
				});
			} else {
				await createCat({ data: { name: formName.trim(), metadata } });
			}
			setEditDialogOpen(false);
			router.invalidate();
		} catch {
			toast.error(editTarget ? "分類更新失敗" : "分類新增失敗");
		}
	}

	async function handleDelete() {
		if (!deleteTarget) return;
		try {
			await deleteCat({ data: { id: deleteTarget.id } });
			setDeleteTarget(null);
			router.invalidate();
		} catch {
			toast.error("分類刪除失敗");
		}
	}

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
						const bound = (categoryObjects[cat.id] ?? []) as CategoryObject[];
						return (
							<AccordionItem key={cat.id} value={cat.id}>
								<AccordionPrimitive.Header className="flex items-center">
									<AccordionPrimitive.Trigger className="flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&[data-state=open]>svg]:rotate-180">
										<div className="flex flex-1 items-center gap-3">
											<span className="font-medium">{cat.name}</span>
											{cat.metadata?.displayName && (
												<span className="text-xs text-muted-foreground">
													({cat.metadata.displayName})
												</span>
											)}
											<Badge variant="secondary">{cat.objectCount}</Badge>
											{cat.metadata?.period && (
												<span className="text-xs text-muted-foreground">
													{cat.metadata.period.includes(",")
														? cat.metadata.period.replace(",", " ～ ")
														: cat.metadata.period}
												</span>
											)}
										</div>
										<ChevronDownIcon className="pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-200" />
									</AccordionPrimitive.Trigger>
									<Button
										variant="ghost"
										size="icon-xs"
										onClick={() => openEdit(cat)}
										title="編輯"
									>
										<EditIcon className="size-3.5" />
									</Button>
									<Button
										variant="ghost"
										size="icon-xs"
										onClick={() => setDeleteTarget(cat)}
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
						<DialogTitle>{editTarget ? "編輯分類" : "新增分類"}</DialogTitle>
						<DialogDescription>
							{editTarget
								? "修改分類的名稱"
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
								placeholder="例如：獸無限 2026"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="cat-display-name">顯示名稱</Label>
							<Input
								id="cat-display-name"
								value={formDisplayName}
								onChange={(e) => setFormDisplayName(e.target.value)}
								placeholder="前台顯示用，留空則使用名稱"
							/>
						</div>
						<div className="grid gap-2">
							<Label>活動期間</Label>
							<div className="grid items-center gap-2">
								<DatePicker
									value={formPeriodStart}
									onChange={setFormPeriodStart}
									placeholder="開始日期"
								/>
								<DatePicker
									value={formPeriodEnd}
									onChange={setFormPeriodEnd}
									placeholder="結束日期（留空為單日）"
								/>
							</div>
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
