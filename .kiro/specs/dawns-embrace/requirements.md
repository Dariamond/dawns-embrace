# Requirements — Dawns Embrace Ecommerce

## Overview

Dawns Embrace is an ecommerce ordering website for a single watch brand. The brand
sells watches (distinguished mainly by dial color). The platform has a customer-facing
storefront and a connected admin dashboard. Customers browse freely, add watches to a
cart, and must create and verify an account before checking out. Payment is handled via
Paystack (test mode for now). Orders move through tracked statuses, and both customers
and admins receive notifications (email + in-app) as the order progresses.

### Brand
- **Name:** Dawns Embrace
- **Motto:** "A new day, a new you"
- **Primary color — Gulf Blue:** `#060E6E`
- **Secondary color — Persian Blue:** `#1F27E9`
- **Accent — White:** `#FFFFFF`

### Stack (confirmed with user)
- Next.js (App Router) + TypeScript
- Tailwind CSS (themed to brand palette)
- Framer Motion (landing page animation)
- PostgreSQL + Prisma ORM
- Auth.js (NextAuth) with self-built email verification
- Paystack (test/demo mode now; live later)
- Cloudinary (product image uploads)
- Resend (transactional email)
- Deploy: local now; Vercel + managed Postgres (Neon/Supabase) when domain is ready

---

## Requirement 1: Landing page

**User story:** As a visitor, I want an animated landing page that introduces the brand,
so that I feel the premium feel of Dawns Embrace and am invited to start ordering.

### Acceptance criteria
1. WHEN the landing page loads THEN the system SHALL display a dark-themed hero with the
   main watch image animating into the center.
2. WHEN the hero appears THEN the system SHALL display the brand name "Dawns Embrace" and
   the motto "A new day, a new you" beneath it.
3. WHEN the hero animation plays THEN the system SHALL fade in two watch-lineup images,
   one on each side of the hero.
4. The system SHALL present a "Proceed to Order" button that navigates to the shop page.
5. The landing page SHALL be responsive on mobile, tablet, and desktop.
6. The animation SHALL use the brand palette (Gulf Blue / Persian Blue / White).

## Requirement 2: Product catalog / shop

**User story:** As a customer, I want to browse the available watches, so that I can
choose which to order.

### Acceptance criteria
1. WHEN a customer opens the shop page THEN the system SHALL list all available (in-stock,
   active) watch products with image, name, dial color, and price.
2. WHEN a customer selects a product THEN the system SHALL show a product detail view with
   full image(s), name, description, dial color, price, and stock availability.
3. The system SHALL allow filtering/sorting products (at minimum by dial color and price).
4. IF a product is out of stock THEN the system SHALL clearly indicate it and prevent
   adding it to the cart.
5. Browsing and viewing products SHALL NOT require authentication.

## Requirement 3: Cart

**User story:** As a customer, I want to add watches to a cart and manage it, so that I can
order multiple items together.

### Acceptance criteria
1. WHEN a customer clicks "Add to Cart" THEN the system SHALL add the item to their cart.
2. The system SHALL allow changing item quantity and removing items from the cart.
3. The system SHALL show a running subtotal and item count.
4. The cart SHALL persist for the session (and for the user's account once logged in).
5. Adding to and viewing the cart SHALL NOT require authentication.

## Requirement 4: Account creation and email verification

**User story:** As a customer, I want to create and verify an account at checkout, so that
my orders are tied to a verified identity.

### Acceptance criteria
1. WHEN a customer proceeds to checkout while unauthenticated THEN the system SHALL require
   account creation (or sign-in) before continuing.
2. WHEN a customer registers THEN the system SHALL send a verification email containing a
   unique, time-limited verification link.
3. WHEN a customer clicks a valid verification link THEN the system SHALL mark the account
   as verified and allow checkout to proceed.
4. IF a verification link is expired or invalid THEN the system SHALL reject it and offer to
   resend a new verification email.
5. The system SHALL NOT allow an unverified account to complete checkout.
6. The system SHALL securely hash passwords and never store them in plaintext.
7. The system SHALL allow sign-in and sign-out for returning customers.

## Requirement 5: Checkout and shipping address

**User story:** As a verified customer, I want to enter my shipping address and review my
order, so that I can pay and have it delivered.

### Acceptance criteria
1. WHEN a verified customer begins checkout THEN the system SHALL prompt for a shipping
   address (name, phone, street, city, state, country, postal code).
2. The system SHALL validate required address fields before allowing payment.
3. The system SHALL display an order summary (items, quantities, subtotal, shipping if any,
   total) before payment.
4. The system SHALL save the address to the customer's account for reuse.

## Requirement 6: Online payment (Paystack)

**User story:** As a verified customer, I want to pay online securely, so that my order is
confirmed.

### Acceptance criteria
1. WHEN a customer confirms the order THEN the system SHALL initialize a Paystack
   transaction (test mode) for the order total.
2. WHEN payment succeeds THEN the system SHALL verify the transaction server-side (via
   Paystack verify endpoint and/or webhook) before marking the order as paid.
3. IF payment fails or is abandoned THEN the system SHALL keep the order unpaid and allow
   the customer to retry.
4. The system SHALL create the order record with status PENDING on initiation and move it
   to PAID only after verified payment.
5. The system SHALL never trust client-side payment confirmation alone.

## Requirement 7: Order tracking and status

**User story:** As a customer, I want to track my order status, so that I know where my
order is in the fulfillment process.

### Acceptance criteria
1. The system SHALL model order status as: PENDING → PAID → APPROVED → PROCESSING →
   SHIPPED → DELIVERED (with a CANCELLED path available to admin).
2. WHEN an order's status changes THEN the system SHALL update the customer-visible order
   tracker.
3. WHEN an order is placed/paid THEN the system SHALL notify the customer that their order
   is being processed.
4. WHEN an admin approves the order THEN the system SHALL notify the customer that the
   order is approved and in processing for delivery.
5. The system SHALL show the customer a list of their orders and each order's current
   status and history.

## Requirement 8: Admin dashboard — product management

**User story:** As an admin, I want to manage the product catalog, so that the storefront
shows the right watches, prices, and stock.

### Acceptance criteria
1. The admin dashboard SHALL be accessible only to users with an admin role.
2. The system SHALL allow an admin to add a new product (name, description, dial color,
   price, stock quantity, product image).
3. WHEN an admin uploads a product image THEN the system SHALL store it via Cloudinary and
   associate the URL with the product.
4. The system SHALL allow an admin to edit a product (including price, name, stock) and to
   remove/deactivate a product.
5. Changes made in the admin dashboard SHALL be reflected on the storefront.

## Requirement 9: Admin dashboard — order management

**User story:** As an admin, I want to view and advance orders, so that I can fulfill them
and keep customers informed.

### Acceptance criteria
1. The system SHALL list all orders with customer, items, total, address, and current
   status.
2. WHEN a new order is placed THEN the system SHALL notify the admin (email and/or
   dashboard indicator).
3. The system SHALL allow an admin to advance an order's status (approve, mark processing,
   shipped, delivered) and to cancel an order.
4. WHEN an admin changes an order's status THEN the system SHALL trigger a customer
   notification for that transition.

## Requirement 10: Notifications

**User story:** As a customer and as an admin, I want timely notifications, so that both
sides stay informed about account and order events.

### Acceptance criteria
1. The system SHALL send a verification email on registration (Requirement 4).
2. The system SHALL send the customer an email and show an in-app message when their order
   is placed/paid and on each subsequent status change.
3. The system SHALL notify the admin when a new order is placed.
4. Email delivery SHALL use Resend; in-app notifications SHALL be visible in the customer's
   account/orders area.
5. IF an email fails to send THEN the system SHALL log the failure and SHALL NOT block the
   underlying order operation.

## Non-functional requirements
1. **Security:** passwords hashed; payment verified server-side; admin routes role-gated;
   secrets in environment variables, never committed.
2. **Responsiveness:** all customer pages usable on mobile.
3. **Performance:** product images optimized (Cloudinary + Next.js Image).
4. **Maintainability:** schema allows adding non-watch product categories later.
5. **Config:** Paystack/Resend/Cloudinary keys configurable via env for easy switch from
   test to live.
