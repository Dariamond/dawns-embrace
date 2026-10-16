import type { ReactNode } from "react";

import { ShopNav } from "@/components/shop-nav";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <ShopNav />
      {children}
    </div>
  );
}
