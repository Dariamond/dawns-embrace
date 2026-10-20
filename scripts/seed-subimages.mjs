// Idempotent sample sub-image seeder. For each existing product that has no
// ProductImage rows yet, attach the local sample side/back images (whichever
// exist under public/brand). Never creates or duplicates Product rows; skips
// gracefully when the sample files are absent.
//
// Run (kill node first on Windows to avoid Prisma EPERM):
//   node scripts/seed-subimages.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");

// Candidate sample sub-images: [public-relative url, filesystem path, sortOrder].
const SAMPLES = [
  { url: "/brand/sample-side.jpg", sortOrder: 0 },
  { url: "/brand/sample-back.jpg", sortOrder: 1 },
];

async function main() {
  const available = SAMPLES.filter((s) =>
    fs.existsSync(path.join(publicDir, s.url.replace(/^\//, ""))),
  );

  if (available.length === 0) {
    console.log(
      "[seed-subimages] No sample images found under public/brand — skipping.",
    );
    return;
  }

  const products = await prisma.product.findMany({
    include: { images: true },
  });

  let attached = 0;
  for (const product of products) {
    if (product.images.length > 0) {
      continue; // already has sub-images — leave untouched (idempotent).
    }
    await prisma.productImage.createMany({
      data: available.map((s) => ({
        productId: product.id,
        url: s.url,
        sortOrder: s.sortOrder,
      })),
    });
    attached += 1;
    console.log(
      `[seed-subimages] Attached ${available.length} sample image(s) to "${product.name}".`,
    );
  }

  if (attached === 0) {
    console.log(
      "[seed-subimages] All products already have sub-images — nothing to do.",
    );
  } else {
    console.log(`[seed-subimages] Done. Updated ${attached} product(s).`);
  }
}

main()
  .catch((err) => {
    console.error("[seed-subimages] Failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
