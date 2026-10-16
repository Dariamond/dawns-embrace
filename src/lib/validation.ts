// Shared zod schemas (reused across auth, checkout, admin product, and order APIs).

import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password is too long."),
  name: z.string().trim().min(1, "Name is required.").max(120).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const addressSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required.").max(120),
  phone: z.string().trim().min(1, "Phone number is required.").max(32),
  street: z.string().trim().min(1, "Street is required.").max(200),
  city: z.string().trim().min(1, "City is required.").max(120),
  state: z.string().trim().min(1, "State is required.").max(120),
  country: z.string().trim().min(1).max(120).default("Nigeria"),
  postalCode: z.string().trim().max(32).optional(),
  isDefault: z.boolean().optional(),
});
export type AddressInput = z.infer<typeof addressSchema>;

export const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(200),
  description: z.string().trim().min(1, "Description is required.").max(2000),
  dialColor: z.string().trim().min(1, "Dial color is required.").max(60),
  category: z.string().trim().min(1).max(60).default("watch"),
  priceKobo: z
    .number()
    .int("Price must be an integer number of kobo.")
    .positive("Price must be greater than zero."),
  stock: z.number().int().min(0, "Stock cannot be negative."),
  imageUrl: z.string().trim().url("Image URL must be a valid URL."),
  imagePublicId: z.string().trim().max(200).optional(),
  isActive: z.boolean().optional(),
});
export type ProductInput = z.infer<typeof productSchema>;

// Partial update schema for admin edits (price/name/stock/isActive, etc.).
// At least one field must be present so a no-op PATCH is rejected.
export const productUpdateSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(200),
    description: z.string().trim().min(1, "Description is required.").max(2000),
    dialColor: z.string().trim().min(1, "Dial color is required.").max(60),
    category: z.string().trim().min(1).max(60),
    priceKobo: z
      .number()
      .int("Price must be an integer number of kobo.")
      .positive("Price must be greater than zero."),
    stock: z.number().int().min(0, "Stock cannot be negative."),
    imageUrl: z.string().trim().url("Image URL must be a valid URL."),
    imagePublicId: z.string().trim().max(200).nullable(),
    isActive: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields to update.",
  });
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

export const orderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "PAID",
    "APPROVED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ]),
  note: z.string().trim().max(500).optional(),
});
export type OrderStatusInput = z.infer<typeof orderStatusSchema>;
