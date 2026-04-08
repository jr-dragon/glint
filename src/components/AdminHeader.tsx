import { Link } from "@tanstack/react-router";
import { HomeIcon } from "lucide-react";
import { Button } from "#/components/ui/button";
import ThemeToggle from "./ThemeToggle";

const navItems = [
	{ to: "/admin", label: "檔案管理" },
	{ to: "/admin/category", label: "分類管理" },
	{ to: "/admin/creator", label: "創作者管理" },
] as const;

export default function AdminHeader() {
	return (
		<header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
			<nav className="page-wrap flex items-center gap-3 py-3 sm:py-4">
				<h2 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
					<Link
						to="/admin"
						className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-4 sm:py-2"
					>
						<span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
						Glint Admin
					</Link>
				</h2>

				<div className="flex items-center gap-x-4 text-sm font-semibold">
					{navItems.map((item) => (
						<Link
							key={item.to}
							to={item.to}
							className="nav-link"
							activeOptions={{ exact: true }}
							activeProps={{ className: "nav-link is-active" }}
						>
							{item.label}
						</Link>
					))}
				</div>

				<div className="ml-auto flex items-center gap-2">
					<ThemeToggle />
					<Button variant="outline" size="sm" asChild>
						<Link to="/">
							<HomeIcon className="size-4" />
							回到主頁
						</Link>
					</Button>
				</div>
			</nav>
		</header>
	);
}
