// Interstitial brand video shown between the landing page and the shop.
// Server component: reads the admin-configured intro video. If none is set,
// redirect straight to /shop so the flow never dead-ends on a missing video.

import { redirect } from "next/navigation";

import { IntroPlayer } from "@/components/intro-player";
import { getIntroVideo } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function IntroPage() {
  const intro = await getIntroVideo();

  if (!intro) {
    redirect("/shop");
  }

  return <IntroPlayer src={intro.url} />;
}
