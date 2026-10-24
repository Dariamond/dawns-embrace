// Admin · Banners. Manage the auto-rotating promotional carousel at the top of
// the shop page. Role-gating is enforced by the (admin) layout.

import { BannerManager } from "@/components/admin/banner-manager";
import { listAllBanners } from "@/lib/banners";

export const dynamic = "force-dynamic";

export default async function BannersPage() {
  const banners = await listAllBanners();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Banners</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage the promotional banners that rotate at the top of the Dawn&apos;s
          Embrace shop page. Only active banners appear, in the order shown here.
        </p>
      </div>

      <section className="max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <BannerManager
          banners={banners.map((banner) => ({
            id: banner.id,
            imageUrl: banner.imageUrl,
            linkUrl: banner.linkUrl,
            sortOrder: banner.sortOrder,
            isActive: banner.isActive,
          }))}
        />
      </section>
    </div>
  );
}
