# Glint

Personal media management application built with TanStack Start, deployed on Cloudflare Workers. Uses Cloudflare R2 for media storage and D1 for database.

## Tech Stack

- **Framework**: TanStack Start (React 19, file-based routing)
- **Runtime**: Cloudflare Workers (with `nodejs_compat`)
- **Storage**: Cloudflare R2 (media files), Cloudflare D1 (SQLite via Prisma)
- **ORM**: Prisma with `@prisma/adapter-d1`, client generated to `src/generated/prisma/`
- **UI**: shadcn/ui (radix-vega style), Tailwind CSS v4, Lucide icons
- **Language**: TypeScript (strict mode)
- **Package Manager**: Bun
- **Linter/Formatter**: Biome (tabs, double quotes)
- **Testing**: Vitest + Testing Library
- **Validation**: Zod v4

## Commands

- `bun dev` — Start dev server (port 3000)
- `bun run build` — Production build
- `bun run deploy` — Build and deploy to Cloudflare Workers
- `bun run cf-typegen` — Generate Cloudflare binding types
- `bun test` — Run tests
- `bun run check` — Run Biome lint + format check
- `bun run check --fix` — Auto-fix lint and format issues

## Project Structure

```
src/
  entry.server.ts    # Server entry — file serving (/api/files/), CF Access auth, SSR handler
  router.tsx         # Router configuration
  styles.css         # Global styles (Tailwind)
  styles-public.css  # Public page styles (dark theme, Material Design tokens)
  routeTree.gen.ts   # Auto-generated route tree (do not edit)
  routes/
    __root.tsx                  # Root layout (head, Toaster, devtools)
    index.tsx                   # Public home — hero carousel, category grid
    category.$categoryName.tsx  # Public category detail — paginated media grid
    admin/
      route.tsx                 # Admin layout (AdminHeader, max-w-5xl container)
      index.tsx                 # Admin dashboard — file upload, tagging, category/creator binding, public toggle
      category.tsx              # Admin category management — CRUD, drag-drop file assignment
      creator.tsx               # Admin creator management — CRUD with metadata, drag-drop file assignment
  components/
    ui/              # shadcn/ui components (managed by shadcn CLI, do not manually edit)
    AdminHeader.tsx   # Admin navigation header
    PublicHeader.tsx  # Public site header
    PublicFooter.tsx  # Public site footer with social links
    ThemeToggle.tsx   # Theme toggle (admin)
    PaginationBar.tsx # Reusable pagination for admin
    FilePreview.tsx   # File preview component (image/video/generic)
    OptimizedImage.tsx # Cloudflare Image Resizing wrapper (cdn-cgi/image/...)
    CreatorPopover.tsx # Creator info popover (public pages)
  hooks/
    use-mobile.ts    # Mobile breakpoint hook
  lib/
    utils.ts         # Utility functions (cn)
    db.ts            # Prisma client factory (PrismaD1 adapter)
    storage.ts       # Core business logic — file CRUD, tags, categories, creators, public visibility
    cf-access.ts     # Cloudflare Access JWT verification
    constants.ts     # Tag prefix constants (system:category:, system:creator:, system:public)
    app-name.ts      # App name from env
    social-links.ts  # Social links from env
  generated/
    prisma/          # Generated Prisma client (do not edit)
```

## Data Model

Two Prisma models with a many-to-many relationship:

- **Object** — Media files stored in R2 (`path` = R2 key, `metadata` = JSON with mime/size/originalName, soft-delete via `deleted_at`)
- **Tag** — Polymorphic tag system with prefixed names:
  - `system:category:{name}` — Category classification (one per object)
  - `system:creator:{name}` — Creator attribution (one per object), with optional `metadata` JSON for social links
  - `system:public` — Public visibility flag
  - `user:{name}` — User-defined tags (multiple per object)

## Architecture

### Server Entry (`entry.server.ts`)

Custom fetch handler with two interceptors before SSR:
1. **File serving**: `/api/files/:key` serves files directly from R2 with immutable cache headers
2. **Admin auth**: `/admin/*` routes verify Cloudflare Access JWT in production (skipped in dev)

### Server Functions

All data operations use TanStack Start `createServerFn()`. Server functions access Cloudflare bindings via `import { env } from "cloudflare:workers"`.

### Image Optimization

`OptimizedImage` component uses Cloudflare Image Resizing (`/cdn-cgi/image/...`) in production with automatic fallback to original URL on error. Dev mode always uses original URLs.

### Public vs Admin

- **Public pages** (`/`, `/category/$categoryName`): Dark theme with Material Design color tokens, immersive editorial design (see `DESIGN.md`). Only shows objects tagged with `system:public`.
- **Admin pages** (`/admin/*`): Standard shadcn/ui components, protected by Cloudflare Access. Full CRUD for files, categories, creators, tags, and public visibility.

## Conventions

- Import alias: `#/*` maps to `./src/*` (preferred), `@/*` also available
- Route tree is auto-generated at `src/routeTree.gen.ts` — do not edit
- shadcn/ui components in `src/components/ui/` are managed by shadcn CLI — do not manually edit
- Biome is configured to skip `routeTree.gen.ts`, `styles.css`, and `components/ui`
- Use Biome for formatting (tabs, double quotes) — do not use Prettier
- Run `bun run check --fix` before committing to ensure code style consistency
- **Design Policy**: The immersive curation strategy defined in `DESIGN.md` applies **only** to the public-facing user interface. Administrative routes under `/admin` must use standard, functional UI components (shadcn/ui defaults) without the editorial styling, glassmorphism, or tonal layering described in the design system.

## Cloudflare Bindings

Defined in `wrangler.jsonc`:
- `DB` — D1 database (`glint-db`)
- `STORAGE` — R2 bucket (`glint-storage`)
- `APP_NAME`, `LINKS_FACEBOOK`, `LINKS_X`, `LINKS_GITHUB` — Environment variables
- `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_POLICY_AUD` — Cloudflare Access config
