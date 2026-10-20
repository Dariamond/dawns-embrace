// Admin · Site Settings. Currently: the intro video shown between the landing
// page and the shop. Role-gating is enforced by the (admin) layout.

import { IntroVideoForm } from "@/components/admin/intro-video-form";
import { getIntroVideo } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const intro = await getIntroVideo();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Site Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage site-wide content. The intro video plays after the landing page
          when a customer taps “Proceed to Order,” before the shop.
        </p>
      </div>

      <section className="max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium">Intro video</h2>
        <p className="mt-1 text-sm text-gray-600">
          Upload a short brand video (MP4 or MOV recommended). If no video is
          set, customers go straight to the shop.
        </p>
        <div className="mt-5">
          <IntroVideoForm
            currentUrl={intro?.url ?? null}
          />
        </div>
      </section>
    </div>
  );
}
