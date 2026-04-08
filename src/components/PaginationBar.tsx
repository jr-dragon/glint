import { Link } from "@tanstack/react-router";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "#/components/ui/pagination";

interface PaginationBarProps {
	page: number;
	totalPages: number;
}

type PageItem = number | "ellipsis-start" | "ellipsis-end";

function getPageNumbers(page: number, totalPages: number): PageItem[] {
	if (totalPages <= 7) {
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}
	const pages: PageItem[] = [1];
	if (page > 3) pages.push("ellipsis-start");
	for (
		let i = Math.max(2, page - 1);
		i <= Math.min(totalPages - 1, page + 1);
		i++
	) {
		pages.push(i);
	}
	if (page < totalPages - 2) pages.push("ellipsis-end");
	pages.push(totalPages);
	return pages;
}

export function PaginationBar({ page, totalPages }: PaginationBarProps) {
	if (totalPages <= 1) return null;

	const pages = getPageNumbers(page, totalPages);

	return (
		<Pagination className="mt-8">
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						asChild={page > 1}
						aria-disabled={page <= 1}
						className={page <= 1 ? "pointer-events-none opacity-50" : ""}
					>
						{page > 1 ? (
							<Link to="." search={{ page: page - 1 }}>
								{null}
							</Link>
						) : (
							<span />
						)}
					</PaginationPrevious>
				</PaginationItem>
				{pages.map((p) =>
					typeof p === "string" ? (
						<PaginationItem key={p}>
							<PaginationEllipsis />
						</PaginationItem>
					) : (
						<PaginationItem key={p}>
							<PaginationLink asChild isActive={p === page}>
								<Link to="." search={{ page: p }}>
									{p}
								</Link>
							</PaginationLink>
						</PaginationItem>
					),
				)}
				<PaginationItem>
					<PaginationNext
						asChild={page < totalPages}
						aria-disabled={page >= totalPages}
						className={
							page >= totalPages ? "pointer-events-none opacity-50" : ""
						}
					>
						{page < totalPages ? (
							<Link to="." search={{ page: page + 1 }}>
								{null}
							</Link>
						) : (
							<span />
						)}
					</PaginationNext>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}
