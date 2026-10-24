import Link from "next/link";

import { BannerCarousel } from "@/components/banner-carousel";
import { ProductCard } from "@/components/product-card";
import { listActiveBanners } from "@/lib/banners";
import {
  listActiveDialColors,
  listActiveProducts,
  type ProductSort,
} from "@/lib/products";

export const dynamic = "force-dynamic";

type ShopSearchParams = {
  dialColor?: string;
  sort?: string;
};

function parseSort(value: string | undefined): ProductSort | undefined {
  return value === "price-asc" || value === "price-desc" ? value : undefined;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  const { dialColor, sort } = await searchParams;
  const selectedDialColor = dialColor?.trim() || undefined;
  const selectedSort = parseSort(sort);

  const [products, dialColors, banners] = await Promise.all([
    listActiveProducts({ dialColor: selectedDialColor, sort: selectedSort }),
    listActiveDialColors(),
    listActiveBanners(),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <BannerCarousel
        banners={banners.map((banner) => ({
          id: banner.id,
          imageUrl: banner.imageUrl,
          linkUrl: banner.linkUrl,
        }))}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gulf-blue">Shop</h1>
        <p className="mt-1 text-gray-600">A new day, a new you.</p>
      </div>

      <form
        method="get"
        className="mb-8 flex flex-wrap items-end gap-4 rounded-xl bg-brand-white p-4 shadow-sm"
      >
        <div>
          <label
            htmlFor="dialColor"
            className="block text-sm font-medium text-gray-700"
          >
            Dial colour
          </label>
          <select
            id="dialColor"
            name="dialColor"
            defaultValue={selectedDialColor ?? ""}
            className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-persian-blue focus:ring-2 focus:ring-persian-blue/30"
          >
            <option value="">All colours</option>
            {dialColors.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="sort"
            className="block text-sm font-medium text-gray-700"
          >
            Sort by price
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={selectedSort ?? ""}
            className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-persian-blue focus:ring-2 focus:ring-persian-blue/30"
          >
            <option value="">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-persian-blue px-5 py-2 font-medium text-brand-white transition hover:bg-gulf-blue"
        >
          Apply
        </button>

        {(selectedDialColor || selectedSort) && (
          <Link
            href="/shop"
            className="rounded-lg px-3 py-2 text-sm font-medium text-persian-blue hover:underline"
          >
            Clear filters
          </Link>
        )}
      </form>

      {products.length === 0 ? (
        <p className="rounded-xl bg-brand-white p-8 text-center text-gray-600 shadow-sm">
          No watches match your filters right now.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}
