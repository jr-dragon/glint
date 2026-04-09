import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, Heart, Library, Play } from "lucide-react";
import { z } from "zod/v4";
import CreatorPopover from "#/components/CreatorPopover";
import PublicFooter from "#/components/PublicFooter";
import PublicHeader from "#/components/PublicHeader";
import { buttonVariants } from "#/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "#/components/ui/pagination";
import { getAppName } from "#/lib/app-name";
import { getSocialLinks } from "#/lib/social-links";
import { listPublicCategoryObjects, type PublicObject } from "#/lib/storage";
import { cn } from "#/lib/utils";

import publicCss from "../styles-public.css?url";

// --- Server Functions ---

const loadCategoryFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      categoryName: z.string(),
      page: z.number().int().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const result = await listPublicCategoryObjects(
      data.categoryName,
      data.page,
    );
    return { ...result, appName: getAppName(), socialLinks: getSocialLinks() };
  });

// --- Route ---

export const Route = createFileRoute("/category/$categoryName")({
  component: CategoryPage,
  head: () => ({
    links: [{ rel: "stylesheet", href: publicCss }],
  }),
  validateSearch: z.object({ page: z.coerce.number().int().min(1).catch(1) }),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ params, deps }) =>
    loadCategoryFn({
      data: { categoryName: params.categoryName, page: deps.page },
    }),
});

function CategoryPage() {
  const { categoryName } = useParams({ from: "/category/$categoryName" });
  const { items, total, appName, socialLinks } = Route.useLoaderData();
  const { page } = Route.useSearch();

  const displayName = categoryName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const perPage = 24;
  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="dark bg-surface text-on-surface font-sans selection:bg-primary/30 min-h-screen">
      <PublicHeader appName={appName} />

      <main className="pt-16">
        {/* Category Hero Section */}
        <header className="relative h-130 flex items-end px-12 pb-20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            {items[0]?.metadata.mime.startsWith("image/") ? (
              <img
                alt="Category background"
                className="w-full h-full object-cover opacity-60"
                src={`/api/files/${items[0].path}`}
              />
            ) : (
              <div className="w-full h-full bg-surface-container-high" />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-surface via-surface/40 to-transparent" />
          </div>
          <div className="relative z-10 max-w-4xl">
            <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-on-surface mb-6 leading-tight">
              {displayName}
            </h1>
          </div>
        </header>

        {/* Media Grid */}
        <section className="px-12 py-12">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
              <Library className="w-12 h-12 mb-4 opacity-40" />
              <p className="text-lg">還沒有可公開的內容</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
              {items.map((item) => (
                <MediaCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-20">
              <CategoryPagination
                categoryName={categoryName}
                page={page}
                totalPages={totalPages}
              />
            </div>
          )}
        </section>
      </main>

      <PublicFooter appName={appName} socialLinks={socialLinks} />
    </div>
  );
}

function CategoryPagination({
  categoryName,
  page,
  totalPages,
}: {
  categoryName: string;
  page: number;
  totalPages: number;
}) {
  const pageNumbers: (number | "ellipsis")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pageNumbers.push(i);
    } else if (pageNumbers[pageNumbers.length - 1] !== "ellipsis") {
      pageNumbers.push("ellipsis");
    }
  }

  const linkProps = (p: number) =>
    ({
      to: "/category/$categoryName",
      params: { categoryName },
      search: { page: p },
    }) as const;

  return (
    <Pagination>
      <PaginationContent>
        {page > 1 && (
          <PaginationItem>
            <Link
              {...linkProps(page - 1)}
              aria-label="Go to previous page"
              className={cn(
                buttonVariants({ variant: "ghost", size: "default" }),
                "gap-1 px-2.5 sm:pl-2.5",
              )}
            >
              <ChevronLeft />
              <span className="hidden sm:block">Previous</span>
            </Link>
          </PaginationItem>
        )}
        {pageNumbers.map((p, _i, arr) =>
          p === "ellipsis" ? (
            <PaginationItem key={`ellipsis-after-${arr[_i - 1]}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <Link
                {...linkProps(p)}
                aria-current={p === page ? "page" : undefined}
                className={buttonVariants({
                  variant: p === page ? "outline" : "ghost",
                  size: "icon",
                })}
              >
                {p}
              </Link>
            </PaginationItem>
          ),
        )}
        {page < totalPages && (
          <PaginationItem>
            <Link
              {...linkProps(page + 1)}
              aria-label="Go to next page"
              className={cn(
                buttonVariants({ variant: "ghost", size: "default" }),
                "gap-1 px-2.5 sm:pr-2.5",
              )}
            >
              <span className="hidden sm:block">Next</span>
              <ChevronRight />
            </Link>
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}

function MediaCard({ item }: { item: PublicObject }) {
  const isImage = item.metadata.mime.startsWith("image/");
  const isVideo = item.metadata.mime.startsWith("video/");

  return (
    <div className="group cursor-pointer">
      <div className="relative aspect-4/5 rounded-2xl overflow-hidden mb-4 bg-surface-container-low transition-transform duration-500 group-hover:scale-[1.02] border border-outline-variant/10">
        {isImage && (
          <img
            alt={item.metadata.originalName}
            className="w-full h-full object-cover"
            src={`/api/files/${item.path}`}
          />
        )}
        {isVideo && (
          <video className="w-full h-full object-cover" muted loop>
            <source src={`/api/files/${item.path}`} type={item.metadata.mime} />
            <track kind="captions" />
          </video>
        )}
        {!isImage && !isVideo && (
          <div className="w-full h-full flex items-center justify-center bg-surface-container-high">
            <Library className="w-10 h-10 text-on-surface-variant/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-surface-container-lowest to-transparent opacity-60" />

        {isVideo && (
          <div className="absolute bottom-4 left-4">
            <span className="bg-primary/20 backdrop-blur-md text-primary text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
              <Play className="fill-current w-3 h-3" /> Video
            </span>
          </div>
        )}
      </div>
      <div>
        {item.creator && (
          <div className="flex items-center gap-3 mt-1 text-on-surface-variant text-xs tracking-wide">
            <CreatorPopover
              name={item.creator.name}
              metadata={item.creator.metadata}
            >
              <span>@{item.creator.name}</span>
            </CreatorPopover>
          </div>
        )}
        {item.userTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {item.userTags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-surface-container-high px-2.5 py-0.5 text-[11px] font-medium text-on-surface-variant"
              >
                {tag}
              </span>
            ))}
            {item.userTags.length > 5 && (
              <span className="text-[11px] text-on-surface-variant/60">
                +{item.userTags.length - 5}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
