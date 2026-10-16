# Dawns Embrace — Setup

Local development setup for the Dawns Embrace ecommerce app (Next.js 15 + Prisma + PostgreSQL).

## 1. Install dependencies

```powershell
npm install
```

## 2. Environment variables

Copy the template and fill in real values:

```powershell
Copy-Item .env.example .env
```

Required keys (see `.env.example` and `design.md` §10):

| Key                     | Purpose                                                        |
| ----------------------- | -------------------------------------------------------------- |
| `DATABASE_URL`          | PostgreSQL connection string (Prisma)                          |
| `NEXTAUTH_SECRET`       | NextAuth JWT signing secret (long random string)               |
| `NEXTAUTH_URL`          | App base URL (e.g. `http://localhost:3000`)                    |
| `PAYSTACK_SECRET_KEY`   | Paystack secret key (test keys for now)                        |
| `PAYSTACK_PUBLIC_KEY`   | Paystack public key (test keys for now)                        |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (product image uploads)                  |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                                             |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret                                          |
| `RESEND_API_KEY`        | Resend API key (transactional email)                           |
| `EMAIL_FROM`            | From address for transactional email                           |
| `ADMIN_EMAIL`           | Admin notification address + seeded admin login                |
| `ADMIN_PASSWORD`        | Password for the seeded admin user (used by `npm run db:seed`) |

`.env` is gitignored — never commit real secrets.

## 3. Database (PostgreSQL)

This project uses PostgreSQL via Prisma. The Prisma client is generated to
`src/generated/prisma` (configured in `prisma/schema.prisma`); regenerate it after any schema
change.

### Generate the Prisma client (no DB needed)

```powershell
npx prisma generate
```

### Run migrations and seed against a real database

With a reachable `DATABASE_URL` pointing at a running PostgreSQL instance:

```powershell
npx prisma migrate dev --name init
npx prisma db seed
```

Or via the npm scripts:

```powershell
npm run db:migrate
npm run db:seed
```

The seed creates one `ADMIN` user (from `ADMIN_EMAIL` / `ADMIN_PASSWORD`) and a handful of
sample watch products. It is idempotent — safe to run more than once.

### DB-not-reachable fallback

There is **no local Postgres (or Docker) on the current build machine**, so
`npx prisma migrate dev` and `npx prisma db seed` cannot connect to a database here and will
fail with a connection error. That is expected in this environment and does **not** indicate a
broken schema.

In that situation, schema correctness is verified with:

```powershell
npx prisma validate   # schema is valid
npx prisma generate   # client generates successfully
```

Run the `migrate` + `seed` steps above once a real `DATABASE_URL` is available (local Postgres,
Docker, or a hosted provider such as Neon/Supabase).

## 4. Run the app locally

With `.env` filled in and the database migrated + seeded:

```powershell
npm run dev
```

The app serves both the storefront and the admin dashboard at `http://localhost:3000`. Sign in
to the admin dashboard with the seeded `ADMIN_EMAIL` / `ADMIN_PASSWORD` credentials.

### Full local run flow (summary)

```powershell
Copy-Item .env.example .env   # then edit .env and supply DATABASE_URL + the other keys
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

## 5. Paystack (test mode)

Payments run in **Paystack test mode** for now (no real charges). Grab the test keys from the
Paystack dashboard (Settings → API Keys & Webhooks, with the dashboard toggled to **Test**):

- `PAYSTACK_PUBLIC_KEY` — the test public key (starts with `pk_test_`)
- `PAYSTACK_SECRET_KEY` — the test secret key (starts with `sk_test_`)

Put both in `.env`. Use a Paystack test card to complete a checkout.

### Deliver the webhook locally (tunnel)

Paystack must reach the webhook endpoint `POST /api/payments/webhook` over a public HTTPS URL,
so a local `http://localhost:3000` has to be exposed through a tunnel. With `npm run dev`
running, start a tunnel in a second terminal, e.g.:

```powershell
# ngrok
ngrok http 3000

# or cloudflared
cloudflared tunnel --url http://localhost:3000
```

The tunnel prints a public HTTPS URL (e.g. `https://<random>.ngrok-free.app`). In the Paystack
dashboard (Settings → API Keys & Webhooks → **Test** section) set the webhook URL to:

```
https://<your-tunnel-host>/api/payments/webhook
```

Notes:

- The webhook handler verifies the `x-paystack-signature` header (HMAC-SHA512 of the raw request
  body signed with `PAYSTACK_SECRET_KEY`), so the secret key in `.env` must match the dashboard
  key that signs the events.
- Payment is only ever marked paid server-side — the `payments/verify` endpoint and this webhook
  both converge on one idempotent update, so a successful payment is confirmed even if one of the
  two paths is delayed.
- The webhook runs on the Node.js runtime and reads the raw body; do not place a proxy in front
  that rewrites or re-encodes the request body, or signature verification will fail.

## 6. Verify the build

```powershell
npx prisma validate
npx prisma generate
npx tsc --noEmit
npx next lint
npx next build
```

> On Windows PowerShell, chain commands with `;` (not `&&`), and quote any path that contains a
> space (the project path `c:\Users\HP\Desktop\Dawns Embrace` has one).
