# Implementation Plan — Dawns Embrace Ecommerce

Each task is incremental and builds on the previous. Requirement references map back to
`requirements.md`.

- [ ] 1. Scaffold the Next.js project and brand theme
  - Create a Next.js (App Router) + TypeScript project with Tailwind CSS and ESLint.
  - Add brand color tokens to Tailwind (`gulf-blue #060E6E`, `persian-blue #1F27E9`,
    `brand-white #FFFFFF`) and base typography.
  - Install core deps: `prisma`, `@prisma/client`, `next-auth`, `framer-motion`,
    `bcryptjs`, `resend`, `cloudinary`, `zod`.
  - Add `.env.example` with all required keys; ensure `.env` is gitignored.
  - _Requirements: NFR config/security, Req 1 (theme)_

- [ ] 2. Set up the database and Prisma schema
  - Configure `DATABASE_URL` (local Postgres).
  - Implement the Prisma schema (User, VerificationToken, Address, Product, Order,
    OrderItem, OrderStatusEvent, Notification; enums Role, OrderStatus).
  - Run the first migration and generate the client.
  - Write a seed script: one ADMIN user (from env) + a few sample watch products.
  - _Requirements: Req 2, 4, 7, 8, 9, 10_

- [ ] 3. Authentication with Auth.js
  - Configure Auth.js Credentials provider with JWT sessions and role on the token.
  - Implement `POST /api/auth/register`: validate (zod), hash password, create user.
  - Implement login/logout and session helpers (get current user, require role).
  - Build `register` and `login` pages (brand-themed).
  - _Requirements: Req 4.1, 4.6, 4.7_

- [ ] 4. Email verification flow
  - Generate hashed, time-limited verification tokens on registration.
  - Send verification email via Resend with the verify link.
  - Implement `GET/POST /api/auth/verify` (consume token, set `emailVerified`).
  - Implement `POST /api/auth/resend-verification`.
  - Build the `verify` page handling success/expired/invalid states.
  - _Requirements: Req 4.2, 4.3, 4.4, 4.5, Req 10.1_

- [ ] 5. Product catalog (storefront, read side)
  - Implement `GET /api/products` (active products) and product queries.
  - Build the shop page (grid of watches: image, name, dial color, price).
  - Build the product detail page (images, description, stock, add-to-cart).
  - Add filtering/sorting by dial color and price; out-of-stock handling.
  - _Requirements: Req 2.1–2.5_

- [ ] 6. Cart
  - Implement a client-side cart (React context + localStorage): add, update qty, remove.
  - Show subtotal and item count; cart page with line items.
  - No auth required for cart operations.
  - _Requirements: Req 3.1–3.5_

- [ ] 7. Checkout gate + shipping address
  - Protect the checkout route: require session AND verified email; redirect/prompt
    otherwise (with resend-verification option).
  - Build the address form (validated) and save address to the account.
  - Render the server-recomputed order summary (items, totals in kobo).
  - _Requirements: Req 4.5, Req 5.1–5.4_

- [ ] 8. Order creation + Paystack payment (test mode)
  - Implement `POST /api/checkout`: re-validate stock/prices server-side, create Order
    (PENDING) + OrderItems with price snapshots, init Paystack transaction, store ref.
  - Redirect to Paystack test checkout; handle callback.
  - Implement `GET /api/payments/verify` (server-side verify, amount check).
  - Implement `POST /api/payments/webhook` (verify signature, idempotent mark-paid).
  - On verified payment: Order → PAID, set paidAt, add status event, decrement stock.
  - _Requirements: Req 6.1–6.5, Req 7.1_

- [ ] 9. Notification service
  - Implement `notify(userId, {title, body, orderId})`: write Notification row + send
    Resend email; catch/log email errors without blocking.
  - Wire "order paid" notification to the customer and the admin (ADMIN_EMAIL).
  - Build the in-app notifications view in the customer account/orders area.
  - _Requirements: Req 10.2–10.5, Req 9.2_

- [ ] 10. Customer order tracking
  - Build `orders` list and `orders/[id]` detail with a status stepper from
    OrderStatusEvent history.
  - Show current status and processing message after payment.
  - _Requirements: Req 7.2, 7.3, 7.5_

- [ ] 11. Admin dashboard — product management
  - Role-gate all `(admin)` routes and admin APIs.
  - Implement `uploads` (Cloudinary signed upload) and product create/edit/delete APIs.
  - Build admin product UI: add (with image upload), edit (price/name/stock), remove/
    deactivate. Verify storefront reflects changes.
  - _Requirements: Req 8.1–8.5, Req 10 (image via Cloudinary)_

- [ ] 12. Admin dashboard — order management + status advancement
  - Build admin order list (customer, items, total, address, status) with a new-orders
    indicator.
  - Implement `POST /api/orders/[id]/status` (validate allowed transitions) for
    approve/processing/shipped/delivered/cancel.
  - On each transition, fire the customer notification (ties to task 9).
  - _Requirements: Req 9.1, 9.3, 9.4, Req 7.4_

- [ ] 13. Landing page animation
  - Add the three brand images to `/public` (from `.kiro/specs/dawns-embrace/assets`).
  - Build the animated hero with Framer Motion: hero watch in center, brand name + motto,
    two side lineups fading in, "Proceed to Order" → `/shop`.
  - Respect `prefers-reduced-motion`; make it responsive.
  - _Requirements: Req 1.1–1.6_

- [ ] 14. End-to-end verification pass
  - Run the full flow locally: browse → cart → register → verify → checkout → Paystack
    test pay → PAID → admin advances status → customer sees updates + emails.
  - Confirm payment is only marked paid via server-side verify/webhook, signature checked,
    mark-paid idempotent, admin routes role-gated.
  - Fix issues found; ensure build and lint pass.
  - _Requirements: all; NFR security/performance/responsiveness_

> Note: tasks are coding/implementation steps. Buying the domain and deploying live
> (Vercel + managed Postgres, swapping Paystack test keys for live) happen after task 14,
> once the domain is purchased.
