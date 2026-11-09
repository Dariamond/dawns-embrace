import Image from "next/image";
import Link from "next/link";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { formatKobo } from "@/lib/money";
import type { Product } from "@/generated/prisma";

/** Storefront product card: image, name, dial color, price, add-to-cart. */
export function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stock <= 0;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-brand-white shadow-md transition hover:shadow-xl">
      <Link
        href={`/product/${product.id}`}
        className="relative block aspect-square w-full bg-gray-100"
      >
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 1024px) 50vw, 25vw"
          className="object-cover"
        />
        {outOfStock && (
          <span className="absolute left-3 top-3 rounded-full bg-gulf-blue px-3 py-1 text-xs font-medium text-brand-white">
            Out of stock
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <Link href={`/product/${product.id}`} className="flex-1">
          <h3 className="text-sm font-semibold text-gulf-blue sm:text-lg">
            {product.name}
          </h3>
          <p className="mt-1 text-xs text-gray-600 sm:text-sm">
            {product.dialColor} dial
          </p>
        </Link>

        <p className="mt-2 text-base font-bold text-persian-blue sm:mt-3 sm:text-xl">
          {formatKobo(product.priceKobo)}
        </p>

        <div className="mt-3 sm:mt-4">
          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              priceKobo: product.priceKobo,
              imageUrl: product.imageUrl,
              stock: product.stock,
            }}
          />
        </div>
      </div>
    </div>
  );
}
