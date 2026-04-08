import { FileIcon, Music2Icon } from "lucide-react";

interface FilePreviewProps {
	path: string;
	mime: string;
	alt?: string;
}

function getPreviewUrl(path: string) {
	return `/api/files/${path}`;
}

export function FilePreview({ path, mime, alt }: FilePreviewProps) {
	const url = getPreviewUrl(path);

	if (mime.startsWith("image/")) {
		return (
			<img
				src={url}
				alt={alt ?? path}
				className="h-full w-full bg-muted object-contain"
			/>
		);
	}
	if (mime.startsWith("video/")) {
		return (
			<video controls className="h-full w-full object-cover">
				<source src={url} type={mime} />
				<track kind="captions" />
			</video>
		);
	}
	if (mime.startsWith("audio/")) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3 px-4">
				<Music2Icon className="size-10 text-muted-foreground" />
				<audio controls className="w-full">
					<source src={url} type={mime} />
					<track kind="captions" />
				</audio>
			</div>
		);
	}
	return (
		<div className="flex h-full items-center justify-center">
			<FileIcon className="size-10 text-muted-foreground" />
		</div>
	);
}
