# Implementation Plan — Shop Banner Carousel

Admin-managed, auto-rotating promotional banner carousel at the TOP of the `/shop` page (Jumia-style). Do NOT touch the landing hero (`src/components/landing-hero.tsx`) or the home page (`src/app/page.tsx`). Carousel renders only on `/shop`, above the existing "Shop" heading + filter + grid.

## Conventions discovered during exploration (follow exactly)

- Project: Next.js 15 App Router, React 19, TypeScript 5.7, Tailwind v4, Prisma 6.19 (client output `src/generated/prisma`, import `@/generated/prisma`), next-auth v4, Cloudinary 2.11, framer-motion 11.18, zod 3.24. Scripts: `npm run dev`, `npm run build`, `npm run lint` (`next lint`), `npm run typecheck` (`tsc --noEmit`), `npm run db:migrate` (`prisma migrate dev`).
- No AGENTS.md / README / `.kiro/steering` — conventions come from existing code only.
- Prisma client singleton: `import { prisma } from "@/lib/prisma"`. Types: `import { ... } from "@/generated/prisma"`.
- Admin API role-gate: `getCurrentUser()` → 401 if no user, 403 if `user.role !== "ADMIN"`. The intro-video route uses a local `requireAdminUser()` helper returning `{ error }` or `{ user }`; the products route inlines the two checks. Use the inline pattern (matches products route, which is the closest analog since banners is a CRUD resource).
- Dynamic server routes/pages set `export const dynamic = "force-dynamic";`.
- `[id]` route handlers: `{ params }: { params: Promise<{ id: string }> }`, then `const { id } = await params;`.
- Cloudinary: `signUploadParams("image")` / `deleteAsset(publicId, "image")` from `@/lib/cloudinary`. Client upload flow lives in `src/lib/upload-image.ts` → `uploadImageToCloudinary(file)` returning `{ url, publicId }` (POSTs `/api/uploads`, uploads direct to Cloudinary image endpoint). REUSE it.
- zod schemas live in `src/lib/validation.ts`; update schema is `.partial().refine(len>0, "No fields to update.")`. API validation: `schema.safeParse(body)` → 400 `{ error: "Validation failed.", issues: parsed.error.flatten() }`.
- Framer Motion carousel pattern: `src/components/product-gallery.tsx` — `[[index,direction], setState]`, `paginate(dir)` wraps modulo `count`, `onDragEnd` with `SWIPE_DISTANCE=50`, `AnimatePresence` + `motion.div` variants (enter/center/exit), prev/next arrows (`sm:flex`, hidden on mobile), dot indicators. Reuse this structure.
- Admin client components use `useRouter()` + `router.refresh()` after each mutation; show busy/error/success states.
- Brand palette classes: `gulf-blue` (#060E6E), `persian-blue` (#1F27E9), `brand-white` (#FFFFFF). Copy keeps the apostrophe: "Dawn's Embrace" → `Dawn&apos;s Embrace` in JSX.
- Money is integer kobo — NOT relevant to banners (no price field), noted only to confirm no money handling here.
- `.mjs` seed scripts import `PrismaClient` from `../src/generated/prisma/index.js`, read files with `node:fs`/`node:path`/`node:url`, are idempotent, log and skip gracefully, `process.exitCode = 1` on failure, `prisma.$disconnect()` in `finally`. See `scripts/seed-subimages.mjs`.

## Windows / Prisma constraint (CRITICAL)

`prisma generate` / `prisma migrate` throw EPERM if a node dev server is holding `src\generated\prisma\query_engine-windows.dll.node`. Before any generate/migrate, kill node:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Sleep -Seconds 2
```

PowerShell command separator is `;` (not `&&`). Prefer `npx tsc --noEmit` and `npx next lint` for mid-task verification. Run `npx next build` only at the very end, after killing node. If build errors with `ENOENT _document.js` or jest-worker `MODULE_NOT_FOUND`, that's stale cache: `Remove-Item -Recurse -Force .next` then rebuild. The dev server belongs to the user — after finishing, tell them to restart `npm run dev`.

---

# Steps

- [ ] 1. Add the `Banner` model to the Prisma schema.
      Append to `prisma/schema.prisma` (after `SiteSetting`, matching the file's 2-space-field style):
      `model Banner { id String @id @default(cuid()); imageUrl String; publicId String?; linkUrl String?; sortOrder Int @default(0); isActive Boolean @default(true); createdAt DateTime @default(now()); updatedAt DateTime @updatedAt; @@index([isActive, sortOrder]) }` (index supports the storefront active-ordered query). Do NOT remove/alter existing models.
      Files: `prisma/schema.prisma`
      Verify: `Get-Content prisma/schema.prisma` shows the new model and no edits to existing models. (Migration applied + client generated in step 2.)

- [ ] 2. Create and apply the `add_banner` migration, regenerating the Prisma client. First kill node (EPERM guard), then migrate. This MUST NOT wipe existing data (4 products, 1 admin, 8 ProductImage rows, orders/notifications/site settings) — `migrate dev` with a purely additive model does not reset.
      Commands (PowerShell, in workspace root):
      `Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Sleep -Seconds 2`
      then `npx prisma migrate dev --name add_banner`
      Files: creates `prisma/migrations/<timestamp>_add_banner/migration.sql`; regenerates `src/generated/prisma/*`.
      Verify: command exits 0 and prints the migration applied; `npx prisma migrate status` reports up to date. Confirms `Banner` table exists and the client knows `prisma.banner`.

- [ ] 3. Add `bannerSchema` and `bannerUpdateSchema` to `src/lib/validation.ts`, consistent with existing schemas. `bannerSchema` = `{ imageUrl: z.string().trim().url(...), publicId: z.string().trim().max(200).optional(), linkUrl: z.string().trim().url("Link must be a valid URL.").optional() }`. `bannerUpdateSchema` = object with `isActive: z.boolean()`, `sortOrder: z.number().int().min(0)`, `linkUrl: z.string().trim().url(...).nullable()` all `.partial().refine(len>0, "No fields to update.")` (mirrors `productUpdateSchema`). Export the inferred types (`BannerInput`, `BannerUpdateInput`).
      Files: `src/lib/validation.ts`
      Verify: `npx tsc --noEmit` passes (no type errors from the new exports).

- [ ] 4. Create `src/lib/banners.ts` with `listActiveBanners()` (`where isActive true`, `orderBy [{ sortOrder: "asc" }, { createdAt: "asc" }]`) for the storefront and `listAllBanners()` (`orderBy [{ sortOrder: "asc" }, { createdAt: "asc" }]`) for admin. Import `prisma` from `@/lib/prisma` and `Banner` type from `@/generated/prisma`; return typed arrays. Mirror the structure/comments of `src/lib/products.ts`.
      Files: `src/lib/banners.ts`
      Verify: `npx tsc --noEmit` passes.

- [ ] 5. Create the collection API route `src/app/api/admin/banners/route.ts`: `export const dynamic = "force-dynamic";`. `GET` → admin-gated list via `listAllBanners()` returning `{ banners }`. `POST` → admin-gated, parse body with `bannerSchema`; compute next `sortOrder` as `(max existing sortOrder) + 1` (or 0 if none) via `prisma.banner.aggregate({ _max: { sortOrder: true } })`; `prisma.banner.create` with `imageUrl`, `publicId ?? null`, `linkUrl ?? null`, `sortOrder`, `isActive: true`; return `{ banner }` status 201. Use the inline 401/403 gate exactly like `src/app/api/products/route.ts`.
      Files: `src/app/api/admin/banners/route.ts`
      Verify: `npx tsc --noEmit` and `npx next lint` pass.

- [ ] 6. Create the item API route `src/app/api/admin/banners/[id]/route.ts`: `export const dynamic = "force-dynamic";`, params typed `Promise<{ id: string }>`. `PATCH` → admin-gated, `bannerUpdateSchema.safeParse`, 404 if `prisma.banner.findUnique` is null, else `prisma.banner.update` with parsed data (supports toggling `isActive`, setting `linkUrl` incl. null, and setting an explicit `sortOrder`), return `{ banner }`. `DELETE` → admin-gated, 404 if missing, else `prisma.banner.delete` then best-effort `deleteAsset(existing.publicId, "image")` only if `publicId` is set (guard against seeded local `/brand/*.jpg` rows that have no publicId), return `{ ok: true }`. Follow the 401/403 + param pattern of `src/app/api/products/[id]/route.ts`.
      Files: `src/app/api/admin/banners/[id]/route.ts`
      Verify: `npx tsc --noEmit` and `npx next lint` pass.

- [ ] 7. Create the admin client manager `src/components/admin/banner-manager.tsx` (`"use client"`). Props: `banners: Banner[]` (serialized; type the fields it needs). Behaviors, each followed by `router.refresh()`: (a) upload a new banner via `uploadImageToCloudinary(file)` then `POST /api/admin/banners` with `{ imageUrl, publicId }` and optional link; (b) list each banner with a `next/image` thumbnail preview, its active state, and link; (c) reorder move-up/move-down by swapping `sortOrder` with the adjacent banner via two `PATCH` calls (disable up on first, down on last); (d) toggle active/inactive via `PATCH { isActive }`; (e) edit `linkUrl` (set/clear → send `null`) via `PATCH`; (f) delete via `DELETE`. Mirror busy/error/success UX, file-input styling, and brand classes from `src/components/admin/intro-video-form.tsx`. Use `useRouter` from `next/navigation`.
      Files: `src/components/admin/banner-manager.tsx`
      Verify: `npx tsc --noEmit` and `npx next lint` pass.

- [ ] 8. Create the admin page `src/app/(admin)/admin/banners/page.tsx` (server component, `export const dynamic = "force-dynamic";`). Fetch `listAllBanners()`, render a heading + description (brand voice, "Dawn's Embrace" apostrophe) and `<BannerManager banners={banners} />`. Role-gating is already enforced by the `(admin)` layout. Mirror the shell of `src/app/(admin)/admin/settings/page.tsx`.
      Files: `src/app/(admin)/admin/banners/page.tsx`
      Verify: `npx tsc --noEmit` passes.

- [ ] 9. Add a "Banners" link to the admin nav. In `src/app/(admin)/admin/layout.tsx`, insert `<Link href="/admin/banners" className="hover:text-persian-blue">Banners</Link>` in the nav group, placed between the Products and Orders links (keep existing links/order otherwise).
      Files: `src/app/(admin)/admin/layout.tsx`
      Verify: `npx tsc --noEmit` passes; `Select-String -Path "src/app/(admin)/admin/layout.tsx" -Pattern "/admin/banners"` finds the link. Final confirmation is the production build in step 13.

- [ ] 10. Create the storefront carousel `src/components/banner-carousel.tsx` (`"use client"`). Props: `banners: { id; imageUrl; linkUrl: string | null }[]`. Return `null` when the array is empty (graceful). Follow the framer-motion pattern from `src/components/product-gallery.tsx`: `[[index,direction], setState]`, `paginate(dir)` modulo-wrapping over `count`, `goTo(i)`, `onDragEnd` with `SWIPE_DISTANCE` 50, `AnimatePresence`+`motion.div` slide variants, draggable on `x` only when `count > 1`. Render full-width of the shop container with a landscape ratio (`aspect-[16/9]` on a `w-full overflow-hidden rounded-2xl` box) using `next/image` `fill` `sizes="(max-width:1152px) 100vw, 1152px"` `priority={index===0}`. Prev/next arrows (`hidden sm:flex`) and dot indicators like the gallery, shown only when `count > 1`. If a slide has `linkUrl`, wrap its image in a `next/link` to that href (internal or external). Auto-rotate every 5000ms via `setInterval` in a `useEffect` (cleared on unmount, reset on manual interaction). Pause auto-rotate on mouse enter / resume on leave. Respect reduced motion: read `window.matchMedia("(prefers-reduced-motion: reduce)")` and DO NOT auto-advance when it matches (manual controls still work). Guard all `window`/timer use for SSR.
      Files: `src/components/banner-carousel.tsx`
      Verify: `npx tsc --noEmit` and `npx next lint` pass.

- [ ] 11. Wire the carousel into the shop page. In `src/app/(shop)/shop/page.tsx`, import `listActiveBanners` from `@/lib/banners` and `BannerCarousel`; add `listActiveBanners()` to the existing `Promise.all` (keep products + dialColors). Render `<BannerCarousel banners={banners} />` as the FIRST child of `<main>`, ABOVE the `<div className="mb-8">` Shop heading block. Pass only `{ id, imageUrl, linkUrl }`. Do not change the filter form or grid. (Empty-state is handled inside the carousel by returning null.)
      Files: `src/app/(shop)/shop/page.tsx`
      Verify: `npx tsc --noEmit` and `npx next lint` pass.

- [ ] 12. Create the idempotent seed script `scripts/seed-banners.mjs`, modeled on `scripts/seed-subimages.mjs`. Import `PrismaClient` from `../src/generated/prisma/index.js`. Resolve `public/brand/banner-1.jpg`..`banner-4.jpg` via `node:path`/`node:url`; collect the ones that exist. If none exist → log and skip. If `prisma.banner.count()` > 0 → log "banners already exist, skipping" and skip (no duplicates). Otherwise `prisma.banner.createMany` inserting each existing file as `{ imageUrl: "/brand/banner-N.jpg", sortOrder: N-1, isActive: true }` (no `publicId` — these are local files). Log count, `process.exitCode = 1` on error, `prisma.$disconnect()` in `finally`.
      Files: `scripts/seed-banners.mjs`
      Verify: kill node first (`Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Sleep -Seconds 2`), then `node scripts/seed-banners.mjs` — exits 0 and either seeds (if images present and table empty) or logs a graceful skip. Running it a second time logs "already exist" and inserts nothing (idempotent).

- [ ] 13. Final full verification. Kill node, then run the production build; clear stale cache if the known errors appear.
      Commands: `Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Sleep -Seconds 2` then `npx tsc --noEmit` then `npx next lint` then `npx next build`. If build fails with `ENOENT _document.js` or jest-worker `MODULE_NOT_FOUND`: `Remove-Item -Recurse -Force .next` then `npx next build` again.
      Files: none (verification only).
      Verify: `tsc --noEmit` clean, `next lint` clean, `next build` completes with the `/shop`, `/admin/banners` routes compiled and no type/lint errors. Existing routes still build (no regressions to landing/home/products/intro).

## Post-task note for the user

The dev server is yours — I killed node to run prisma/build. After this lands, restart it with `npm run dev`. To populate the carousel, drop 4 wide (~1024×585) images at `public/brand/banner-1.jpg`..`banner-4.jpg` and run `node scripts/seed-banners.mjs`, or add banners from the new Admin → Banners page.

## Verification evidence (first iteration)

Ran on Windows/PowerShell in the workspace root, node killed before each prisma/build step.

- `npx prisma validate` → "The schema at prisma\schema.prisma is valid 🚀" (exit 0).
- `npx prisma generate` → "Generated Prisma Client (v6.19.3)" (exit 0).
- `npx prisma migrate dev --name add_banner` → applied migration `20261024100631_add_banner`, "Your database is now in sync with your schema." Additive only; no reset (exit 0).
- `npx tsc --noEmit` → clean, no errors (exit 0).
- `npx next lint` → "✔ No ESLint warnings or errors" (exit 0).
- `node scripts/seed-banners.mjs` → first run "Done. Inserted 4 banner(s)."; second run "Banners already exist — skipping (no duplicates)." (idempotent) (exit 0). The user placed `public/brand/banner-1.jpeg`..`banner-4.jpeg` (`.jpeg` extension), so the seeder resolves either `.jpg` or `.jpeg` per sortOrder; this only widens which local files are detected and never changes behavior for `.jpg`.
- Data integrity check (counts): `{"products":4,"admins":1,"productImages":8,"banners":0}` — existing data intact, no wipe.
- `npx next build` → "✓ Compiled successfully", types + lint clean, all pages generated (exit 0). New routes present: `/admin/banners`, `/api/admin/banners`, `/api/admin/banners/[id]`; `/shop` still builds. No stale-cache error, so no `.next` clear was needed.

## Assumptions made (gaps filled, not stalled)

- `requireAdminUser` style: used the inline 401/403 checks (products route) rather than the intro-video helper, because banners is a multi-route CRUD resource closest to products. Either is acceptable; inline keeps it consistent with the `[id]` route in the same feature.
- Carousel aspect ratio fixed at `16/9` (close to the stated ~1024×585 ≈ 1.75:1) for layout stability with `next/image fill`; banner-1.jpg etc. are ~16:9 so cropping is minimal with `object-cover`.
- Reorder implemented as adjacent swap via two PATCH calls (allowed by the task: "move-up/move-down by swapping sortOrder values is fine").
- DELETE only calls `deleteAsset` when `publicId` is present, so seeded local-file banners (no publicId) delete cleanly without a bogus Cloudinary call.
