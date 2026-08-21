# Land Management Platform — Development Roadmap

**Status:** Ready for implementation
**Reference:** `docs/architecture.md`

---

## Phase 0 — Project Foundation

### Objective

Establish the monorepo and development environment before implementing product functionality.

### Tasks

* [ ] Create root monorepo
* [ ] Create Next.js frontend
* [ ] Create Express TypeScript backend
* [ ] Configure npm workspaces
* [ ] Create shared package
* [ ] Add docs directory
* [ ] Initialize Git repository
* [ ] Configure root `.gitignore`
* [ ] Configure environment-file strategy
* [ ] Confirm frontend and backend can run independently
* [ ] Add root development scripts

### Completion Criteria

* Frontend starts successfully
* API starts successfully
* Both applications are represented in the workspace
* Repository structure matches architecture
* Initial commit created

---

## Phase 1 — Backend Foundation & Database

### Objective

Create the backend infrastructure upon which all product modules depend.

### Tasks

* [ ] Configure Express application
* [ ] Configure TypeScript
* [ ] Configure environment validation
* [ ] Add central error handling
* [ ] Add request logging
* [ ] Add Helmet
* [ ] Configure CORS
* [ ] Configure API `/api/v1` router
* [ ] Add health endpoint
* [ ] Initialize Prisma
* [ ] Connect MySQL
* [ ] Design final Prisma schema
* [ ] Create initial migration

### Initial Models

* [ ] User
* [ ] SubscriptionPlan
* [ ] Subscription
* [ ] Payment
* [ ] TitleDeed
* [ ] ZoningInfo
* [ ] LoanLien
* [ ] OwnershipHistory
* [ ] SearchLog

### Seeders

* [ ] Plan seeder
* [ ] Development admin seeder
* [ ] Title deed seeder
* [ ] Zoning seeder
* [ ] Loan/lien seeder
* [ ] Ownership-history seeder
* [ ] Root Prisma seed runner

### Completion Criteria

* MySQL schema can be created from migrations
* Fresh database can be populated using one seed command
* Backend connects successfully to database
* Health endpoint responds successfully
* Seed dataset contains all major land-data states

---

## Phase 2 — Authentication & User Accounts

### Objective

Allow users to create accounts and access the dashboard independently of subscription status.

### Backend

* [ ] Signup service
* [ ] Login service
* [ ] Password hashing
* [ ] JWT access-token generation
* [ ] Refresh-token handling
* [ ] Logout
* [ ] `GET /me`
* [ ] Authentication middleware
* [ ] Active-user middleware
* [ ] Admin authorization middleware
* [ ] Suspended-user handling
* [ ] Authentication validation
* [ ] Authentication rate limiting

### Frontend

* [ ] Signup page
* [ ] Login page
* [ ] Forgot-password UI foundation
* [ ] Authenticated layout
* [ ] Session handling
* [ ] Logout
* [ ] Dashboard shell
* [ ] Account/profile page

### Completion Criteria

A visitor can:

```text
Sign Up → Login → Enter Dashboard
```

without purchasing a subscription.

Unauthenticated users cannot access authenticated dashboard pages.

---

## Phase 3 — Marketing Site & Pricing

### Objective

Create the public acquisition flow.

### Landing Page

* [ ] Navigation
* [ ] Hero section
* [ ] Problem/value proposition
* [ ] Platform features
* [ ] How it works
* [ ] Pricing section
* [ ] Calls to action
* [ ] Footer

### Pricing

Implement:

* [ ] Weekly — KSh 200
* [ ] Monthly — KSh 600
* [ ] Annual — KSh 6,000
* [ ] Monthly savings indicator
* [ ] Annual savings indicator

### Conversion Flows

* [ ] General signup CTA → signup
* [ ] Pricing-plan CTA → signup with selected-plan intent
* [ ] Login restoration where needed
* [ ] Selected plan retained after authentication

### Completion Criteria

A visitor can discover the product, inspect pricing, select a plan and reach account creation without losing their plan selection.

---

## Phase 4 — M-Pesa & Subscription System

### Objective

Implement the payment system independently before combining it with land searches.

### Daraja Infrastructure

* [ ] Create M-Pesa sandbox application/configuration
* [ ] Configure backend Daraja credentials
* [ ] OAuth/access-token service
* [ ] STK Push service
* [ ] Callback endpoint
* [ ] Payment reconciliation
* [ ] Payment-state handling
* [ ] Callback idempotency
* [ ] Error handling
* [ ] Payment status endpoint

### Subscription Logic

* [ ] Subscription service
* [ ] Determine active entitlement
* [ ] Weekly access calculation
* [ ] Monthly access calculation
* [ ] Annual access calculation
* [ ] Early-renewal extension
* [ ] Expired-subscription handling
* [ ] Subscription middleware

### Frontend

* [ ] Subscription page
* [ ] Plan cards
* [ ] M-Pesa phone input
* [ ] STK Push initiation
* [ ] Payment pending state
* [ ] Payment successful state
* [ ] Payment failed/cancelled state
* [ ] Current plan display
* [ ] Expiry date display
* [ ] Renewal action

### Completion Criteria

The following complete flow works:

```text
User
 → chooses plan
 → enters M-Pesa number
 → receives STK Push
 → payment succeeds
 → callback processed
 → subscription activated
 → dashboard reflects new access
```

No subscription may be activated merely because an STK request was initiated.

---

## Phase 5 — Land Search Engine

### Objective

Implement the primary customer value proposition.

### Backend

* [ ] Normalize title deed input
* [ ] Search title deed
* [ ] Aggregate availability
* [ ] Aggregate market rate
* [ ] Aggregate zoning
* [ ] Aggregate loans/liens
* [ ] Aggregate ownership history
* [ ] Record search logs
* [ ] Handle unknown title deed
* [ ] Apply subscription middleware
* [ ] Add request validation
* [ ] Add search rate limiting if required

### Frontend

* [ ] Search page
* [ ] Title deed search form
* [ ] Loading state
* [ ] Empty/not-found state
* [ ] Availability result
* [ ] Market-rate result
* [ ] Zoning result
* [ ] Encumbrance result
* [ ] Ownership-history timeline
* [ ] Responsive result layout

### Locked Dashboard Behavior

Without subscription:

* Dashboard remains accessible
* Search UI may be visible
* Search execution is locked
* Upgrade/subscribe CTA displayed

With subscription:

* Search execution enabled

### Completion Criteria

A subscribed user can enter one title deed number and receive one consolidated land record containing all five information groups.

A non-subscriber cannot bypass the restriction by directly calling the API.

---

## Phase 6 — PDF Search Reports

### Objective

Allow subscribers to generate a professional portable copy of a search.

### Backend

* [ ] Report-generation service
* [ ] Report reference identifier
* [ ] PDF formatting
* [ ] Land information section
* [ ] Zoning section
* [ ] Encumbrance section
* [ ] Ownership-history section
* [ ] Report-generation timestamp
* [ ] Disclaimer
* [ ] Subscription protection

### Frontend

* [ ] Download report action
* [ ] Generation/loading state
* [ ] Report error handling

### Completion Criteria

A subscriber can perform a search and download a readable one-page or compact multi-page PDF containing the authoritative backend results.

---

## Phase 7 — Admin Platform

### Objective

Provide the minimum tooling needed to operate the platform without changing seed files manually.

### Admin Authentication

* [ ] Dedicated admin login
* [ ] Admin-only layout
* [ ] Admin authorization

### Analytics

* [ ] Total users
* [ ] Active subscribers
* [ ] Users without subscriptions
* [ ] Successful payments
* [ ] Revenue
* [ ] Searches today
* [ ] Searches this month
* [ ] Total title deeds

### User Management

* [ ] User listing
* [ ] Search/filter users
* [ ] User detail
* [ ] View subscription
* [ ] Suspend user
* [ ] Reactivate user

### Land Dataset Management

* [ ] Title deed CRUD
* [ ] Zoning CRUD
* [ ] Loan/lien CRUD
* [ ] Ownership-history CRUD
* [ ] Validation
* [ ] Referential-integrity handling

### Completion Criteria

An administrator can maintain the complete MVP dataset from the web interface without interacting with MySQL manually.

---

## Phase 8 — Frontend Refinement

### Objective

Turn the functional application into a coherent product.

### Tasks

* [ ] Dashboard overview cards
* [ ] Subscription-status banner
* [ ] Locked-search experience
* [ ] Search result hierarchy
* [ ] Mobile responsiveness
* [ ] Navigation states
* [ ] Empty states
* [ ] Loading skeletons
* [ ] Toast/notification system
* [ ] Error pages
* [ ] 404 page
* [ ] Accessibility review
* [ ] Consistent validation messaging
* [ ] Branding pass

### Completion Criteria

Core workflows are intuitive on both desktop and mobile without requiring developer knowledge.

---

## Phase 9 — Security, Testing & QA

### Backend Testing

* [ ] Authentication tests
* [ ] Subscription tests
* [ ] Payment-service tests
* [ ] Callback-idempotency tests
* [ ] Search tests
* [ ] Admin authorization tests
* [ ] Land CRUD tests

### Critical Scenario Testing

* [ ] User without subscription
* [ ] Active weekly subscription
* [ ] Active monthly subscription
* [ ] Active annual subscription
* [ ] Expired subscription
* [ ] Early renewal
* [ ] Failed M-Pesa payment
* [ ] Cancelled STK prompt
* [ ] Duplicate Daraja callback
* [ ] Invalid title deed
* [ ] Suspended user
* [ ] Normal user attempting admin route
* [ ] Expired JWT
* [ ] Invalid JWT

### Frontend QA

* [ ] Desktop
* [ ] Tablet
* [ ] Mobile
* [ ] Authentication flows
* [ ] Payment states
* [ ] Subscription locking
* [ ] Search results
* [ ] PDF download
* [ ] Admin flows

### Completion Criteria

No critical authorization, payment, subscription or data-management workflow has an untested failure path.

---

## Phase 10 — Deployment

### Backend

* [ ] Production Node environment
* [ ] Production MySQL
* [ ] Production environment variables
* [ ] HTTPS
* [ ] Production CORS
* [ ] Database migrations
* [ ] Production seed strategy
* [ ] Logging
* [ ] Process management
* [ ] Health checks

### Frontend

* [ ] Production Next.js deployment
* [ ] Production API URL
* [ ] Domain configuration
* [ ] HTTPS
* [ ] Metadata/SEO
* [ ] Production build validation

### M-Pesa

* [ ] Production Daraja credentials
* [ ] Production callback URL
* [ ] Production shortcode configuration
* [ ] End-to-end live payment test

### Completion Criteria

A real user can:

```text
Visit site
→ Create account
→ Enter dashboard
→ Purchase access through M-Pesa
→ Search title deed
→ View complete results
→ Download PDF report
```

from the production environment.

---

# Recommended Development Order

Do not build everything simultaneously.

Follow this dependency chain:

```text
Foundation
    ↓
Database
    ↓
Authentication
    ↓
Landing/Pricing
    ↓
M-Pesa + Subscription
    ↓
Land Search
    ↓
PDF Reports
    ↓
Admin
    ↓
Refinement
    ↓
Testing
    ↓
Deployment
```

The payment and subscription system should be proven independently before being attached to the land-search authorization layer.

---

# MVP Completion Definition

The MVP is complete when:

* [ ] Visitors can understand the product and pricing
* [ ] Users can create accounts
* [ ] Users can access the dashboard without paying
* [ ] Non-subscribers cannot execute searches
* [ ] Users can purchase weekly, monthly or annual access using M-Pesa
* [ ] Daraja confirmation activates access
* [ ] Subscribers can search title deeds
* [ ] Search results include all required land information
* [ ] Ownership history is available
* [ ] Subscribers can download PDF reports
* [ ] Admins can manage users
* [ ] Admins can manage land data
* [ ] Admins can view basic analytics
* [ ] Authorization cannot be bypassed through direct API requests
* [ ] Production deployment operates end-to-end
