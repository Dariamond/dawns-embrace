# Design — Dawns Embrace Ecommerce

## 1. Architecture overview

A single Next.js (App Router) application serves both the customer storefront and the
admin dashboard, separated by route groups and protected by role-based access. Server-side
logic lives in Next.js route handlers and server actions. PostgreSQL (via Prisma) is the
single source of truth. External services (Paystack, Cloudinary, Resend) are integrated
server-side so secrets never reach the client.

```
                        ┌───────────────────────────────────────┐
                        │            Next.js (App Router)         │
                        │                                         │
   Browser  ───────────▶│  (storefront)   (admin)   (api routes)  │
                        │   route group    route      /api/*      │
                        │   /(shop)         group                 │
                        └───────┬───────────────┬─────────┬───────┘
                                │               │         │
                        ┌───────▼───────┐  ┌────▼────┐ ┌──▼─────────────┐
                        │  Prisma / PG  │  │ Auth.js │ │ Paystack        │
                        │  (orders,     │  │ session │ │ Cloudinary      │
                        │  products,    │  └─────────┘ │ Resend (email)  │
                        │  users, etc.) │              └────────────────┘
                        └───────────────┘
```

### Route structure (App Router)
```
app/
  (marketing)/
    page.tsx                 # Landing page (animated hero)
  (shop)/
    shop/page.tsx            # Product catalog
    product/[id]/page.tsx    # Product detail
    cart/page.tsx            # Cart
    checkout/page.tsx        # Address + order summary (auth + verified gate)
    orders/page.tsx          # Customer order list
    orders/[id]/page.tsx     # Order detail + tracker
  (auth)/
    login/page.tsx
    register/page.tsx
    verify/page.tsx          # Handles verification link token
  (admin)/
    admin/page.tsx           # Dashboard home (new-order indicators)
    admin/products/page.tsx  # Product CRUD + image upload
    admin/orders/page.tsx    # Order list + status advancement
  api/
    auth/[...nextauth]/route.ts
    auth/register/route.ts
    auth/verify/route.ts
    auth/resend-verification/route.ts
    products/route.ts        # GET list / POST create (admin)
    products/[id]/route.ts   # GET / PATCH / DELETE (admin)
    cart/route.ts            # cart ops (if server-persisted)
    checkout/route.ts        # create order + init Paystack
    payments/verify/route.ts # server-side Paystack verify
    payments/webhook/route.ts# Paystack webhook
    orders/route.ts          # customer orders
    orders/[id]/status/route.ts # admin status change
    uploads/route.ts         # Cloudinary signed upload
```

## 2. Stack and rationale

| Concern        | Choice                 | Rationale |
|----------------|------------------------|-----------|
| Framework      | Next.js App Router + TS| One app for store + admin, SSR for SEO, server actions for mutations |
| Styling        | Tailwind CSS           | Fast, consistent, themed to brand palette |
| Animation      | Framer Motion          | Staggered fade/float-in for landing hero |
| DB / ORM       | PostgreSQL + Prisma    | Relational data (orders, items, users), type-safe queries |
| Auth           | Auth.js (Credentials)  | Self-built verification, no vendor lock-in, free |
| Payments       | Paystack (test mode)   | Nigerian gateway, server-side verify + webhook |
| Images         | Cloudinary             | Admin uploads, optimized delivery |
| Email          | Resend                 | Transactional email (verification + order status) |
| Hosting        | Vercel + Neon/Supabase | When domain is ready |

### Theming
Tailwind config exposes brand tokens:
```
colors: {
  'gulf-blue':   '#060E6E',  // primary
  'persian-blue':'#1F27E9',  // secondary
  'brand-white': '#FFFFFF',  // accent
}
```
Dark base for landing/hero; light surfaces for shop/admin where readability matters.

## 3. Data model (Prisma)

```prisma
enum Role { CUSTOMER ADMIN }

enum OrderStatus {
  PENDING      // created, not yet paid
  PAID         // payment verified
  APPROVED     // admin approved
  PROCESSING   // being prepared
  SHIPPED
  DELIVERED
  CANCELLED
}

model User {
  id                 String    @id @default(cuid())
  email              String    @unique
  passwordHash       String
  name               String?
  role               Role      @default(CUSTOMER)
  emailVerified      DateTime?
  verificationTokens VerificationToken[]
  addresses          Address[]
  orders             Order[]
  notifications      Notification[]
  createdAt          DateTime  @default(now())
}

model VerificationToken {
  id        String   @id @default(cuid())
  token     String   @unique          // hashed token value
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model Address {
  id         String  @id @default(cuid())
  userId     String
  user       User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  fullName   String
  phone      String
  street     String
  city       String
  state      String
  country    String  @default("Nigeria")
  postalCode String?
  isDefault  Boolean @default(false)
}

model Product {
  id          String   @id @default(cuid())
  name        String
  description String
  dialColor   String                     // e.g. "Blue", "Green"
  category    String   @default("watch") // flexible for future product types
  priceKobo   Int                        // price in kobo (NGN minor unit)
  stock       Int      @default(0)
  imageUrl    String                     // Cloudinary URL
  imagePublicId String?                  // Cloudinary public id (for deletion)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  orderItems  OrderItem[]
}

model Order {
  id            String      @id @default(cuid())
  userId        String
  user          User        @relation(fields: [userId], references: [id])
  items         OrderItem[]
  addressId     String?
  address       Address?    @relation(fields: [addressId], references: [id])
  status        OrderStatus @default(PENDING)
  totalKobo     Int
  paystackRef   String?     @unique      // transaction reference
  paidAt        DateTime?
  statusHistory OrderStatusEvent[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model OrderItem {
  id             String  @id @default(cuid())
  orderId        String
  order          Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId      String
  product        Product @relation(fields: [productId], references: [id])
  nameSnapshot   String                  // name at purchase time
  unitPriceKobo  Int                     // price at purchase time
  quantity       Int
}

model OrderStatusEvent {
  id        String      @id @default(cuid())
  orderId   String
  order     Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  status    OrderStatus
  note      String?
  createdAt DateTime    @default(now())
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String
  body      String
  orderId   String?
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

**Note on money:** store prices as integer **kobo** (NGN minor unit) to avoid float errors.
Paystack expects amounts in kobo. OrderItem snapshots name + price so historical orders
stay correct even if a product later changes.

**Address relation:** add `addresses Address[]` back-relation on `Order`? No — an order
references one address; `Address` gets an `orders Order[]` back-relation implicitly via the
`Order.address` field. (Prisma will prompt for the back-relation; it will be added during
implementation.)

## 4. Authentication and verification flow

Auth.js with the Credentials provider; sessions as JWT.

**Registration**
1. `POST /api/auth/register` with email, password, name.
2. Server validates, hashes password (bcrypt/argon2), creates `User` (emailVerified = null).
3. Server generates a random token, stores its **hash** in `VerificationToken` with a
   24-hour `expiresAt`, and emails the raw token as a link via Resend:
   `/(auth)/verify?token=...`.
4. Response: "check your email".

**Verification**
1. `GET/POST /api/auth/verify?token=...` hashes the incoming token, looks it up.
2. If found and not expired → set `user.emailVerified = now()`, delete the token.
3. If expired/invalid → error + offer `POST /api/auth/resend-verification`.

**Checkout gate**
- `checkout` page is a protected server component: requires a session AND
  `emailVerified != null`. Unauthenticated → redirect to `register`/`login`. Authenticated
  but unverified → prompt to verify (with resend).

**Admin gate**
- `(admin)` routes and `/api/.../admin` handlers check `session.user.role === 'ADMIN'`.
  First admin is seeded via a script/env.

**Security:** passwords hashed with bcrypt (cost ≥ 10) or argon2; verification tokens stored
hashed; tokens single-use and time-limited.

## 5. Cart design

- Client-side cart (React context + `localStorage`) for guest browsing — no auth needed.
- On reaching checkout (after auth), cart contents are sent to the server to create the
  order; server re-reads product prices/stock from the DB (never trusts client prices).
- Optional later: persist cart server-side per user. v1 uses client cart + server-side
  validation at checkout.

## 6. Checkout and payment flow (Paystack, test mode)

```
Customer confirms order
        │
        ▼
POST /api/checkout
  - verify session + emailVerified
  - re-fetch products, validate stock, recompute total (kobo) server-side
  - create Order (status PENDING) + OrderItems (price snapshots)
  - init Paystack transaction (amount, email, metadata.orderId) → authorization_url + ref
  - save paystackRef on order
        │
        ▼
Redirect customer to Paystack checkout (test keys)
        │
        ▼
Paystack redirects back to /checkout/callback?reference=...
        │
        ├──▶ GET /api/payments/verify?reference=...  (server-side verify)
        │       - call Paystack verify endpoint
        │       - if success & amount matches: Order → PAID, set paidAt,
        │         add OrderStatusEvent, decrement stock,
        │         notify customer (email+in-app) + notify admin
        │
        └──▶ POST /api/payments/webhook  (Paystack server-to-server, source of truth)
                - verify signature (x-paystack-signature, HMAC SHA512 with secret)
                - idempotent: mark PAID only once per ref
```

- **Server-side verification is authoritative.** The callback verify and the webhook both
  converge on the same idempotent "mark paid" routine (guard on `paidAt == null`).
- Amount is checked against the order total to prevent tampering.
- Keys from env: `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` (test now, swap to live later).

## 7. Order status and tracking

- Status transitions are admin-driven after PAID:
  `PAID → APPROVED → PROCESSING → SHIPPED → DELIVERED` (+ `CANCELLED`).
- `POST /api/orders/[id]/status` (admin only): validates the transition is allowed, writes
  the new `Order.status`, appends an `OrderStatusEvent`, and fires a customer notification.
- Customer order detail page renders a stepper from `OrderStatusEvent` history.

## 8. Notification system

A single `notify(userId, {title, body, orderId})` service that:
1. Writes a `Notification` row (in-app).
2. Sends an email via Resend (templated per event).
3. Catches and logs email errors without throwing (NFR: email failure must not block the
   order operation).

**Events:**
| Event                     | Customer notified | Admin notified |
|---------------------------|-------------------|----------------|
| Registration              | verification email| —              |
| Order paid                | yes (email+in-app)| yes            |
| Status: APPROVED          | yes               | —              |
| Status: PROCESSING/SHIPPED/DELIVERED | yes    | —              |
| Status: CANCELLED         | yes               | —              |

Admin notification on new order: email to an `ADMIN_EMAIL` env address + a dashboard
"new orders" indicator (count of orders in PAID not yet APPROVED).

## 9. Landing page animation

Framer Motion staggered sequence on a dark hero section:
1. `t0`: main hero watch image (image 3) scales + fades in to center (`opacity 0→1`,
   `y: 40→0`, slight `scale 0.9→1`).
2. `t1`: "Dawns Embrace" wordmark fades/rises in; motto "A new day, a new you" follows.
3. `t2`: left lineup image (image 1) fades in from the left (`x: -40→0`); right lineup
   image (image 2) fades in from the right (`x: 40→0`).
4. `t3`: "Proceed to Order" button fades in; links to `/shop`.

Uses `motion.div` with `variants` + `staggerChildren`. Respects `prefers-reduced-motion`
(fallback to static layout). Images served via Next.js `Image` from `/public` (or Cloudinary
later).

## 10. Environment variables

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
RESEND_API_KEY=...
EMAIL_FROM="Dawns Embrace <noreply@dawnsembrace.example>"
ADMIN_EMAIL=admin@dawnsembrace.example
```
All secrets via `.env` (gitignored); test values now, live values at deploy.

## 11. Testing & verification approach
- Prisma migrations run cleanly; seed script creates an admin + sample products.
- Manual flow test: browse → cart → register → verify (link) → checkout → Paystack test pay
  → order PAID → admin advances status → customer sees updates + emails.
- Payment verified only server-side; webhook signature validated; mark-paid idempotent.
