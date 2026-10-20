// Seed script: one ADMIN user (from env) + sample watch products.
// Idempotent — upserts by unique email / product name. Run with `npm run db:seed`.

import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". Set it in your .env file.`,
    );
  }
  return value;
}

type SampleProduct = {
  name: string;
  description: string;
  dialColor: string;
  priceKobo: number;
  stock: number;
  imageUrl: string;
};

const sampleProducts: SampleProduct[] = [
  {
    name: "Dawn's Embrace Midnight Blue",
    description:
      "The signature Dawn's Embrace timepiece with a deep gulf-blue dial and stainless steel case.",
    dialColor: "Blue",
    priceKobo: 15_000_000, // ₦150,000.00
    stock: 25,
    imageUrl: "/brand/hero-watch.png",
  },
  {
    name: "Dawn's Embrace Emerald Dawn",
    description:
      "A striking emerald-green dial watch, crafted for those who greet a new day boldly.",
    dialColor: "Green",
    priceKobo: 18_500_000, // ₦185,000.00
    stock: 15,
    imageUrl: "/brand/lineup-left.png",
  },
  {
    name: "Dawn's Embrace Pearl White",
    description:
      "An elegant pearl-white dial with persian-blue accents — understated and timeless.",
    dialColor: "White",
    priceKobo: 12_000_000, // ₦120,000.00
    stock: 40,
    imageUrl: "/brand/lineup-right.png",
  },
  {
    name: "Dawn's Embrace Obsidian Black",
    description:
      "A bold obsidian-black dial watch for the modern minimalist. A new day, a new you.",
    dialColor: "Black",
    priceKobo: 21_000_000, // ₦210,000.00
    stock: 10,
    imageUrl: "/brand/hero-watch.png",
  },
];

async function main() {
  const adminEmail = requiredEnv("ADMIN_EMAIL");
  const adminPassword = requiredEnv("ADMIN_PASSWORD");

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: "ADMIN",
      emailVerified: new Date(),
    },
    create: {
      email: adminEmail,
      passwordHash,
      name: "Dawn's Embrace Admin",
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
  console.log(`Seeded admin user: ${admin.email}`);

  for (const product of sampleProducts) {
    const existing = await prisma.product.findFirst({
      where: { name: product.name },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { ...product, isActive: true },
      });
      console.log(`Updated product: ${product.name}`);
    } else {
      await prisma.product.create({
        data: { ...product, isActive: true },
      });
      console.log(`Created product: ${product.name}`);
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
