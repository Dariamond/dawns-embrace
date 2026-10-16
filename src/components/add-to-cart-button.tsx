"use client";

import { useState } from "react";

import { useCart } from "@/lib/cart-context";

type AddToCartButtonProps = {
  product: {
    id: string;
    name: string;
    priceKobo: number;
    imageUrl: string;
    stock: number;
  };
  className?: string;
};

/** Add-to-cart control. Disabled and labelled "Out of stock" when stock <= 0. */
export function AddToCartButton({ product, className }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const outOfStock = product.stock <= 0;

  function handleAdd() {
    if (outOfStock) {
      return;
    }
    addItem({
      productId: product.id,
      name: product.name,
      unitPriceKobo: product.priceKobo,
      imageUrl: product.imageUrl,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  if (outOfStock) {
    return (
      <button
        type="button"
        disabled
        className={
          className ??
          "w-full cursor-not-allowed rounded-lg bg-gray-200 py-2.5 font-medium text-gray-500"
        }
      >
        Out of stock
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className={
        className ??
        "w-full rounded-lg bg-persian-blue py-2.5 font-medium text-brand-white transition hover:bg-gulf-blue"
      }
    >
      {added ? "Added ✓" : "Add to Cart"}
    </button>
  );
}
