// Email verification tokens. The raw token is emailed to the user; only its
// sha256 hash is stored. Tokens expire after 24h and are single-use.

import { createHash, randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Creates a verification token for a user. Returns the RAW token (to embed in
 * the email link); the DB stores only the sha256 hash.
 */
export async function createVerificationToken(userId: string): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  const token = hashToken(raw);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.verificationToken.create({
    data: { token, userId, expiresAt },
  });

  return raw;
}

/**
 * Consumes a raw verification token: hashes + looks it up, checks expiry, and
 * deletes it on success (single-use). Returns the owning userId, or null if the
 * token is invalid or expired.
 */
export async function consumeVerificationToken(
  raw: string,
): Promise<string | null> {
  if (!raw) {
    return null;
  }

  const token = hashToken(raw);
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record) {
    return null;
  }

  if (record.expiresAt.getTime() < Date.now()) {
    // Expired — clean it up and reject.
    await prisma.verificationToken.delete({ where: { token } });
    return null;
  }

  // Single-use: delete on successful consume.
  await prisma.verificationToken.delete({ where: { token } });
  return record.userId;
}
