"use client";

// Client-side cart: React context + localStorage. Browsing and cart require NO auth.
// Server re-validates prices/stock at checkout (see design.md §5); the client cart is
// a convenience store only.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "dawns-embrace-cart";

export type CartItem = {
  productId: string;
  name: string;
  unitPriceKobo: number;
  imageUrl: string;
  quantity: number;
};

type AddItemInput = Omit<CartItem, "quantity"> & { quantity?: number };

export type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotalKobo: number;
  addItem: (item: AddItemInput) => void;
  updateQty: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStoredItems(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (entry): entry is CartItem =>
        !!entry &&
        typeof entry === "object" &&
        typeof (entry as CartItem).productId === "string" &&
        typeof (entry as CartItem).name === "string" &&
        typeof (entry as CartItem).unitPriceKobo === "number" &&
        typeof (entry as CartItem).imageUrl === "string" &&
        typeof (entry as CartItem).quantity === "number",
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  // Start empty so SSR and the first client render agree; hydrate from storage after mount.
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStoredItems());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage write failures (e.g. private mode); cart still works in memory.
    }
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotalKobo = items.reduce(
      (sum, item) => sum + item.unitPriceKobo * item.quantity,
      0,
    );

    return {
      items,
      itemCount,
      subtotalKobo,
      addItem: ({ quantity = 1, ...rest }) => {
        if (quantity <= 0) {
          return;
        }
        setItems((prev) => {
          const existing = prev.find((i) => i.productId === rest.productId);
          if (existing) {
            return prev.map((i) =>
              i.productId === rest.productId
                ? { ...i, quantity: i.quantity + quantity }
                : i,
            );
          }
          return [...prev, { ...rest, quantity }];
        });
      },
      updateQty: (productId, quantity) => {
        setItems((prev) => {
          if (quantity <= 0) {
            return prev.filter((i) => i.productId !== productId);
          }
          return prev.map((i) =>
            i.productId === productId ? { ...i, quantity } : i,
          );
        });
      },
      removeItem: (productId) => {
        setItems((prev) => prev.filter((i) => i.productId !== productId));
      },
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
