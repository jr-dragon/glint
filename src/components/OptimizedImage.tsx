import { useCallback, useState } from "react";

interface CloudflareImageOptions {
	width?: number;
	height?: number;
	quality?: number;
	fit?: "scale-down" | "contain" | "cover" | "crop" | "pad";
	format?: "auto" | "avif" | "webp";
}

function buildCfImageUrl(
	src: string,
	options: CloudflareImageOptions = {},
): string {
	const params: string[] = [];
	if (options.width) params.push(`width=${options.width}`);
	if (options.height) params.push(`height=${options.height}`);
	params.push(`quality=${options.quality ?? 80}`);
	params.push(`fit=${options.fit ?? "cover"}`);
	params.push(`format=${options.format ?? "auto"}`);

	return `/cdn-cgi/image/${params.join(",")}${src}`;
}

interface OptimizedImageProps
	extends React.ImgHTMLAttributes<HTMLImageElement> {
	cfOptions?: CloudflareImageOptions;
}

export function OptimizedImage({
	src,
	cfOptions,
	onError,
	...props
}: OptimizedImageProps) {
	const [useFallback, setUseFallback] = useState(false);

	const isProduction = !import.meta.env.DEV;
	const optimizedSrc =
		isProduction && src && !useFallback ? buildCfImageUrl(src, cfOptions) : src;

	const handleError = useCallback(
		(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
			if (!useFallback) {
				setUseFallback(true);
			}
			onError?.(e);
		},
		[useFallback, onError],
	);

	// biome-ignore lint/a11y/useAltText: alt is passed via props spread
	return <img src={optimizedSrc} onError={handleError} {...props} />;
}
