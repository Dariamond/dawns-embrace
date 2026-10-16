// Typed environment variable accessors (design.md §10).
// Required vars throw a clear error at the point of use (not at module import),
// so that build-time code paths that never touch a given var don't break.

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        `Set it in your .env file (see .env.example).`,
    );
  }
  return value;
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined;
}

export const env = {
  // Database
  get databaseUrl(): string {
    return required("DATABASE_URL");
  },

  // Auth.js / NextAuth
  get nextAuthSecret(): string {
    return required("NEXTAUTH_SECRET");
  },
  get nextAuthUrl(): string {
    return required("NEXTAUTH_URL");
  },

  // Paystack
  get paystackSecretKey(): string {
    return required("PAYSTACK_SECRET_KEY");
  },
  get paystackPublicKey(): string {
    return required("PAYSTACK_PUBLIC_KEY");
  },

  // Cloudinary
  get cloudinaryCloudName(): string {
    return required("CLOUDINARY_CLOUD_NAME");
  },
  get cloudinaryApiKey(): string {
    return required("CLOUDINARY_API_KEY");
  },
  get cloudinaryApiSecret(): string {
    return required("CLOUDINARY_API_SECRET");
  },

  // Resend (email)
  get resendApiKey(): string {
    return required("RESEND_API_KEY");
  },
  get emailFrom(): string {
    return required("EMAIL_FROM");
  },

  // Admin
  get adminEmail(): string {
    return required("ADMIN_EMAIL");
  },
  get adminPassword(): string {
    return required("ADMIN_PASSWORD");
  },

  // Optional accessors (no throw) — handy where a sensible fallback exists.
  optional,
} as const;
