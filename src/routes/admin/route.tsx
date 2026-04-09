import { createFileRoute, Outlet } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import AdminHeader from "#/components/AdminHeader";
import { getAppName } from "#/lib/app-name";

const loadAdminLayoutFn = createServerFn({ method: "GET" }).handler(
	async () => {
		return { appName: getAppName() };
	},
);

export const Route = createFileRoute("/admin")({
	component: AdminLayout,
	loader: () => loadAdminLayoutFn(),
});

function AdminLayout() {
	const { appName } = Route.useLoaderData();
	return (
		<>
			<AdminHeader appName={appName} />
			<main className="page-wrap px-4 pb-8 pt-14">
				<div className="mx-auto max-w-5xl">
					<Outlet />
				</div>
			</main>
		</>
	);
}
