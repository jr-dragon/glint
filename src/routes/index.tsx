import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Library, Play } from "lucide-react";
import { useState } from "react";
import CreatorPopover from "#/components/CreatorPopover";
import { OptimizedImage } from "#/components/OptimizedImage";
import PublicFooter from "#/components/PublicFooter";
import PublicHeader from "#/components/PublicHeader";
import { Button } from "#/components/ui/button";
import { getAppName } from "#/lib/app-name";
import { getSocialLinks } from "#/lib/social-links";
import {
	listFeaturedPublicObjects,
	listPublicCategories,
	type PublicCategoryWithCover,
} from "#/lib/storage";

import publicCss from "../styles-public.css?url";

// --- Server Functions ---

const loadHomeFn = createServerFn({ method: "GET" }).handler(async () => {
	const [categories, featured] = await Promise.all([
		listPublicCategories(),
		listFeaturedPublicObjects(5),
	]);
	return {
		categories,
		featured,
		appName: getAppName(),
		socialLinks: getSocialLinks(),
	};
});

// --- Route ---

export const Route = createFileRoute("/")({
	component: App,
	head: () => ({
		links: [{ rel: "stylesheet", href: publicCss }],
	}),
	loader: () => loadHomeFn(),
});

function App() {
	const { categories, featured, appName, socialLinks } = Route.useLoaderData();
	const [heroIndex, setHeroIndex] = useState(0);

	const heroItem = featured[heroIndex];

	return (
		<div className="dark bg-surface text-on-surface font-sans selection:bg-primary/30 min-h-screen">
			<PublicHeader appName={appName} />

			<main className="pt-16">
				{/* Hero Featured Carousel Section */}
				{heroItem ? (
					<section className="relative w-full h-[80vh] min-h-150 overflow-hidden group">
						<div className="absolute inset-0">
							{heroItem.metadata.mime.startsWith("image/") ? (
								<OptimizedImage
									alt={heroItem.metadata.originalName}
									className="w-full h-full object-cover"
									src={`/api/files/${heroItem.path}`}
									cfOptions={{ width: 1920, quality: 80 }}
								/>
							) : heroItem.metadata.mime.startsWith("video/") ? (
								<video
									className="w-full h-full object-cover"
									autoPlay
									muted
									loop
								>
									<source
										src={`/api/files/${heroItem.path}`}
										type={heroItem.metadata.mime}
									/>
									<track kind="captions" />
								</video>
							) : (
								<div className="w-full h-full bg-surface-container" />
							)}
							<div className="absolute inset-0 bg-linear-to-t from-surface via-surface/20 to-transparent" />
							<div className="absolute inset-0 bg-linear-to-r from-surface via-transparent to-transparent" />
						</div>

						{/* Carousel Content Overlay */}
						<div className="absolute bottom-0 left-0 w-full p-12 md:p-24 flex flex-col items-start max-w-4xl">
							<div className="flex items-center gap-3 mb-4">
								{heroItem.creators.map((creator) => (
									<CreatorPopover
										key={creator.name}
										name={creator.name}
										metadata={creator.metadata}
									>
										<span className="text-on-surface-variant text-sm font-medium">
											@{creator.name}
										</span>
									</CreatorPopover>
								))}
							</div>
							{heroItem.userTags.length > 0 && (
								<div className="flex flex-wrap items-center gap-2 mb-6">
									{heroItem.userTags.slice(0, 5).map((tag) => (
										<span
											key={tag}
											className="inline-flex items-center rounded-full bg-surface-container-high/60 backdrop-blur-sm px-3 py-1 text-xs font-medium text-on-surface-variant"
										>
											{tag}
										</span>
									))}
									{heroItem.userTags.length > 5 && (
										<span className="text-xs text-on-surface-variant/60">
											+{heroItem.userTags.length - 5}
										</span>
									)}
								</div>
							)}
							<h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-on-surface mb-6 leading-[0.9] max-w-3xl">
								{heroItem.category}
							</h1>
							{heroItem.category && (
								<div className="flex items-center gap-4">
									<Button
										asChild
										className="bg-linear-to-r from-primary to-primary-container text-on-primary-container h-auto px-10 py-4 rounded-full font-bold flex items-center gap-3 hover:scale-105 transition-transform border-none"
									>
										<Link
											to="/category/$categoryName"
											params={{ categoryName: heroItem.category }}
											search={{ page: 1 }}
										>
											<Library className="w-5 h-5" />
											檢視全部
										</Link>
									</Button>
								</div>
							)}
						</div>

						{/* Carousel Navigation Arrows */}
						{featured.length > 1 && (
							<div className="absolute right-12 bottom-24 flex gap-4">
								<button
									type="button"
									className="w-14 h-14 rounded-full border border-outline-variant/30 flex items-center justify-center hover:bg-surface-bright transition-all text-on-surface"
									onClick={() =>
										setHeroIndex(
											(i) => (i - 1 + featured.length) % featured.length,
										)
									}
								>
									<ArrowLeft className="w-6 h-6" />
								</button>
								<button
									type="button"
									className="w-14 h-14 rounded-full border border-outline-variant/30 flex items-center justify-center hover:bg-surface-bright transition-all text-on-surface"
									onClick={() => setHeroIndex((i) => (i + 1) % featured.length)}
								>
									<ArrowRight className="w-6 h-6" />
								</button>
							</div>
						)}

						{/* Indicators */}
						{featured.length > 1 && (
							<div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-3">
								{featured.map((_, i) => (
									<button
										type="button"
										key={featured[i].id}
										className={`h-1 rounded-full transition-all ${i === heroIndex ? "w-12 bg-primary" : "w-6 bg-outline-variant/40"}`}
										onClick={() => setHeroIndex(i)}
									/>
								))}
							</div>
						)}
					</section>
				) : (
					<section className="relative w-full h-[40vh] min-h-75 flex items-center justify-center bg-surface-container">
						<div className="text-center">
							<h1 className="text-6xl font-extrabold tracking-tighter text-on-surface mb-4">
								<span className="text-primary">{appName}</span>
							</h1>
							<p className="text-on-surface-variant text-lg">
								這裡還什麼也沒有 uwu
							</p>
						</div>
					</section>
				)}

				{/* Collections Grid */}
				{categories.length > 0 && (
					<section className="px-8 md:px-12 py-24 max-w-7xl mx-auto">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
							{categories.map((category) => (
								<CategoryCard key={category.id} category={category} />
							))}
						</div>
					</section>
				)}
			</main>

			<PublicFooter appName={appName} socialLinks={socialLinks} />
		</div>
	);
}

function CategoryCard({ category }: { category: PublicCategoryWithCover }) {
	return (
		<Link
			to="/category/$categoryName"
			params={{ categoryName: category.name }}
			search={{ page: 1 }}
			className="group relative aspect-4/5 rounded-xl overflow-hidden bg-surface-container transition-all duration-300 hover:scale-[1.02] hover:bg-surface-bright cursor-pointer shadow-lg shadow-black/20 border border-outline-variant/10 block"
		>
			{category.cover?.metadata.mime.startsWith("image/") ? (
				<OptimizedImage
					className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
					src={`/api/files/${category.cover.path}`}
					alt={category.name}
					cfOptions={{ width: 640, quality: 75 }}
				/>
			) : (
				<div className="absolute inset-0 w-full h-full bg-surface-container-high" />
			)}
			<div className="absolute inset-0 bg-linear-to-t from-surface-container-lowest via-transparent to-transparent opacity-90" />
			<div className="absolute bottom-0 left-0 p-8 w-full">
				<h3 className="text-2xl font-bold text-on-surface mb-1">
					{category.name}
				</h3>
				<p className="text-on-surface-variant text-sm flex items-center gap-2">
					<Library className="w-4 h-4" /> {category.objectCount} Assets
				</p>
			</div>
			<div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
				<div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
					<Play className="fill-current w-5 h-5" />
				</div>
			</div>
		</Link>
	);
}
