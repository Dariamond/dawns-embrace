// Site-wide settings the admin controls, stored in the SiteSetting key/value
// table. Currently: the intro video shown between the landing page and the shop.

import { prisma } from "@/lib/prisma";

/** Setting keys. Keep as string literals so callers can't typo a key. */
export const SETTING_KEYS = {
  introVideo: "intro_video",
} as const;

export type IntroVideo = {
  url: string;
  publicId: string | null;
};

/**
 * Returns the configured intro video, or null if none is set. The /intro page
 * uses null to mean "skip straight to the shop".
 */
export async function getIntroVideo(): Promise<IntroVideo | null> {
  const row = await prisma.siteSetting.findUnique({
    where: { key: SETTING_KEYS.introVideo },
  });
  if (!row?.value) {
    return null;
  }
  return { url: row.value, publicId: row.publicId ?? null };
}

/**
 * Sets (or replaces) the intro video. Returns the previous publicId, if any, so
 * the caller can delete the old Cloudinary asset after a successful swap.
 */
export async function setIntroVideo(
  url: string,
  publicId: string | null,
): Promise<{ previousPublicId: string | null }> {
  const existing = await prisma.siteSetting.findUnique({
    where: { key: SETTING_KEYS.introVideo },
  });

  await prisma.siteSetting.upsert({
    where: { key: SETTING_KEYS.introVideo },
    update: { value: url, publicId },
    create: { key: SETTING_KEYS.introVideo, value: url, publicId },
  });

  return { previousPublicId: existing?.publicId ?? null };
}

/** Clears the intro video. Returns the removed publicId for Cloudinary cleanup. */
export async function clearIntroVideo(): Promise<{
  removedPublicId: string | null;
}> {
  const existing = await prisma.siteSetting.findUnique({
    where: { key: SETTING_KEYS.introVideo },
  });
  if (!existing) {
    return { removedPublicId: null };
  }
  await prisma.siteSetting.delete({
    where: { key: SETTING_KEYS.introVideo },
  });
  return { removedPublicId: existing.publicId ?? null };
}
