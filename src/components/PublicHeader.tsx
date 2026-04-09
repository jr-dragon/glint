import { Link, useMatch } from "@tanstack/react-router";

export default function PublicHeader({ appName }: { appName: string }) {
	const isHome = useMatch({ from: "/", shouldThrow: false });

	return (
		<nav className="fixed top-0 w-full z-50 bg-surface/60 backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex justify-between items-center px-8 py-4 tracking-tight">
			{isHome ? (
				<div className="text-2xl font-bold tracking-tighter text-primary">
					{appName}
				</div>
			) : (
				<Link
					to="/"
					className="text-2xl font-bold tracking-tighter text-primary"
				>
					{appName}
				</Link>
			)}
		</nav>
	);
}
