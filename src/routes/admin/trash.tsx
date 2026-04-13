import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { RotateCcwIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
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
import { Button } from "#/components/ui/button";
import {
	listDeletedFiles,
	permanentlyDeleteFile,
	restoreFile,
} from "#/lib/storage";

// --- Server Functions ---

const loadTrashFn = createServerFn({ method: "GET" })
	.inputValidator(z.object({ page: z.number().int().min(1).default(1) }))
	.handler(async ({ data }) => {
		return listDeletedFiles(data.page, 12);
	});

const restoreFileFn = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		await restoreFile(data.id);
	});

const permanentlyDeleteFileFn = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		await permanentlyDeleteFile(data.id);
	});

// --- Route ---

export const Route = createFileRoute("/admin/trash")({
	component: TrashPage,
	validateSearch: z.object({ page: z.number().int().min(1).default(1) }),
	loaderDeps: ({ search }) => ({ page: search.page }),
	loader: ({ deps }) => loadTrashFn({ data: { page: deps.page } }),
});

function TrashPage() {
	const { items, total } = Route.useLoaderData();
	const { page } = Route.useSearch();
	const router = useRouter();
	const perPage = 12;
	const totalPages = Math.ceil(total / perPage);

	const restoreFn = useServerFn(restoreFileFn);
	const deletePermanentlyFn = useServerFn(permanentlyDeleteFileFn);

	const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
	const [loadingId, setLoadingId] = useState<string | null>(null);

	async function handleRestore(id: string) {
		setLoadingId(id);
		await restoreFn({ data: { id } });
		setLoadingId(null);
		router.invalidate();
	}

	async function handlePermanentDelete(id: string) {
		setLoadingId(id);
		await deletePermanentlyFn({ data: { id } });
		setLoadingId(null);
		setPendingDeleteId(null);
		router.invalidate();
	}

	return (
		<div className="py-6">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">回收站</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						共 {total} 個已刪除的檔案
					</p>
				</div>
			</div>

			{items.length === 0 ? (
				<div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-muted-foreground">
					<Trash2Icon className="size-10" />
					<p className="text-sm">回收站是空的</p>
				</div>
			) : (
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
					{items.map((item) => {
						const meta = item.metadata as {
							mime: string;
							size: number;
							originalName: string;
						};
						const deletedAt = item.deleted_at
							? new Date(item.deleted_at).toLocaleString("zh-TW", {
									year: "numeric",
									month: "2-digit",
									day: "2-digit",
									hour: "2-digit",
									minute: "2-digit",
								})
							: null;

						return (
							<div
								key={item.id}
								className="group relative overflow-hidden rounded-lg border bg-card"
							>
								{/* Preview */}
								<div className="aspect-square w-full overflow-hidden bg-muted">
									<FilePreview
										path={item.path}
										mime={meta.mime}
										alt={meta.originalName}
										optimize
									/>
								</div>

								{/* Info */}
								<div className="p-2">
									<p
										className="truncate text-xs font-medium"
										title={meta.originalName}
									>
										{meta.originalName}
									</p>
									{deletedAt && (
										<p className="mt-0.5 text-xs text-muted-foreground">
											刪除於 {deletedAt}
										</p>
									)}
								</div>

								{/* Actions */}
								<div className="flex gap-1 border-t p-2">
									<Button
										variant="outline"
										size="sm"
										className="h-7 flex-1 gap-1 text-xs"
										disabled={loadingId === item.id}
										onClick={() => handleRestore(item.id)}
									>
										<RotateCcwIcon className="size-3" />
										還原
									</Button>
									<Button
										variant="destructive"
										size="sm"
										className="h-7 flex-1 gap-1 text-xs"
										disabled={loadingId === item.id}
										onClick={() => setPendingDeleteId(item.id)}
									>
										<Trash2Icon className="size-3" />
										永久刪除
									</Button>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{totalPages > 1 && (
				<div className="mt-6">
					<PaginationBar page={page} totalPages={totalPages} />
				</div>
			)}

			{/* Confirm permanent delete dialog */}
			<AlertDialog
				open={pendingDeleteId !== null}
				onOpenChange={(open) => {
					if (!open) setPendingDeleteId(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>永久刪除確認</AlertDialogTitle>
						<AlertDialogDescription>
							此操作無法復原，檔案將從儲存空間中永久移除。確定要繼續嗎？
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>取消</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={() => {
								if (pendingDeleteId) handlePermanentDelete(pendingDeleteId);
							}}
						>
							永久刪除
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
