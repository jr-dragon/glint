import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
	component: AdminLayout,
});

function AdminLayout() {
	return (
		<main className="page-wrap px-4 pb-8 pt-14">
			<div className="mx-auto max-w-5xl">
				<Outlet />
			</div>
		</main>
	);
}
