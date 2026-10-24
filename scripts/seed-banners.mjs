// Idempotent sample banner seeder. If local banner images exist under
// public/brand (banner-1.jpg..banner-4.jpg) AND no Banner rows exist yet,
// inserts them as active banners in order. Skips gracefully when the files are
// absent or banners already exist — never duplicates.
//
// Run (kill node first on Windows to avoid Prisma EPERM):
//   node scripts/seed-banners.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");

// Candidate sample banners by sortOrder. Each resolves to the first existing
// public/brand/banner-N.* file (.jpg or .jpeg), so either extension works.
const EXTENSIONS = ["jpg", "jpeg"];

function resolveBanner(n) {
  for (const ext of EXTENSIONS) {
    const rel = `brand/banner-${n}.${ext}`;
    if (fs.existsSync(path.join(publicDir, rel))) {
      return `/${rel}`;
    }
  }
  return null;
}

async function main() {
  const available = [1, 2, 3, 4]
    .map((n) => ({ url: resolveBanner(n), sortOrder: n - 1 }))
    .filter((s) => s.url !== null);

  if (available.length === 0) {
    console.log(
      "[seed-banners] No banner images found under public/brand — skipping.",
    );
    return;
  }

  const existing = await prisma.banner.count();
  if (existing > 0) {
    console.log(
      "[seed-banners] Banners already exist — skipping (no duplicates).",
    );
    return;
  }

  await prisma.banner.createMany({
    data: available.map((s) => ({
      imageUrl: s.url,
      sortOrder: s.sortOrder,
      isActive: true,
    })),
  });

  console.log(`[seed-banners] Done. Inserted ${available.length} banner(s).`);
}

main()
  .catch((err) => {
    console.error("[seed-banners] Failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
