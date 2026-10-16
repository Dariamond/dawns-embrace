// Admin product management: add a product (with Cloudinary image upload) and a
// table of all products with inline edit + deactivate. Lists ALL products
// (active and inactive) so admins can see what they've hidden.

import { ProductForm } from "@/components/admin/product-form";
import { ProductRow } from "@/components/admin/product-row";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-gulf-blue">Products</h1>
      <p className="mt-1 text-sm text-gray-500">
        Add new watches and manage prices, stock, and availability.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[360px_1fr]">
        <section className="rounded-xl bg-brand-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gulf-blue">Add product</h2>
          <div className="mt-4">
            <ProductForm />
          </div>
        </section>

        <section className="rounded-xl bg-brand-white shadow-sm">
          <h2 className="px-4 pt-6 text-lg font-semibold text-gulf-blue">
            Catalog
          </h2>
          {products.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500">
              No products yet. Add your first watch on the left.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Dial</th>
                    <th className="px-4 py-2 font-medium">Price</th>
                    <th className="px-4 py-2 font-medium">Stock</th>
                    <th className="px-4 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <ProductRow
                      key={product.id}
                      product={{
                        id: product.id,
                        name: product.name,
                        dialColor: product.dialColor,
                        priceKobo: product.priceKobo,
                        stock: product.stock,
                        isActive: product.isActive,
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
