# Bridge API Reference

**Base URL:** `http://localhost:3000/api/v1`  
**Interactive docs (Swagger UI):** `http://localhost:3000/docs`  
**All monetary amounts are in kobo** (1 NGN = 100 kobo). Display values must be divided by 100.  
**Auth:** Protected routes require `Authorization: Bearer <accessToken>` in the request header. The token is returned by `POST /auth/register/\*` and `POST /auth/login`.

\---

## Common error shape

All errors follow NestJS's default exception shape:

```json
{
  "statusCode": 400,
  "message": "Descriptive error string or array of validation messages",
  "error": "Bad Request"
}
```

Validation errors from class-validator return `message` as an array of strings, one per failing field.

\---

## Enums

### `sector`

`"Food \& Beverage"` | `"Agriculture"` | `"Technology"` | `"Fashion \& Beauty"` | `"Health \& Wellness"` | `"Education"` | `"Transport \& Logistics"` | `"Retail \& Trade"` | `"Manufacturing"` | `"Real Estate"` | `"Finance \& Insurance"` | `"Entertainment \& Media"` | `"Construction"` | `"Energy"` | `"Other"`

### `riskTierPreference`

`"conservative"` | `"balanced"` | `"growth"`

### `returnTimelinePreference`

`"short"` | `"medium"` | `"flexible"`

### `listingStatus`

`"active"` | `"funded"` | `"completed"` | `"defaulted"`

### `investmentStatus`

`"inactive"` | `"active"` | `"completed"` | `"defaulted"`

### `trancheStatus`

`"locked"` | `"released"` | `"returned"`

### `standing` (Bridge Rating)

`"Seed"` (0–49) | `"Established"` (50–79) | `"Elite"` (80–100)

### `preferredRepaymentMonths`

Any integer from `1` to `24`. Tier 1 businesses are additionally capped at 18 months.

\---

## Screen 1 — Landing Page

### GET /platform/stats

**Auth:** None

**Response 200:**

| Field                          | Type   | Example     |
| ------------------------------ | ------ | ----------- |
| `totalBusinessesFunded`        | number | `42`        |
| `totalCapitalDeployedKobo`     | number | `500000000` |
| `averageInvestorReturnPercent` | number | `22.5`      |
| `averageRepaymentDays`         | number | `180`       |

**Errors:** None expected.

\---

### GET /listings

**Auth:** None  
**Query params:** See [All Listings filter params](#all-listings-filter-params) below.

**Response 200:**

```json
{
  "data": \[
    /\* ListingResponseDto\[] — see Listing object \*/
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

\---

## Screen 2 — Listing Detail

### GET /listings/:id

**Auth:** None  
**Path params:** `id` — listing UUID

**Response 200** — listing object extended with related data:

```json
{
  /\* all ListingResponseDto fields — see Listing object \*/
  "tranches": \[
    /\* TrancheResponseDto\[] — see Tranche object \*/
  ],
  "business\_profiles": {
    /\* BusinessProfileDto — see Business Profile object \*/
  },
  "bridge\_ratings": {
    /\* BridgeRatingResponseDto — see Bridge Rating object \*/
  }
}
```

**Errors:**

| Status | Meaning           |
| ------ | ----------------- |
| 404    | Listing not found |

\---

### GET /business/:businessId/rating

**Auth:** JWT (any)  
**Path params:** `businessId` — **business profile UUID** (the `id` field from `business\_profiles`, NOT the user UUID)

**Response 200:** See [Bridge Rating object](#bridge-rating-object).

**Errors:**

| Status | Meaning                  |
| ------ | ------------------------ |
| 401    | Missing or invalid token |

\---

### GET /business/:businessId/rating/investor

**Auth:** None  
**Path params:** `businessId` — business profile UUID

**Response 200:**

| Field      | Type            | Example                                |
| ---------- | --------------- | -------------------------------------- |
| `tier`     | number          | `1`                                    |
| `standing` | `standing` enum | `"Established"`                        |
| `signals`  | string\[]       | `\["CAC verified", "Fast repayments"]` |

`signals` is a list of human-readable positive indicators derived from score thresholds. It omits negative information.

**Errors:**

| Status | Meaning            |
| ------ | ------------------ |
| 404    | Business not found |

\---

### POST /investments

**Auth:** JWT (investor)

**Request body:**

| Field             | Type        | Required | Notes                               |
| ----------------- | ----------- | -------- | ----------------------------------- |
| `listingId`       | UUID string | yes      | ID of the listing to invest in      |
| `amountCommitted` | number      | yes      | In kobo. Minimum 500,000 (= ₦5,000) |

**Response 201:** See [Investment object](#investment-object).

**Errors:**

| Status | Meaning                                                                                                 |
| ------ | ------------------------------------------------------------------------------------------------------- |
| 400    | Validation error, below ₦5,000 minimum, amount exceeds remaining unfunded amount, or listing not active |
| 401    | Missing or invalid token                                                                                |
| 403    | Caller is not an investor account                                                                       |
| 404    | Listing not found                                                                                       |
| 502    | Squad escrow transfer failed                                                                            |

\---

### DELETE /investments/:id

**Auth:** JWT (investor)  
**Path params:** `id` — investment UUID

Cancels an existing investment and fully refunds the committed capital to the investor's wallet. This is only possible if the listing is still in the `active` (funding) state and the investment status is `inactive`. Once a listing is fully funded, investments cannot be cancelled.

**Response 200:**

| Field     | Type   | Notes                                      |
| --------- | ------ | ------------------------------------------ |
| `success` | `true` |                                            |
| `message` | string | e.g. `"Investment cancelled and refunded"` |

**Errors:**

| Status | Meaning                                                    |
| ------ | ---------------------------------------------------------- |
| 400    | Investment is already `active` or `completed`              |
| 401    | Missing or invalid token                                   |
| 403    | Caller is not an investor, or does not own this investment |
| 404    | Investment not found                                       |

\---

## Registration

> All monetary amounts are in kobo. BVN must be exactly 11 digits starting with `22` (Nigerian BVN format). `beneficiaryAccount` is the 10-digit bank account number Squad uses to settle funds — this is the user's real bank account, not the Squad VA.

\---

### Business registration

Business onboarding is a **3-step flow**. Steps 2 and 3 happen after the user is logged in.

```
Step 1  POST /auth/register/business   Create account → JWT + Squad VA
Step 2  POST /business/connect-bank    Link bank via Mono widget → triggers async income analysis
          ↳ poll GET /business/:userId/profile until monoAverageMonthlyInflow is non-null
Step 3  POST /verify/cac               (optional) Verify CAC → +5 Bridge Rating bonus
```

After step 2, the business can create listings. Step 3 can be done at any time from the dashboard.

> \*\*Why connect a bank?\*\*  
> `monoAverageMonthlyInflow` (Mono-verified income) overrides the self-reported `averageMonthlyRevenue` in all listing term calculations — it determines the revenue cap, sweep percentage, and repayment timeline. Without it, listing terms are less favourable and may not reflect the business's real earning power.

\---

#### Step 1 — Create account

**`POST /auth/register/business`**

**Auth:** None

**Request body:**

| Field                   | Type          | Required | Validation                   |
| ----------------------- | ------------- | -------- | ---------------------------- |
| `fullName`              | string        | yes      | Non-empty                    |
| `email`                 | string        | yes      | Valid email format           |
| `phone`                 | string        | yes      | Non-empty                    |
| `password`              | string        | yes      | Min 8 characters             |
| `bvn`                   | string        | yes      | 11 digits starting with `22` |
| `businessName`          | string        | yes      | Non-empty                    |
| `sector`                | `sector` enum | yes      | See [Enums](#enums)          |
| `location`              | string        | yes      | Non-empty                    |
| `yearsInOperation`      | number        | yes      | Positive integer             |
| `averageMonthlyRevenue` | number        | yes      | Positive integer, in kobo    |
| `businessDescription`   | string        | yes      | Non-empty                    |
| `beneficiaryAccount`    | string        | yes      | Exactly 10 digits            |

**Response 201:**

| Field                       | Type         | Notes                                                                                   |
| --------------------------- | ------------ | --------------------------------------------------------------------------------------- |
| `accessToken`               | string       | JWT — store this and send as `Authorization: Bearer <token>` on all subsequent requests |
| `userType`                  | `"business"` |                                                                                         |
| `squadVirtualAccountNumber` | string       | Squad VA number — businesses receive payments here; also store this                     |

**Errors:**

| Status | Meaning                                                  |
| ------ | -------------------------------------------------------- |
| 400    | Validation error, or BVN rejected by Squad (invalid BVN) |
| 409    | Email, phone, or BVN already registered                  |

\---

#### Step 2 — Connect bank account

**`POST /business/connect-bank`**

**Auth:** JWT (business)

The frontend launches the Mono Connect widget. The user authenticates their bank account inside the widget, and Mono returns a one-time `code` via `onSuccess`. POST that code here. The server stores the account ID and fires an async income processing request to Mono. Mono delivers the income result via the `mono.events.account\_income` webhook (seconds to minutes later), which updates `monoAverageMonthlyInflow` on the business profile.

**Mono Connect widget integration:**

```js
// Add to your page (or: npm install @mono.co/connect.js)
// <script src="https://connect.withmono.com/connect.js"></script>

const connect = new Connect({
  key: process.env.MONO\_PUBLIC\_KEY, // safe to expose in frontend
  scope: 'auth',
  data: {
    customer: {
      name: user.fullName, // from JWT or profile
      email: user.email,
    },
  },
  onLoad: () => {
    /\* enable the "Connect bank" button \*/
  },
  onSuccess: ({ code }) => {
    // POST { code } to /business/connect-bank
  },
  onClose: () => {
    /\* user dismissed the widget \*/
  },
});

connect.setup(); // call once on mount — loads the iframe into the DOM
// on button click:
connect.open();
```

Each user's session is independent — multiple testers can run this simultaneously and each receives their own unique `code`. Sandbox credentials: pick any bank, use `test-user@gmail.com` / `123456` (OTP: `123456`).

> \*\*Local dev note:\*\* Mono cannot reach `localhost`. Run `ngrok http 3000` and set `https://<id>.ngrok-free.app/webhooks/mono` as the webhook URL in the Mono dashboard. Without this, `monoAverageMonthlyInflow` stays `null` in dev but everything else still works.

**Request body:**

| Field  | Type   | Required | Notes                                                                         |
| ------ | ------ | -------- | ----------------------------------------------------------------------------- |
| `code` | string | yes      | One-time authorization code from the Mono Connect widget `onSuccess` callback |

**Response 201:**

| Field                  | Type    | Notes                                                                  |
| ---------------------- | ------- | ---------------------------------------------------------------------- |
| `connected`            | boolean | Always `true` on success                                               |
| `averageMonthlyInflow` | null    | Always `null` here — income is processed async and arrives via webhook |

**After this call:** `bankConnected` and `monoLinked` will be `true` on the profile. Poll `GET /business/:userId/profile` until `monoAverageMonthlyInflow` is non-null before letting the user proceed to listing creation. The poll typically resolves in under 30 seconds in sandbox.

**Errors:**

| Status | Meaning                              |
| ------ | ------------------------------------ |
| 400    | Invalid or expired Mono Connect code |
| 401    | Missing or invalid token             |
| 403    | Caller is not a business account     |
| 404    | Business profile not found           |
| 409    | Bank account already connected       |

\---

#### Step 3 — Verify CAC (optional)

**`POST /verify/cac`**

**Auth:** JWT (business)

Verifies the business's CAC registration number against the registry. On success, sets `cacVerified: true` on the profile and adds 5 points to the Bridge Rating `cacBonusScore`. This improves the business's standing and reduces listing return rates.

**Request body:**

| Field                   | Type   | Required | Notes              |
| ----------------------- | ------ | -------- | ------------------ |
| `cacRegistrationNumber` | string | yes      | e.g. `"RC1234567"` |

**Response 201:**

| Field      | Type   |
| ---------- | ------ |
| `verified` | `true` |

**Errors:**

| Status | Meaning                              |
| ------ | ------------------------------------ |
| 400    | CAC number not found in the registry |
| 401    | Missing or invalid token             |
| 403    | Caller is not a business account     |
| 404    | Business profile not found           |

\---

### Investor registration

Investor onboarding is a **single step**. After registering, the investor can immediately browse listings. To place an investment, they must first top up their Squad virtual account (via bank transfer to `squadVirtualAccountNumber`).

```
Step 1  POST /auth/register/investor   Create account → JWT + Squad VA
          ↳ investor browses listings and tops up their Squad VA to invest
```

\---

#### Step 1 — Create account

**`POST /auth/register/investor`**

**Auth:** None

**Request body:**

| Field                      | Type                | Required | Validation                                                                                 |
| -------------------------- | ------------------- | -------- | ------------------------------------------------------------------------------------------ |
| `fullName`                 | string              | yes      | Non-empty                                                                                  |
| `email`                    | string              | yes      | Valid email format                                                                         |
| `phone`                    | string              | yes      | Non-empty                                                                                  |
| `password`                 | string              | yes      | Min 8 characters                                                                           |
| `bvn`                      | string              | yes      | 11 digits starting with `22`                                                               |
| `beneficiaryAccount`       | string              | yes      | Exactly 10 digits                                                                          |
| `sectorInterests`          | `sector` enum array | no       | Investment sector preferences — can be set later via `PATCH /investor/:userId/preferences` |
| `riskTierPreference`       | string              | no       | `"conservative"` \| `"balanced"` \| `"growth"`                                             |
| `returnTimelinePreference` | string              | no       | `"short"` \| `"medium"` \| `"flexible"`                                                    |

**Response 201:**

| Field                       | Type         | Notes                                                            |
| --------------------------- | ------------ | ---------------------------------------------------------------- |
| `accessToken`               | string       | JWT — store and send as `Authorization: Bearer <token>`          |
| `userType`                  | `"investor"` |                                                                  |
| `squadVirtualAccountNumber` | string       | Squad VA number — investor sends money here to fund their wallet |

**Errors:**

| Status | Meaning                                                  |
| ------ | -------------------------------------------------------- |
| 400    | Validation error, or BVN rejected by Squad (invalid BVN) |
| 409    | Email, phone, or BVN already registered                  |

\---

## Screen 5 — Investor Dashboard

### GET /investor/:userId/profile

**Auth:** JWT  
**Path params:** `userId` — investor user UUID

**Response 200:**

```json
{
  "investor\_profiles": {
    /\* InvestorProfileDto \*/
  },
  "users": {
    /\* InvestorUserDto \*/
  }
}
```

`investor\_profiles` fields:

| Field                      | Type                        | Notes                 |
| -------------------------- | --------------------------- | --------------------- |
| `id`                       | UUID                        | Investor profile UUID |
| `userId`                   | UUID                        | User UUID             |
| `sectorInterests`          | `sector` enum array \| null |                       |
| `riskTierPreference`       | string \| null              |                       |
| `returnTimelinePreference` | string \| null              |                       |
| `investmentRangeMin`       | number \| null              | In kobo               |
| `investmentRangeMax`       | number \| null              | In kobo               |
| `createdAt`                | ISO datetime                |                       |
| `updatedAt`                | ISO datetime                |                       |

`users` fields:

| Field                       | Type           |
| --------------------------- | -------------- |
| `id`                        | UUID           |
| `fullName`                  | string         |
| `email`                     | string         |
| `phone`                     | string         |
| `squadVirtualAccountNumber` | string \| null |

**Errors:**

| Status | Meaning                    |
| ------ | -------------------------- |
| 401    | Missing or invalid token   |
| 404    | Investor profile not found |

\---

### GET /investor/:userId/summary

**Auth:** JWT  
**Path params:** `userId` — investor user UUID

**Response 200:**

| Field                            | Type   | Notes                                                   |
| -------------------------------- | ------ | ------------------------------------------------------- |
| `totalCapitalDeployed`           | number | Total committed across all investments, in kobo         |
| `totalReturnsReceived`           | number | Total sweep distributions received, in kobo             |
| `activeDealsCount`               | number |                                                         |
| `defaultPoolContributionBalance` | number | 4% of each investment held in the default pool, in kobo |

**Errors:**

| Status | Meaning                  |
| ------ | ------------------------ |
| 401    | Missing or invalid token |

\---

### GET /investor/:userId/activity

**Auth:** JWT  
**Path params:** `userId` — investor user UUID

**Response 200:** Array of up to 5 [Notification objects](#notification-object), most recent first.

\---

### GET /listings/matched

**Auth:** JWT (investor)

Returns listings ranked by AI match score against the investor's stored preferences.

**Response 200:**

```json
{
  "listings": \[
    { /\* all ListingResponseDto fields \*/, "matchScore": 87.5 }
  ],
  "preferencesSet": true
}
```

`preferencesSet` is `false` if the investor has not set any preferences yet. Matching still runs but returns unranked listings in that case.

**Errors:**

| Status | Meaning                           |
| ------ | --------------------------------- |
| 401    | Missing or invalid token          |
| 403    | Caller is not an investor account |

\---

### All Listings filter params

Used by `GET /listings` and displayed in the All Listings tab.

| Param        | Type   | Default    | Notes                                                                                      |
| ------------ | ------ | ---------- | ------------------------------------------------------------------------------------------ |
| `sector`     | string | —          | Exact match against `sector` enum values                                                   |
| `tier`       | number | —          | `1`, `2`, or `3`                                                                           |
| `standing`   | string | —          | `"Seed"`, `"Established"`, or `"Elite"`                                                    |
| `minReturn`  | number | —          | Minimum `totalReturnPercent`                                                               |
| `maxReturn`  | number | —          | Maximum `totalReturnPercent`                                                               |
| `minCapital` | number | —          | Minimum `capitalRequested` in kobo                                                         |
| `maxCapital` | number | —          | Maximum `capitalRequested` in kobo                                                         |
| `sort`       | string | `"newest"` | `"highest\_return"` \| `"fastest\_repayment"` \| `"newest"` \| `"highest\_bridge\_rating"` |
| `page`       | number | `1`        |                                                                                            |
| `limit`      | number | `20`       |                                                                                            |

\---

## Screen 6 — Investor Portfolio

### GET /investor/:userId/payment-link

**Auth:** JWT  
**Path params:** `userId` — investor user UUID

Returns the investor's Squad virtual account number and a payment link for funding their wallet. Investors must top up their Squad VA balance before they can invest. Share the `virtualAccountNumber` or generate a QR code from `paymentLink` on the fund-wallet screen.

**Response 200:**

| Field                  | Type   | Notes                                                                     |
| ---------------------- | ------ | ------------------------------------------------------------------------- |
| `paymentLink`          | string | Full URL for QR generation, e.g. `https://sandbox.squadco.com/1234567890` |
| `virtualAccountNumber` | string | Squad VA number to transfer funds to                                      |

**Errors:**

| Status | Meaning                   |
| ------ | ------------------------- |
| 401    | Missing or invalid token  |
| 404    | Virtual account not found |

\---

### POST /investor/:userId/checkout

**Auth:** JWT (investor)  
**Path params:** `userId` — investor user UUID

Initiates a Squad checkout flow for wallet top-up. Returns a `checkout\_url` to which you should redirect the investor's browser. Once the payment is complete, Squad will notify Bridge via webhook to credit the investor's wallet.

**Request body:**

| Field    | Type   | Required | Notes                                    |
| -------- | ------ | -------- | ---------------------------------------- |
| `amount` | number | yes      | Deposit amount in kobo (e.g. 5000 = ₦50) |

**Response 201:**

| Field              | Type   | Notes                                        |
| ------------------ | ------ | -------------------------------------------- |
| `checkout\_url`    | string | URL to redirect the user to                  |
| `transaction\_ref` | string | Internal reference for this checkout session |

**Errors:**

| Status | Meaning                           |
| ------ | --------------------------------- |
| 400    | Validation error                  |
| 401    | Missing or invalid token          |
| 403    | Caller is not an investor account |

\---

### GET /investor/:userId/wallet

**Auth:** JWT  
**Path params:** `userId` — investor user UUID

**Response 200:**

| Field                | Type   | Notes                                         |
| -------------------- | ------ | --------------------------------------------- |
| `availableBalance`   | number | Live balance from Squad in kobo               |
| `defaultPoolBalance` | number | Sum of all default pool contributions in kobo |

**Errors:**

| Status | Meaning                   |
| ------ | ------------------------- |
| 401    | Missing or invalid token  |
| 404    | Virtual account not found |

\---

### POST /investor/:userId/deposit

**Auth:** JWT (investor)  
**Path params:** `userId` — investor user UUID

Sandbox only: simulates an incoming bank deposit to the investor's Squad virtual account to top up their wallet. Behind the scenes, triggers Squad's sandbox simulation, and the ensuing webhook notifies Bridge to credit the investor's ledger balance.

**Request body:**

| Field    | Type   | Required | Notes                  |
| -------- | ------ | -------- | ---------------------- |
| `amount` | number | yes      | Deposit amount in kobo |

**Response 201:**

| Field                  | Type    | Notes                      |
| ---------------------- | ------- | -------------------------- |
| `simulated`            | boolean | Always `true` on success   |
| `amount`               | number  | In kobo                    |
| `virtualAccountNumber` | string  | Investor's Squad VA number |

**Errors:**

| Status | Meaning                           |
| ------ | --------------------------------- |
| 400    | Validation error                  |
| 401    | Missing or invalid token          |
| 403    | Caller is not an investor account |
| 404    | Virtual account not found         |

\---

### GET /investor/:userId/deals

**Auth:** JWT  
**Path params:** `userId` — investor user UUID  
**Query params:** `status` — optional, one of `"active"` | `"completed"` | `"defaulted"`. Omit to return all deals.

**Response 200:** Array of [Investment objects](#investment-object).

\---

### GET /deals/:listingId/sweeps

**Auth:** JWT  
**Path params:** `listingId` — listing UUID

**Response 200:** Array of sweep events. Each item extends [Sweep Event object](#sweep-event-object) with one extra field:

| Field          | Type           | Notes                                                                                                                                                                                                         |
| -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `distribution` | object \| null | Present only if the caller invested in this listing. Contains `amountDistributed` (kobo, their full share of the debt repayment), `sweepEventId`, `investmentId`, `squadTransferReference`. `null` otherwise. |

\---

### GET /investor/:userId/returns

**Auth:** JWT  
**Path params:** `userId` — investor user UUID  
**Query params:**

| Param    | Type   | Required                           | Notes                                  |
| -------- | ------ | ---------------------------------- | -------------------------------------- |
| `period` | string | yes                                | `"daily"` \| `"monthly"` \| `"yearly"` |
| `year`   | number | required for `daily` and `monthly` | e.g. `2025`                            |
| `month`  | number | required for `daily`               | `1`–`12`                               |

**Response 200:**

```json
{
  "period": "monthly",
  "year": 2025,
  "month": null,
  "data": \[
    {
      "label": "2025-01",
      "totalReturnsReceived": 45000,
      "cumulativeReturns": 120000
    },
    {
      "label": "2025-02",
      "totalReturnsReceived": 62000,
      "cumulativeReturns": 182000
    }
  ]
}
```

`data` is sorted chronologically by `label`. `cumulativeReturns` is a running total across all periods. All amounts are in kobo.

**Errors:**

| Status | Meaning                                         |
| ------ | ----------------------------------------------- |
| 400    | `year` or `month` missing for the chosen period |
| 401    | Missing or invalid token                        |

\---

## Screen 7 — Business Dashboard

### GET /business/:userId/profile

**Auth:** JWT  
**Path params:** `userId` — business user UUID

**Response 200:**

```json
{
  "business\_profiles": {
    /\* BusinessProfileDto \*/
  },
  "users": {
    /\* UserPublicDto \*/
  },
  "bridge\_ratings": {
    /\* BridgeRatingResponseDto or null \*/
  }
}
```

See [Business Profile object](#business-profile-object), [User object](#user-object), and [Bridge Rating object](#bridge-rating-object).

**Errors:**

| Status | Meaning                    |
| ------ | -------------------------- |
| 401    | Missing or invalid token   |
| 404    | Business profile not found |

\---

### GET /business/:userId/stats

**Auth:** JWT  
**Path params:** `userId` — business user UUID

**Response 200:**

| Field                   | Type   | Notes                                         |
| ----------------------- | ------ | --------------------------------------------- |
| `totalCapitalRaised`    | number | Across all funded/completed listings, in kobo |
| `totalSweptToInvestors` | number | In kobo                                       |
| `completedDealsCount`   | number |                                               |

\---

### GET /business/:userId/active-listing

**Auth:** JWT  
**Path params:** `userId` — business user UUID

**Response 200:** A [Listing object](#listing-object) if the business has an active or funded listing, or `null` if none exists.

\---

### GET /business/:userId/activity

**Auth:** JWT  
**Path params:** `userId` — business user UUID

**Response 200:** Array of up to 5 [Notification objects](#notification-object), most recent first.

\---

## Screen 8 — Listing Creation

### POST /listings/calculate-terms

**Auth:** JWT (business)

Preview terms before committing. Does not create anything.

**Request body:**

| Field                      | Type   | Required | Notes                                               |
| -------------------------- | ------ | -------- | --------------------------------------------------- |
| `capitalRequested`         | number | yes      | In kobo. Max is tier-capped (see Tier Funding Caps) |
| `preferredRepaymentMonths` | number | yes      | Any integer 1–24 (Tier 1 max: 18)                   |

**Response 201:**

| Field                   | Type   | Notes                                                         |
| ----------------------- | ------ | ------------------------------------------------------------- |
| `capitalRequested`      | number | In kobo                                                       |
| `totalDisbursed`        | number | total after default pool is subtracted, In kobo               |
| `totalReturnPercent`    | number | Total return charged to the business                          |
| `totalReturnAmount`     | number | `capitalRequested × (1 + totalReturnPercent/100)`, in kobo    |
| `revenueSharePercent`   | number | Percent swept from each incoming payment                      |
| `targetRepaymentMonths` | number | Expected months to full repayment at average revenue          |
| `monthlySweepAtAverage` | number | Expected monthly sweep in kobo                                |
| `tranche1`              | number | 40% of `capitalRequested`, in kobo — released at full funding |
| `tranche2`              | number | 30% — released at 33% repayment                               |
| `tranche3`              | number | 30% — released at 67% repayment                               |
| `returnRateBreakdown`   | object | See below                                                     |

`returnRateBreakdown`:

| Field             | Type            | Notes                                            |
| ----------------- | --------------- | ------------------------------------------------ |
| `baseRate`        | number          | Starting rate (30%)                              |
| `standing`        | `standing` enum | Business's current standing                      |
| `ratingReduction` | number          | Discount applied based on standing (negative)    |
| `horizonBump`     | number          | +0.5% per month beyond the 12-month base horizon |
| `finalRate`       | number          | Clamped to 20–40%                                |

**Errors:**

| Status | Meaning                                                |
| ------ | ------------------------------------------------------ |
| 400    | Validation error or capital requested exceeds tier cap |
| 401    | Missing or invalid token                               |
| 403    | Caller is not a business account                       |

\---

### POST /listings

**Auth:** JWT (business)

Creates the listing, generates an AI investor profile, and sets it live.

**Request body:**

| Field                      | Type   | Required | Notes                             |
| -------------------------- | ------ | -------- | --------------------------------- |
| `capitalRequested`         | number | yes      | In kobo. Max is tier-capped       |
| `preferredRepaymentMonths` | number | yes      | Any integer 1–24 (Tier 1 max: 18) |
| `useOfFunds`               | string | yes      | Non-empty narrative               |
| `expectedImpact`           | string | yes      | Non-empty narrative               |

**Response 201:** See [Listing object](#listing-object).

**Errors:**

| Status | Meaning                                          |
| ------ | ------------------------------------------------ |
| 400    | Validation error or capital exceeds tier cap     |
| 401    | Missing or invalid token                         |
| 403    | Caller is not a business account                 |
| 409    | Business already has an active or funded listing |

\---

### Tier Funding Caps

Each tier sets the **maximum** capital a business can request per listing.

| Tier | Max (kobo)  | Max (NGN)  | How to unlock                    |
| ---- | ----------- | ---------- | -------------------------------- |
| 1    | 10,000,000  | ₦100,000   | Default for all new businesses   |
| 2    | 50,000,000  | ₦500,000   | 5 completed repayments at Tier 1 |
| 3    | 100,000,000 | ₦1,000,000 | Manual admin promotion           |

The actual cap is also bounded by a revenue multiple: **1.5× average monthly revenue for Tier 1**, **2× for Tier 2 and 3**. The binding limit is whichever is lower.

\---

## Screen 9 — Payments

### GET /business/:userId/balance

**Auth:** JWT  
**Path params:** `userId` — business user UUID

**Response 200:**

| Field     | Type   | Notes                                     |
| --------- | ------ | ----------------------------------------- |
| `balance` | number | Available internal ledger balance in kobo |

\---

### POST /business/:userId/simulate-revenue

**Auth:** JWT (business)  
**Path params:** `userId` — business user UUID

Simulates real-world revenue by automatically depositing 5% of the business's average monthly revenue into their virtual account every 10 seconds for 1 minute (6 deposits total). This is extremely useful for demonstrating the sweep mechanics in real-time.

**Response 201:**

```json
{
  "message": "Revenue simulation started",
  "deposits": 6,
  "intervalSeconds": 10,
  "amountPerDeposit": 25000
}
```

**Errors:**

| Status | Meaning                                           |
| ------ | ------------------------------------------------- |
| 400    | Business has no recorded revenue to simulate from |
| 401    | Missing or invalid token                          |
| 403    | Caller is not a business account                  |
| 404    | Profile or virtual account not found              |

\---

### POST /business/:userId/checkout

**Auth:** JWT (business)  
**Path params:** `userId` — business user UUID

Initiates a Squad checkout flow for business revenue or wallet top-up. Returns a `checkout\_url` for redirection.

**Request body:**

| Field    | Type   | Required | Notes          |
| -------- | ------ | -------- | -------------- |
| `amount` | number | yes      | Amount in kobo |

**Response 201:**

| Field              | Type   | Notes                       |
| ------------------ | ------ | --------------------------- |
| `checkout\_url`    | string | URL to redirect the user to |
| `transaction\_ref` | string | Internal reference          |

**Errors:**

| Status | Meaning                          |
| ------ | -------------------------------- |
| 400    | Validation error                 |
| 401    | Missing or invalid token         |
| 403    | Caller is not a business account |

\---

### GET /business/:userId/payment-link

**Auth:** JWT  
**Path params:** `userId` — business user UUID

**Response 200:**

| Field                  | Type   | Notes                        |
| ---------------------- | ------ | ---------------------------- |
| `paymentLink`          | string | Full URL for QR generation   |
| `virtualAccountNumber` | string | Squad virtual account number |

\---

### GET /business/:userId/payments

**Auth:** JWT  
**Path params:** `userId` — business user UUID

**Response 200:** Array of up to 10 [Sweep Event objects](#sweep-event-object), most recent first, for the active listing.

\---

### GET /business/:userId/sweep-summary

**Auth:** JWT  
**Path params:** `userId` — business user UUID

**Response 200:**

| Field                 | Type   | Notes                                     |
| --------------------- | ------ | ----------------------------------------- |
| `totalSwept`          | number | Total swept to investors so far, in kobo  |
| `totalRemaining`      | number | `totalReturnAmount - totalSwept`, in kobo |
| `currentSweepPercent` | string | e.g. `"8.50"`                             |
| `serviceFee`          | number | 1% Platform service fee in kobo           |

\---

### GET /business/:userId/revenue

**Auth:** JWT  
**Path params:** `userId` — business user UUID  
**Query params:**

| Param    | Type   | Required                                  | Notes                                                |
| -------- | ------ | ----------------------------------------- | ---------------------------------------------------- |
| `period` | string | yes                                       | `"hourly"` \| `"daily"` \| `"monthly"` \| `"yearly"` |
| `year`   | number | required for `hourly`, `daily`, `monthly` | e.g. `2025`                                          |
| `month`  | number | required for `hourly`, `daily`            | `1`–`12`                                             |
| `day`    | number | required for `hourly`                     | `1`–`31`                                             |

**Response 200:**

```json
{
  "period": "monthly",
  "year": 2025,
  "month": null,
  "data": \[
    {
      "label": "2025-01",
      "totalIncoming": 2000000,
      "totalSwept": 170000,
      "totalRetained": 1830000
    }
  ]
}
```

Excludes manual full-repayment events. `data` is sorted chronologically by `label`.

**Errors:**

| Status | Meaning                                         |
| ------ | ----------------------------------------------- |
| 400    | `year` or `month` missing for the chosen period |
| 401    | Missing or invalid token                        |
| 404    | Business profile not found                      |

\---

### POST /business/repay/:listingId

**Auth:** JWT (business)  
**Path params:** `listingId` — UUID of the funded listing to repay in full

Pays off the entire remaining balance in one transfer. Any locked tranches are released first (the business receives them), then the full remaining amount is transferred from the business VA to escrow and distributed to investors. The listing transitions to `completed`.

**Response 201:**

| Field        | Type   | Notes                                                   |
| ------------ | ------ | ------------------------------------------------------- |
| `repaid`     | number | Amount repaid in kobo                                   |
| `serviceFee` | number | 1% Platform service fee deducted in kobo                |
| `message`    | string | e.g. `"₦32,250 repaid. Your listing is now completed."` |

**Errors:**

| Status | Meaning                                                    |
| ------ | ---------------------------------------------------------- |
| 400    | Listing is not in `funded` status, or no remaining balance |
| 401    | Missing or invalid token                                   |
| 403    | Caller is not a business account                           |
| 404    | Listing not found                                          |
| 502    | Squad transfer failed                                      |

\---

## Withdrawals (Payouts)

> Applies to both business and investor accounts. Requires JWT.
> Amounts are in kobo and sent as strings.
> The server generates a unique `transactionReference` prefixed with the merchant ID `SB3YYHDENW\_`.

### POST /payouts/transfer

Initiate a payout to the user's registered bank account (beneficiary account).
The backend will automatically look up the user's account name from Squad before transferring.

**Auth:** JWT

**Request body:**

| Field    | Type   | Required | Notes                           |
| -------- | ------ | -------- | ------------------------------- |
| `amount` | string | yes      | Amount in kobo (e.g. `"10000"`) |

**Response 201:**

| Field                  | Type   | Notes                      |
| ---------------------- | ------ | -------------------------- |
| `id`                   | UUID   | Payout record ID           |
| `transactionReference` | string | Server-generated reference |
| `status`               | string | Current status from Squad  |

**Errors:**

| Status | Meaning                         |
| ------ | ------------------------------- |
| 400    | Validation error or bad request |
| 401    | Missing or invalid token        |
| 422    | Insufficient wallet balance     |
| 424    | Timeout - requery required      |

\---

### POST /payouts/requery

Requery a payout to confirm its final status.

**Auth:** JWT

**Request body:**

| Field                  | Type   | Required | Notes                          |
| ---------------------- | ------ | -------- | ------------------------------ |
| `transactionReference` | string | yes      | Reference returned on initiate |

**Response 200:**

| Field                  | Type         | Notes                    |
| ---------------------- | ------------ | ------------------------ |
| `transactionReference` | string       |                          |
| `status`               | string       | Latest status from Squad |
| `squadStatus`          | string       | Same as status           |
| `updatedAt`            | ISO datetime |                          |

**Errors:**

| Status | Meaning                  |
| ------ | ------------------------ |
| 401    | Missing or invalid token |
| 404    | Payout not found         |

\---

### GET /payouts/list

List payouts for the authenticated user.

**Auth:** JWT

**Query params:**

| Param     | Type   | Required | Notes                            |
| --------- | ------ | -------- | -------------------------------- |
| `page`    | number | no       | Default `1`                      |
| `perPage` | number | no       | Default `10`, max `100`          |
| `dir`     | string | no       | `ASC` or `DESC` (default `DESC`) |

**Response 200:**

```json
{
  "data": \[
    /\* PayoutResponseDto\[] \*/
  ],
  "page": 1,
  "perPage": 10,
  "total": 42
}
```

**Errors:**

| Status | Meaning                  |
| ------ | ------------------------ |
| 401    | Missing or invalid token |

\---

## Screen 10 — Notifications

### GET /notifications

**Auth:** JWT

**Response 200:** Array of [Notification objects](#notification-object), most recent first.

\---

### PATCH /notifications/:id/read

**Auth:** JWT  
**Path params:** `id` — notification UUID

**Response 200:**

| Field     | Type   |
| --------- | ------ |
| `success` | `true` |

\---

### PATCH /notifications/read-all

**Auth:** JWT

**Response 200:**

| Field     | Type   |
| --------- | ------ |
| `success` | `true` |

\---

## Supporting Endpoints

### POST /auth/login

**Auth:** None

**Request body:**

| Field      | Type   | Required |
| ---------- | ------ | -------- |
| `email`    | string | yes      |
| `password` | string | yes      |

**Response 200:**

| Field                       | Type                         | Notes |
| --------------------------- | ---------------------------- | ----- |
| `accessToken`               | string                       | JWT   |
| `userType`                  | `"business"` \| `"investor"` |       |
| `squadVirtualAccountNumber` | string \| null               |       |

**Errors:**

| Status | Meaning             |
| ------ | ------------------- |
| 401    | Invalid credentials |

\---

### PATCH /investor/:userId/preferences

**Auth:** JWT (investor)  
**Path params:** `userId` — investor user UUID

All fields optional. Send only the fields to update.

**Request body:**

| Field                      | Type                | Notes                                          |
| -------------------------- | ------------------- | ---------------------------------------------- |
| `sectorInterests`          | `sector` enum array |                                                |
| `riskTierPreference`       | string              | `"conservative"` \| `"balanced"` \| `"growth"` |
| `returnTimelinePreference` | string              | `"short"` \| `"medium"` \| `"flexible"`        |
| `investmentRangeMin`       | number              | In kobo                                        |
| `investmentRangeMax`       | number              | In kobo                                        |

**Response 200:** Full updated investor profile:

| Field                      | Type                        |
| -------------------------- | --------------------------- |
| `id`                       | UUID                        |
| `userId`                   | UUID                        |
| `sectorInterests`          | `sector` enum array \| null |
| `riskTierPreference`       | string \| null              |
| `returnTimelinePreference` | string \| null              |
| `investmentRangeMin`       | number \| null              |
| `investmentRangeMax`       | number \| null              |
| `createdAt`                | ISO datetime                |
| `updatedAt`                | ISO datetime                |

**Errors:**

| Status | Meaning                           |
| ------ | --------------------------------- |
| 400    | Invalid field values              |
| 401    | Missing or invalid token          |
| 403    | Caller is not an investor account |

\---

## Reusable Object Shapes

### Listing object

| Field                   | Type                 | Notes                                      |
| ----------------------- | -------------------- | ------------------------------------------ |
| `id`                    | UUID                 |                                            |
| `businessId`            | UUID                 | Business profile UUID                      |
| `capitalRequested`      | number               | In kobo                                    |
| `useOfFunds`            | string               |                                            |
| `expectedImpact`        | string               |                                            |
| `revenueSharePercent`   | string               | e.g. `"8.50"`                              |
| `totalReturnAmount`     | number               | In kobo                                    |
| `totalReturnPercent`    | string               | e.g. `"24.50"`                             |
| `targetRepaymentMonths` | number               |                                            |
| `aiProfile`             | string               | AI-generated investor narrative            |
| `status`                | `listingStatus` enum |                                            |
| `totalCommitted`        | number               | Investor capital committed so far, in kobo |
| `totalSwept`            | number               | In kobo                                    |
| `investorCount`         | number               |                                            |
| `createdAt`             | ISO datetime         |                                            |
| `updatedAt`             | ISO datetime         |                                            |

\---

### Tranche object

| Field                    | Type                 | Notes                    |
| ------------------------ | -------------------- | ------------------------ |
| `id`                     | UUID                 |                          |
| `listingId`              | UUID                 |                          |
| `trancheNumber`          | number               | `1`, `2`, or `3`         |
| `amount`                 | number               | In kobo                  |
| `status`                 | `trancheStatus` enum |                          |
| `releaseCondition`       | string               | Human-readable condition |
| `releasedAt`             | ISO datetime \| null |                          |
| `squadTransferReference` | string \| null       |                          |

\---

### Bridge Rating object

| Field                       | Type                 | Notes                                                    |
| --------------------------- | -------------------- | -------------------------------------------------------- |
| `id`                        | UUID                 |                                                          |
| `businessId`                | UUID                 | Business profile UUID                                    |
| `overallScore`              | string               | e.g. `"72.50"` — out of 100                              |
| `standing`                  | `standing` enum      |                                                          |
| `repaymentSpeedScore`       | string               | Max 30 pts                                               |
| `repaymentConsistencyScore` | string               | Max 30 pts                                               |
| `transactionVolumeScore`    | string               | Max 20 pts                                               |
| `revenueConsistencyScore`   | string               | Max 15 pts                                               |
| `cacBonusScore`             | string               | Max 5 pts — `"5.00"` if CAC verified, `"0.00"` otherwise |
| `lastCalculatedAt`          | ISO datetime         |                                                          |
| `updatedAt`                 | ISO datetime \| null |                                                          |

\---

### Business Profile object

| Field                      | Type           | Notes                                                                                                                                                                                                                                                                                                                                           |
| -------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                       | UUID           | Business profile UUID — used in rating endpoints                                                                                                                                                                                                                                                                                                |
| `userId`                   | UUID           | User UUID — used in dashboard endpoints                                                                                                                                                                                                                                                                                                         |
| `businessName`             | string         |                                                                                                                                                                                                                                                                                                                                                 |
| `sector`                   | `sector` enum  |                                                                                                                                                                                                                                                                                                                                                 |
| `location`                 | string         |                                                                                                                                                                                                                                                                                                                                                 |
| `yearsInOperation`         | number         |                                                                                                                                                                                                                                                                                                                                                 |
| `averageMonthlyRevenue`    | number         | Self-reported, in kobo                                                                                                                                                                                                                                                                                                                          |
| `businessDescription`      | string         |                                                                                                                                                                                                                                                                                                                                                 |
| `cacRegistrationNumber`    | string \| null |                                                                                                                                                                                                                                                                                                                                                 |
| `cacVerified`              | boolean        |                                                                                                                                                                                                                                                                                                                                                 |
| `bankConnected`            | boolean        | True once Mono bank account is connected                                                                                                                                                                                                                                                                                                        |
| `monoLinked`               | boolean        | True once Mono account ID is stored (same event as `bankConnected`)                                                                                                                                                                                                                                                                             |
| `monoAverageMonthlyInflow` | number \| null | Mono-verified average monthly bank inflow in kobo. `null` until the `mono.events.account\_income` webhook fires (seconds–minutes after `POST /business/connect-bank`). **Overrides `averageMonthlyRevenue` in all listing term calculations once set.** Poll `GET /business/:userId/profile` after connecting bank until this becomes non-null. |
| `tier`                     | number         | `1`, `2`, or `3`                                                                                                                                                                                                                                                                                                                                |
| `completedRepaymentCount`  | number         |                                                                                                                                                                                                                                                                                                                                                 |
| `createdAt`                | ISO datetime   |                                                                                                                                                                                                                                                                                                                                                 |
| `updatedAt`                | ISO datetime   |                                                                                                                                                                                                                                                                                                                                                 |

\---

### User object

| Field                       | Type                         |
| --------------------------- | ---------------------------- |
| `id`                        | UUID                         |
| `fullName`                  | string                       |
| `email`                     | string                       |
| `phone`                     | string                       |
| `userType`                  | `"business"` \| `"investor"` |
| `bvnVerified`               | boolean                      |
| `squadVirtualAccountNumber` | string \| null               |
| `createdAt`                 | ISO datetime                 |

\---

### Investment object

| Field                     | Type                    | Notes                                                            |
| ------------------------- | ----------------------- | ---------------------------------------------------------------- |
| `id`                      | UUID                    |                                                                  |
| `listingId`               | UUID                    |                                                                  |
| `investorId`              | UUID                    | Investor profile UUID                                            |
| `amountCommitted`         | number                  | In kobo                                                          |
| `defaultPoolContribution` | number                  | 4% of `amountCommitted`, in kobo. Held in platform safety net.   |
| `sharePercent`            | string                  | Investor's share of the listing's total capital, e.g. `"9.6000"` |
| `totalReturnDue`          | number                  | Total return owed to this investor, in kobo                      |
| `totalReturnReceived`     | number                  | Return received so far, in kobo                                  |
| `targetRepaymentMonths`   | number                  | Target months to full repayment                                  |
| `businessName`            | string                  | Name of the business the investor funded                         |
| `status`                  | `investmentStatus` enum | `"inactive"` (pre-funding) \| `"active"` (repayment in progress) |
| `squadTransferReference`  | string \| null          |                                                                  |
| `createdAt`               | ISO datetime            |                                                                  |
| `updatedAt`               | ISO datetime            |                                                                  |

\---

### Sweep Event object

| Field                   | Type         | Notes                                                                                              |
| ----------------------- | ------------ | -------------------------------------------------------------------------------------------------- |
| `id`                    | UUID         |                                                                                                    |
| `listingId`             | UUID         |                                                                                                    |
| `incomingPaymentAmount` | number       | Full payment received, in kobo                                                                     |
| `sweepPercent`          | string       | e.g. `"8.50"`                                                                                      |
| `sweepAmount`           | number       | Amount swept to investors, in kobo                                                                 |
| `serviceFee`            | number       | 1% Platform service fee in kobo                                                                    |
| `netAmountRetained`     | number       | Amount retained by the business after the 1% platform fee and investor sweep are deducted, in kobo |
| `squadWebhookReference` | string       |                                                                                                    |
| `processedAt`           | ISO datetime |                                                                                                    |

\---

### Notification object

| Field       | Type         |
| ----------- | ------------ |
| `id`        | UUID         |
| `userId`    | UUID         |
| `title`     | string       |
| `body`      | string       |
| `read`      | boolean      |
| `createdAt` | ISO datetime |
