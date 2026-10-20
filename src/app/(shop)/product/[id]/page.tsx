import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductGallery } from "@/components/product-gallery";
import { formatKobo } from "@/lib/money";
import { getProduct } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product || !product.isActive) {
    notFound();
  }

  const outOfStock = product.stock <= 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link
        href="/shop"
        className="text-sm font-medium text-persian-blue hover:underline"
      >
        ← Back to shop
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
        <ProductGallery
          mainImageUrl={product.imageUrl}
          name={product.name}
          images={product.images}
        />

        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-gulf-blue">{product.name}</h1>
          <p className="mt-2 text-sm text-gray-600">{product.dialColor} dial</p>

          <p className="mt-4 text-2xl font-bold text-persian-blue">
            {formatKobo(product.priceKobo)}
          </p>

          <p className="mt-6 whitespace-pre-line text-gray-700">
            {product.description}
          </p>

          <p className="mt-6 text-sm font-medium">
            {outOfStock ? (
              <span className="text-red-600">Out of stock</span>
            ) : (
              <span className="text-green-700">
                In stock ({product.stock} available)
              </span>
            )}
          </p>

          <div className="mt-6 max-w-xs">
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
    </main>
  );
}
