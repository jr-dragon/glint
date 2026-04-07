# Glint

Personal media management application built with TanStack Start, deployed on Cloudflare Workers. Uses Cloudflare R2 for media storage and D1 for database.

## Tech Stack

- **Framework**: TanStack Start (React 19, file-based routing)
- **Runtime**: Cloudflare Workers (with `nodejs_compat`)
- **Storage**: Cloudflare R2 (media files), Cloudflare D1 (database)
- **UI**: shadcn/ui (radix-vega style), Tailwind CSS v4, Lucide icons
- **Language**: TypeScript (strict mode)
- **Package Manager**: Bun
- **Linter/Formatter**: Biome (tabs, double quotes)
- **Testing**: Vitest + Testing Library

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
  routes/        # TanStack file-based routes
  components/
    ui/          # shadcn/ui components (do not manually edit)
    Header.tsx
    Footer.tsx
    ThemeToggle.tsx
  hooks/         # Custom React hooks
  lib/
    utils.ts     # Utility functions (cn, etc.)
  router.tsx     # Router configuration
  styles.css     # Global styles (Tailwind)
```

## Conventions

- Import alias: `#/*` maps to `./src/*` (preferred), `@/*` also available
- Route tree is auto-generated at `src/routeTree.gen.ts` — do not edit
- shadcn/ui components in `src/components/ui/` are managed by shadcn CLI — do not manually edit
- Biome is configured to skip `routeTree.gen.ts`, `styles.css`, and `components/ui`
- Use Biome for formatting (tabs, double quotes) — do not use Prettier
- Run `bun run check --fix` before committing to ensure code style consistency
