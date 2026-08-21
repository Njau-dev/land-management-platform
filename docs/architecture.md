# Land Management Platform — System Design & Architecture

**Status:** Approved for implementation
**Architecture version:** 1.0
**Frontend:** Next.js + TypeScript
**Backend:** Node.js + Express 5 + TypeScript
**ORM:** Prisma
**Database:** MySQL
**Payments:** Safaricom M-Pesa Daraja API

---

## 1. Product Overview

The Land Management Platform is a subscription-based web application that allows registered users to search land information using a title deed number.

The platform provides:

1. Land availability status
2. Estimated/current land market rate
3. Zoning classification
4. Loan, lien, and overdue-payment status
5. Ownership history
6. Downloadable PDF land search report

For the MVP, land registry information is stored as seeded application data. No external land registry integration is required.

The architecture should nevertheless keep land-data access behind backend services so a real registry or external API can replace or supplement seeded data later without redesigning the frontend.

---

## 2. User Types

### Visitor

Can access:

* Landing page
* Platform information
* Feature information
* Pricing
* Login
* Signup

Visitors cannot access the dashboard or search functionality.

### Registered User

A registered user may log into the application regardless of whether they have purchased a subscription.

Without an active subscription they can access:

* Dashboard
* Account/profile
* Current subscription status
* Pricing plans
* Subscription/payment UI
* Preview of platform functionality

They cannot:

* Perform title deed searches
* View land lookup results
* Generate PDF reports

The dashboard should therefore demonstrate what the product provides while clearly displaying that searching requires an active subscription.

### Subscriber

A subscriber is a registered user with a currently valid subscription entitlement.

They can access:

* Dashboard
* Title deed searches
* Availability information
* Market rate
* Zoning information
* Encumbrance/loan information
* Ownership history
* PDF search reports
* Account and subscription information

### Administrator

Administrators use a separate `/admin` area.

They can:

* Log into the admin portal
* View basic platform analytics
* View users
* Suspend/reactivate users
* Inspect user subscription information
* Manage seeded title deed information
* Manage zoning information
* Manage loans/liens
* Manage ownership history

Admin accounts are provisioned internally and cannot be created through public signup.

---

## 3. User Journey

### Standard Signup Flow

```text
Landing Page
    ↓
Sign Up
    ↓
Account Created
    ↓
Subscription Plans
    ↓
User may subscribe immediately
    OR
Skip to Dashboard
    ↓
Dashboard Preview
```

Signing up does not require immediate payment.

### Pricing CTA Flow

```text
Landing Page
    ↓
Choose Plan
    ↓
Sign Up / Login
    ↓
Previously selected plan retained
    ↓
M-Pesa Payment
    ↓
Dashboard with access unlocked
```

A visitor clicking a pricing plan is first taken through authentication.

Payment is only initiated after an authenticated user exists.

### Returning User Without Subscription

```text
Login
   ↓
Dashboard
   ↓
Search UI visible but locked
   ↓
Choose Subscription
   ↓
Pay with M-Pesa
   ↓
Search operations unlocked
```

### Returning Subscriber

```text
Login
   ↓
Dashboard
   ↓
Search title deed
   ↓
View complete land information
   ↓
Optional PDF report download
```

---

## 4. Subscription Plans

All paid plans provide exactly the same product features.

They differ only by access duration and price.

| Plan    |     Price | Access Period |
| ------- | --------: | ------------- |
| Weekly  |   KSh 200 | 1 week        |
| Monthly |   KSh 600 | 1 month       |
| Annual  | KSh 6,000 | 1 year        |

The frontend should highlight the savings offered by longer plans.

For example:

* Monthly: cheaper than repeatedly purchasing weekly access
* Annual: saves KSh 1,200 compared with twelve KSh 600 monthly payments

Plans are stored centrally in the database and initially created through backend seeders.

Plan amounts should be stored as integer Kenyan shillings rather than floating-point monetary values.

---

## 5. Subscription Entitlement Model

A user does not need an active subscription to authenticate or enter their dashboard.

Subscription validation occurs when the user attempts a paid operation.

Paid operations include:

* Searching a title deed
* Retrieving protected search results
* Generating a PDF report

The backend remains the authority for entitlement state.

JWT claims must not be treated as the authoritative source for current subscription status because subscription status can expire or change while a token remains valid.

Protected paid routes therefore perform:

```text
Authenticate User
      ↓
Check User Status
      ↓
Check Current Subscription in Database
      ↓
Permit Operation
```

A valid subscription exists when the current date/time falls inside a successfully paid subscription period.

---

## 6. Subscription Renewal

Subscriptions are prepaid access periods rather than automatic recurring billing.

When another subscription is purchased:

### Expired or no existing subscription

The purchased period begins immediately.

### Existing active subscription

The additional purchased period begins from the end of the user's existing entitlement rather than discarding remaining access.

Example:

```text
Current entitlement ends: September 20

User purchases monthly plan on September 10

New entitlement ends: October 20
```

This prevents users from losing already-paid access when renewing early.

---

## 7. M-Pesa Daraja Payment Architecture

M-Pesa Daraja is the payment provider for the MVP.

The primary payment flow uses M-Pesa STK Push.

```text
User selects plan
      ↓
Frontend submits phone + plan
      ↓
Backend creates pending payment
      ↓
Backend initiates Daraja STK Push
      ↓
User receives prompt on phone
      ↓
User enters M-Pesa PIN
      ↓
Safaricom processes payment
      ↓
Daraja callback → Backend
      ↓
Backend reconciles payment
      ↓
Payment marked successful
      ↓
Subscription entitlement created/extended
      ↓
Frontend sees subscription active
```

The frontend must never activate a subscription based solely on the initial STK Push request succeeding.

Only successful backend payment confirmation may grant access.

### Payment states

Recommended states:

* `INITIATED`
* `PENDING`
* `SUCCESSFUL`
* `FAILED`
* `CANCELLED`

Each payment should retain provider identifiers such as:

* Merchant Request ID
* Checkout Request ID
* M-Pesa receipt number
* Phone number
* Amount
* Plan
* Result code
* Result description
* Created/completed timestamps

Daraja callbacks must be handled idempotently so duplicate callbacks cannot generate duplicate subscriptions.

Daraja credentials remain exclusively on the backend.

---

## 8. High-Level Architecture

```text
┌─────────────────────────────────┐
│          Next.js Web            │
│                                 │
│ Landing / Pricing               │
│ Authentication                  │
│ User Dashboard                  │
│ Search Interface                │
│ Subscription UI                 │
│ Admin Dashboard                 │
└──────────────┬──────────────────┘
               │ HTTPS / JSON
               ▼
┌─────────────────────────────────┐
│       Express REST API          │
│                                 │
│ Authentication                  │
│ User Management                 │
│ Subscription Service            │
│ M-Pesa Payment Service          │
│ Land Search Service             │
│ PDF Report Service              │
│ Admin Service                   │
│ Analytics Service               │
└─────────┬───────────────┬───────┘
          │               │
          │ Prisma        │ HTTPS
          ▼               ▼
┌─────────────────┐  ┌─────────────────┐
│      MySQL      │  │ M-Pesa Daraja   │
│                 │  │ API             │
│ Users           │  └─────────────────┘
│ Plans           │
│ Subscriptions   │
│ Payments        │
│ Title Deeds     │
│ Zoning          │
│ Loans/Liens     │
│ Ownership       │
│ Search Logs     │
└─────────────────┘
```

Next.js never communicates directly with MySQL or Daraja.

All business rules remain in the Express backend.

---

## 9. Frontend Architecture

The frontend uses:

* Next.js App Router
* TypeScript
* Tailwind CSS
* Server and client components where appropriate
* Central API client
* Authentication/session utilities

Primary route groups:

```text
(marketing)
(auth)
(dashboard)
(admin)
```

Expected URLs include:

```text
/
/pricing
/login
/signup
/forgot-password

/dashboard
/dashboard/search
/dashboard/subscription
/dashboard/account

/admin/login
/admin
/admin/users
/admin/title-deeds
/admin/zoning
/admin/loans
/admin/ownership-history
```

Route groups organize the source tree but do not become part of public URLs.

---

## 10. Backend Architecture

The backend uses a domain-oriented modular architecture rather than growing one large controllers/services directory.

Primary modules:

```text
auth
users
plans
subscriptions
payments
land
reports
admin
analytics
```

Each module may contain its own:

* routes
* controller
* service
* validation schemas
* types

Shared cross-cutting code belongs under:

```text
middleware
config
lib
utils
types
```

This structure keeps functionality cohesive while remaining simple enough for the size of the application.

---

## 11. Authentication

Authentication uses:

* Email/password
* Secure password hashing
* JWT access tokens
* Refresh-token mechanism
* Role-based authorization

Roles:

```text
USER
ADMIN
```

Account status should independently support:

```text
ACTIVE
SUSPENDED
```

A suspended account cannot use authenticated functionality regardless of subscription state.

### Authorization layers

```text
requireAuth
requireActiveUser
requireSubscription
requireAdmin
```

They serve different responsibilities and should not be combined into one middleware.

---

## 12. Core Database Entities

### users

Conceptual fields:

```text
id
name
email
password_hash
role
status
created_at
updated_at
```

### subscription_plans

```text
id
name
price_kes
interval
interval_count
is_active
created_at
updated_at
```

Example intervals:

```text
WEEK
MONTH
YEAR
```

Plans are seeded:

```text
Weekly   → KSh 200
Monthly  → KSh 600
Annual   → KSh 6,000
```

### subscriptions

```text
id
user_id
plan_id
starts_at
ends_at
status
created_at
updated_at
```

Historical subscription periods should remain available for auditing.

### payments

```text
id
user_id
plan_id
subscription_id
provider
amount_kes
phone_number
merchant_request_id
checkout_request_id
mpesa_receipt_number
status
result_code
result_description
provider_metadata
created_at
completed_at
```

### title_deeds

```text
id
title_deed_number
owner_name
location
size
availability_status
land_rate
created_at
updated_at
```

`title_deed_number` must be uniquely indexed.

### zoning_info

```text
id
title_deed_id
zone_type
notes
restrictions
created_at
updated_at
```

### loans_liens

```text
id
title_deed_id
type
lender
amount
status
due_date
notes
created_at
updated_at
```

### ownership_history

```text
id
title_deed_id
owner_name
transfer_date
notes
created_at
updated_at
```

### search_logs

```text
id
user_id
title_deed_id
searched_title_number
searched_at
```

Search logs support lightweight analytics and future product analysis.

---

## 13. Land Search

The user enters one value:

```text
Title Deed Number
```

The backend performs a single lookup and aggregates the associated information.

A successful response should conceptually contain:

```text
Title deed
Availability
Market rate
Zoning
Loans / liens
Ownership history
```

The frontend therefore does not need separate searches for every feature.

The user performs one search and receives one consolidated result.

---

## 14. PDF Search Report

PDF reporting is part of the MVP.

The report is generated by the backend using the authoritative land data rather than converting arbitrary browser HTML.

A report should contain:

* Platform branding
* Search/report reference
* Generation date
* Title deed number
* Location
* Parcel size
* Availability status
* Market rate
* Zoning
* Zoning notes/restrictions
* Loan/lien status
* Ownership history
* Appropriate disclaimer indicating the source/status of the information

PDF generation requires:

* Authenticated user
* Active subscription

---

## 15. API Design

All APIs should be namespaced:

```text
/api/v1
```

### Public

```text
GET  /api/v1/plans

POST /api/v1/auth/signup
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
```

### Authenticated User — Subscription Not Required

```text
GET  /api/v1/me
GET  /api/v1/subscription
GET  /api/v1/plans

POST /api/v1/payments/mpesa/initiate
GET  /api/v1/payments/:paymentId/status
GET  /api/v1/payments
```

### M-Pesa Provider Callback

```text
POST /api/v1/payments/mpesa/callback
```

This route is provider-facing and does not use normal user authentication.

### Subscriber Only

```text
GET /api/v1/land/search/:titleDeedNumber
GET /api/v1/land/search/:titleDeedNumber/report
```

Ownership history is returned as part of the main consolidated search result.

### Administrator

```text
GET /api/v1/admin/analytics

GET   /api/v1/admin/users
GET   /api/v1/admin/users/:id
PATCH /api/v1/admin/users/:id

GET    /api/v1/admin/title-deeds
POST   /api/v1/admin/title-deeds
GET    /api/v1/admin/title-deeds/:id
PATCH  /api/v1/admin/title-deeds/:id
DELETE /api/v1/admin/title-deeds/:id

CRUD /api/v1/admin/zoning
CRUD /api/v1/admin/loans
CRUD /api/v1/admin/ownership-history
```

Hard deletion of users should not be part of the normal admin workflow. Suspension provides safer account management while retaining transaction history.

---

## 16. Admin Analytics

The MVP admin dashboard includes only basic operational analytics.

Recommended metrics:

* Total registered users
* Active subscribers
* Users without subscriptions
* Total successful payments
* Total revenue
* Searches today
* Searches this month
* Total title deeds in dataset

No advanced BI/dashboard system is required.

---

## 17. Prisma and Database Ownership

Prisma belongs exclusively to the backend application.

Structure:

```text
apps/api/prisma/
├── schema.prisma
├── migrations/
├── seed.ts
└── seeders/
    ├── plans.seeder.ts
    ├── title-deeds.seeder.ts
    ├── zoning.seeder.ts
    ├── loans.seeder.ts
    └── ownership-history.seeder.ts
```

There is no root-level `database/` directory.

Database migrations, Prisma configuration, generated client, and seeders are backend concerns.

---

## 18. Seed Data

MVP land information is seeded.

Seeders should be separated by domain rather than maintaining one huge seed file.

`seed.ts` coordinates execution of the individual seeders.

Initial seed groups:

1. Subscription plans
2. Administrator account for development
3. Title deeds
4. Zoning information
5. Loans/liens
6. Ownership history

Seed records should contain enough variation to exercise all states:

* Available parcel
* Sold parcel
* Parcel under transaction
* Residential zoning
* Commercial zoning
* Agricultural zoning
* Clear property
* Property with loan
* Property with overdue loan
* Multiple historical owners

---

## 19. Basic Security Requirements

The MVP must include:

* Password hashing
* JWT validation
* Refresh-token handling
* Role authorization
* Subscription authorization
* Input validation
* HTTP security headers
* CORS configuration
* Authentication rate limiting
* Search rate limiting where appropriate
* Payment-initiation rate limiting
* Daraja credentials in environment variables
* Prisma parameterized database access
* Central error handling
* No sensitive information returned in API errors
* Payment callback idempotency
* Server-side authorization on every protected endpoint

Frontend route protection is a UX feature only.

The API remains the ultimate security boundary.

---

## 20. Monorepo Structure

```text
land-management-platform/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (marketing)/
│   │   │   │   ├── (auth)/
│   │   │   │   ├── (dashboard)/
│   │   │   │   └── (admin)/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   ├── lib/
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   └── public/
│   │
│   └── api/
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── users/
│       │   │   ├── plans/
│       │   │   ├── subscriptions/
│       │   │   ├── payments/
│       │   │   ├── land/
│       │   │   ├── reports/
│       │   │   ├── admin/
│       │   │   └── analytics/
│       │   ├── middleware/
│       │   ├── config/
│       │   ├── lib/
│       │   ├── utils/
│       │   └── types/
│       │
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   ├── seed.ts
│       │   └── seeders/
│       │
│       └── generated/
│
├── packages/
│   └── shared/
│       └── src/
│
├── docs/
│   ├── architecture.md
│   ├── roadmap.md
│   └── setup.md
│
├── package.json
├── .gitignore
└── README.md
```

---

## 21. Shared Package

`packages/shared` should remain deliberately small.

It may contain contracts that genuinely need to be understood by both applications, such as:

* API response types
* Plan identifiers
* Zoning values
* Land availability values
* User roles

Backend-only business logic must not be moved into the shared package.

---

## 22. Environment Separation

Expected backend environment configuration includes concepts such as:

```text
DATABASE_URL
PORT

JWT secrets / token configuration

FRONTEND_URL

MPESA_CONSUMER_KEY
MPESA_CONSUMER_SECRET
MPESA_SHORTCODE
MPESA_PASSKEY
MPESA_CALLBACK_URL
MPESA_ENVIRONMENT
```

Production and sandbox M-Pesa credentials must remain separate.

Frontend environment variables should contain only information safe for the browser.

---

## 23. MVP Scope

### Included

* Marketing landing page
* Pricing
* Signup/login
* User dashboard
* Dashboard access before payment
* Three time-based subscriptions
* M-Pesa Daraja payment
* Subscription entitlement management
* Title deed search
* Availability
* Market rate
* Zoning
* Loans/liens
* Ownership history
* PDF report
* Admin login
* User management
* Land-data CRUD
* Basic admin analytics
* Seeded data
* Deployment

### Explicitly Excluded

* Real land-registry API integration
* Watchlists
* Status-change alerts
* Email notifications beyond essential account functionality
* Per-search payment
* Per-feature payment
* Automatic card payments
* Multi-organization/multi-tenant architecture
* Advanced analytics
* Mobile application

---

## 24. Architecture Rule

The defining access rule for the platform is:

> Authentication unlocks the dashboard. Subscription unlocks operations.

This distinction should remain consistent through the frontend, API, middleware, and testing strategy.

---

## 25. Architecture Status

The architecture is approved for implementation.

Major technologies and product flows are now considered locked:

* Next.js
* Express
* TypeScript
* MySQL
* Prisma
* M-Pesa Daraja
* Weekly/monthly/annual prepaid subscriptions
* Dashboard preview without subscription
* Subscription-protected search operations
* Ownership history
* PDF reports
* Basic admin analytics
* Backend-owned Prisma seeders

Further decisions should be implementation-level decisions unless they materially alter this architecture.
