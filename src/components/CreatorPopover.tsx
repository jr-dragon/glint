import type { ReactNode } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";

const socialLinks: {
	key: string;
	label: string;
	icon: ReactNode;
}[] = [
	{
		key: "twitter",
		label: "Twitter / X",
		icon: (
			<svg
				viewBox="0 0 24 24"
				className="w-4 h-4 fill-current"
				role="img"
				aria-label="Twitter / X"
			>
				<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
			</svg>
		),
	},
	{
		key: "pixiv",
		label: "Pixiv",
		icon: (
			<svg
				viewBox="0 0 24 24"
				className="w-4 h-4 fill-current"
				role="img"
				aria-label="Pixiv"
			>
				<path d="M4.935 0A4.924 4.924 0 0 0 0 4.935v14.13A4.924 4.924 0 0 0 4.935 24h14.13A4.924 4.924 0 0 0 24 19.065V4.935A4.924 4.924 0 0 0 19.065 0zm7.81 4.547c2.181 0 4.058.676 5.399 1.847a6.118 6.118 0 0 1 2.116 4.66c.005 1.854-.88 3.476-2.257 4.563-1.375 1.09-3.215 1.779-5.258 1.779-2.045 0-3.888-.689-5.265-1.779C6.103 14.537 5.218 12.915 5.223 11.06a6.118 6.118 0 0 1 2.116-4.66c1.341-1.169 3.218-1.847 5.399-1.847zm0 1.065c-1.817 0-3.384.546-4.474 1.498a5.053 5.053 0 0 0-1.753 3.844c-.005 1.536.727 2.88 1.865 3.783 1.14.905 2.673 1.481 4.362 1.481 1.689 0 3.222-.576 4.362-1.481 1.14-.903 1.87-2.247 1.865-3.783a5.053 5.053 0 0 0-1.753-3.844c-1.09-.952-2.657-1.498-4.474-1.498zM4.928 17.463h4.468v2.169H4.928z" />
			</svg>
		),
	},
	{
		key: "facebook",
		label: "Facebook",
		icon: (
			<svg
				viewBox="0 0 24 24"
				className="w-4 h-4 fill-current"
				role="img"
				aria-label="Facebook"
			>
				<path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 1.09.044 1.613.115V7.93h-1.143c-1.679 0-2.191.637-2.191 2.284v1.811h3.208l-.453 3.22-.187.447H13.238v7.999z" />
			</svg>
		),
	},
];

export default function CreatorPopover({
	name,
	metadata,
	children,
}: {
	name: string;
	metadata: Record<string, string> | null;
	children: ReactNode;
}) {
	if (!metadata) {
		return <>{children}</>;
	}

	const links = socialLinks.filter(({ key }) => metadata[key]);

	if (links.length === 0) {
		return <>{children}</>;
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button type="button" className="cursor-pointer hover:underline">
					{children}
				</button>
			</PopoverTrigger>
			<PopoverContent className="dark w-auto min-w-48 bg-surface-container border-outline-variant/20 p-3">
				<div className="text-sm font-bold text-on-surface mb-2">@{name}</div>
				<div className="flex flex-col gap-1">
					{links.map(({ key, label, icon }) => (
						<a
							key={key}
							href={metadata[key]}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2 px-2 py-1.5 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-bright transition-colors text-sm"
						>
							{icon}
							{label}
						</a>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
}
