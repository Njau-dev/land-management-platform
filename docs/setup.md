# Land Management Platform — Local Development Setup

This document explains how to set up and run the Land Management Platform locally.

## 1. Technology Stack

### Frontend

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS 4

### Backend

* Node.js
* Express 5
* TypeScript
* Prisma 7
* MySQL 8

### Authentication

* JWT access tokens
* Persisted refresh tokens
* HttpOnly refresh-token cookies

### Payments

* Safaricom M-Pesa Daraja Sandbox
* STK Push
* Sandbox-only simulated payment confirmation

---

# 2. Prerequisites

Install the following before starting:

* Node.js 22+
* npm 12+
* MySQL 8+
* Git
* OpenSSL

Verify:

```bash
node -v
npm -v
mysql --version
git --version
openssl version
```

The project was developed using approximately:

```text
Node.js 22
npm 12
MySQL 8
Prisma 7.9
```

---

# 3. Clone and Install

Clone the repository:

```bash
git clone <repository-url>
cd land-management-platform
```

Install workspace dependencies:

```bash
npm install
```

The repository uses npm workspaces for:

```text
apps/web
apps/api
packages/shared
```

---

# 4. npm Install Script Approval

With npm versions that restrict dependency lifecycle scripts, Prisma and some supporting packages may require approval.

Check:

```bash
npm install-scripts ls
```

If Prisma-related packages are reported as unreviewed, approve the required packages:

```bash
npm install-scripts approve \
  prisma \
  @prisma/engines \
  esbuild \
  unrs-resolver
```

Verify:

```bash
npx prisma -v
```

Prisma CLI and `@prisma/client` should use compatible Prisma 7 versions.

---

# 5. Environment Files

The project separates real local environment configuration from committed examples.

## Backend

Copy:

```bash
cp apps/api/.env.example apps/api/.env
```

Configure `apps/api/.env`.

Example:

```env
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000

DATABASE_URL="mysql://YOUR_USER:YOUR_PASSWORD@localhost:3306/land_management"
SHADOW_DATABASE_URL="mysql://YOUR_USER:YOUR_PASSWORD@localhost:3306/land_management_shadow"

JWT_ACCESS_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<different-generated-secret>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

SEED_ADMIN_NAME=Development Admin
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=<strong-development-password>

MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=<daraja-sandbox-consumer-key>
MPESA_CONSUMER_SECRET=<daraja-sandbox-consumer-secret>
MPESA_SHORTCODE=<daraja-sandbox-shortcode>
MPESA_PASSKEY=<daraja-sandbox-passkey>
MPESA_CALLBACK_URL=https://example.com/api/v1/payments/mpesa/callback
MPESA_SIMULATE_CALLBACK=true
```

Never commit the real `.env` file.

## Frontend

Copy:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Expected development configuration:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

---

# 6. Generate JWT Secrets

Generate two independent high-entropy secrets:

```bash
echo "JWT_ACCESS_SECRET=$(openssl rand -base64 64)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 64)"
```

Place the resulting values only in:

```text
apps/api/.env
```

Do not put real secrets in `.env.example`.

---

# 7. MySQL Database Setup

The application uses two local databases:

```text
land_management
land_management_shadow
```

The shadow database is required by Prisma development migrations.

Login to MySQL as a privileged user:

```bash
mysql -u root -p
```

Create the databases:

```sql
CREATE DATABASE land_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE DATABASE land_management_shadow
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Grant an existing application user access.

Example:

```sql
GRANT ALL PRIVILEGES ON land_management.* TO 'YOUR_USER'@'localhost';
GRANT ALL PRIVILEGES ON land_management_shadow.* TO 'YOUR_USER'@'localhost';

FLUSH PRIVILEGES;
```

Exit:

```sql
EXIT;
```

Verify access:

```bash
mysql -u YOUR_USER -p land_management \
  -e "SELECT DATABASE() AS current_database;"

mysql -u YOUR_USER -p land_management_shadow \
  -e "SELECT DATABASE() AS current_database;"
```

---

# 8. Prisma Setup

Prisma configuration is owned by the backend:

```text
apps/api/prisma.config.ts
apps/api/prisma/schema.prisma
apps/api/prisma/migrations/
apps/api/prisma/seed.ts
apps/api/prisma/seeders/
```

The generated Prisma client is located at:

```text
apps/api/generated/prisma
```

## Validate the schema

```bash
cd apps/api
npx prisma validate
cd ../..
```

## Apply migrations

For a fresh local development database:

```bash
cd apps/api
npx prisma migrate dev
cd ../..
```

Check migration status:

```bash
cd apps/api
npx prisma migrate status
cd ../..
```

## Generate Prisma Client

Prisma 7 generation is explicit:

```bash
cd apps/api
npx prisma generate
cd ../..
```

---

# 9. Seed Development Data

Before seeding, configure these variables in `apps/api/.env`:

```env
SEED_ADMIN_NAME=
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
```

Then run:

```bash
npm run db:seed --workspace=api
```

The seed process creates development data including:

* Weekly subscription plan — KSh 200
* Monthly subscription plan — KSh 600
* Annual subscription plan — KSh 6,000
* Development administrator
* Synthetic title deeds
* Zoning records
* Loan/lien records
* Ownership history

All seeded land information is synthetic development data.

The system must not be represented as an official land registry.

The seed process is designed to be idempotent and can be run more than once without duplicating the deterministic seed records.

---

# 10. M-Pesa Daraja Sandbox

Create a sandbox application through the Safaricom Daraja developer portal.

Configure:

```env
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=
MPESA_SIMULATE_CALLBACK=true
```

The current MVP payment implementation is intentionally sandbox-only.

The flow is:

```text
User selects plan
        ↓
Backend initiates real Daraja sandbox STK Push
        ↓
Daraja accepts the STK request
        ↓
Payment becomes pending
        ↓
Sandbox confirmation simulator runs
        ↓
Payment becomes successful
        ↓
Subscription entitlement is created or extended
```

The STK Push itself is real Daraja sandbox communication.

Only payment confirmation is simulated for local development because publicly reachable HTTPS callback infrastructure is not required for the MVP demonstration.

The simulator is prohibited when the environment is configured for production.

Do not collect an M-Pesa PIN through the web application.

---

# 11. Start Development

From the repository root:

```bash
npm run dev
```

This starts both applications.

Frontend:

```text
http://localhost:3000
```

Backend:

```text
http://localhost:4000
```

API base URL:

```text
http://localhost:4000/api/v1
```

---

# 12. Verify the Installation

## Frontend

```bash
curl -I http://localhost:3000
```

Expected:

```text
HTTP/1.1 200 OK
```

## Backend and Database

```bash
curl http://localhost:4000/api/v1/health
```

Expected:

```json
{
  "status": "ok",
  "api": "up",
  "database": "up"
}
```

If both checks succeed, the frontend, backend, Prisma connection, and MySQL database are running correctly.

---

# 13. Important Application Routes

## Public

```text
/
/signup
/login
/forgot-password
```

## User

```text
/dashboard
```

The dashboard is available after authentication even without a subscription.

The platform follows the rule:

> Authentication unlocks the dashboard. Subscription unlocks operations.

Title deed searches and PDF reports require an active paid entitlement.

## Admin

```text
/admin/login
/admin
/admin/users
/admin/title-deeds
/admin/zoning
/admin/loans
/admin/ownership-history
```

Admin accounts are internally provisioned and cannot be created through public signup.

---

# 14. Main API Areas

The backend API is namespaced under:

```text
/api/v1
```

Major modules include:

```text
/auth
/plans
/subscription
/payments
/land
/admin
```

Important examples:

```text
GET  /api/v1/health
GET  /api/v1/plans

POST /api/v1/auth/signup
POST /api/v1/auth/login
POST /api/v1/auth/admin/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/me

GET  /api/v1/subscription

POST /api/v1/payments/mpesa/initiate
GET  /api/v1/payments
GET  /api/v1/payments/:paymentId/status

GET  /api/v1/land/search/:titleDeedNumber
GET  /api/v1/land/search/:titleDeedNumber/report

GET  /api/v1/admin/analytics
```

Additional admin CRUD routes exist under `/api/v1/admin`.

---

# 15. Validation Commands

## Backend typecheck

```bash
npm run typecheck -w apps/api
```

## Backend build

```bash
npm run build -w apps/api
```

## Backend tests

```bash
npm test -w apps/api
```

## Frontend lint

```bash
npm run lint -w apps/web
```

## Frontend build

```bash
npm run build -w apps/web
```

## Complete root build

```bash
npm run build
```

## Prisma status

```bash
cd apps/api
npx prisma migrate status
cd ../..
```

---

# 16. Development Data Disclaimer

The current MVP uses locally seeded synthetic land information.

It is designed to demonstrate:

* land availability lookup
* estimated land rate lookup
* zoning information
* loans and liens
* ownership history
* PDF search reports
* subscriptions
* M-Pesa STK Push
* administration workflows

The MVP is not currently connected to an official government land registry.

Any future production deployment requiring authoritative land information must integrate with the appropriate official or authorized registry/data source.

---

# 17. Troubleshooting

## Prisma reports an empty database

For a new project, do not use `prisma db pull` to create the schema.

Apply the existing migrations instead:

```bash
cd apps/api
npx prisma migrate dev
npx prisma generate
cd ../..
```

## Prisma migrate cannot create a shadow database

Ensure:

```text
SHADOW_DATABASE_URL
```

points to `land_management_shadow` and that the configured MySQL user has privileges on that database.

## Prisma Client is missing

Run:

```bash
cd apps/api
npx prisma generate
cd ../..
```

## API health reports the database down

Check:

* MySQL service is running
* `DATABASE_URL`
* MySQL username/password
* database permissions
* `land_management` exists

## Frontend cannot communicate with API

Confirm:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

and:

```env
FRONTEND_URL=http://localhost:3000
```

Then restart both development servers.

## M-Pesa STK Push fails

Check:

* Consumer Key
* Consumer Secret
* shortcode
* passkey
* sandbox environment
* phone number format
* internet access
* current Daraja sandbox availability

Do not log or expose Daraja credentials while debugging.
