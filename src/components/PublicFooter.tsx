import { Share2 } from "lucide-react";

export default function PublicFooter({ appName }: { appName: string }) {
	return (
		<footer className="bg-surface w-full py-12 border-t border-outline-variant/15">
			<div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto w-full gap-8">
				<div className="flex flex-col gap-2">
					<div className="text-lg font-bold text-on-surface">{appName}</div>
					<p className="text-sm tracking-wide text-on-surface-variant">
						© {new Date().getFullYear()} All rights reserved.
					</p>
				</div>
				<div className="flex gap-4">
					<button
						type="button"
						className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
					>
						<Share2 className="w-5 h-5" />
					</button>
				</div>
			</div>
		</footer>
	);
}
