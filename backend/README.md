# ezfinance backend

ASP.NET Core (.NET 10) Web API that sits between the ezfinance mobile app and Supabase.
The app only talks to this API; it never holds Supabase keys or calls Supabase directly.

```
Mobile app ──HTTP/JSON──► EzFinance.Api ──► Supabase Auth (GoTrue REST)
                                       └──► Supabase Postgres (EF Core + Npgsql)
```

## Project layout

```
backend/
├── EzFinance.slnx
├── supabase/migrations/                   SQL schema (applied to Supabase; EF only maps to it)
└── src/EzFinance.Api/
    ├── Program.cs                         DI, auth, rate limiting, health checks, pipeline
    ├── Configuration/SupabaseOptions.cs   "Supabase" settings section
    ├── Contracts/                         Request/response models
    ├── Controllers/                       AuthController, ProfileController
    ├── Entities/Profile.cs                public.profiles row + allowed values
    └── Infrastructure/
        ├── Supabase/                      Typed HttpClient for Supabase Auth (GoTrue)
        ├── Data/AppDbContext.cs           EF Core context for Supabase Postgres
        ├── Errors/                        Supabase Auth errors -> ProblemDetails
        ├── Auth/                          Claims helpers, rate limit policy
        └── HealthChecks/                  Supabase Auth + database readiness checks
```

## Setup

1. Install the .NET 10 SDK.
2. Set the database connection string (kept in user secrets, never committed).
   In the Supabase dashboard: **Connect → Session pooler**, copy the .NET (ADO.NET) string,
   fill in the database password, then:

   ```bash
   cd backend/src/EzFinance.Api
   dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=aws-...pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.jlbvnztpzztoazeujaxa;Password=...;SSL Mode=Require"
   ```

   Use the session pooler, not the direct connection: the direct host is IPv6-only on the free plan.

   Receipt scanning also needs a Gemini API key (from Google AI Studio), kept the same way:

   ```bash
   dotnet user-secrets set "Gemini:ApiKey" "<your Gemini API key>"
   ```

   Never put keys in `appsettings.json`: it is committed.

3. Run:

   ```bash
   dotnet run --launch-profile http
   ```

The API listens on `http://0.0.0.0:5080`, so it is reachable from:

| Client                  | Base URL                       |
| ----------------------- | ------------------------------ |
| iOS simulator           | `http://localhost:5080`        |
| Android emulator        | `http://10.0.2.2:5080`         |
| Physical phone (same Wi-Fi) | `http://<your Mac's LAN IP>:5080` |

## Endpoints

| Method | Path                        | Auth | Description                                                   |
| ------ | --------------------------- | ---- | ------------------------------------------------------------- |
| POST   | `/api/auth/email-code`      |      | Sign-up step 1: email a 6-digit code (creates the account if new) |
| POST   | `/api/auth/verify-email`    |      | Verify an emailed sign-up or sign-in code; returns a session  |
| POST   | `/api/auth/resend-code`     |      | Send a new sign-up code                                       |
| POST   | `/api/auth/login`           |      | Email + password; returns a session                           |
| POST   | `/api/auth/google`          |      | Google ID token from native Google Sign-In; returns a session |
| POST   | `/api/auth/refresh`         |      | Swap a refresh token (single-use) for a new session           |
| POST   | `/api/auth/logout`          | ✓    | Revoke the current session                                    |
| POST   | `/api/auth/forgot-password` |      | Email a reset code (always 204)                               |
| POST   | `/api/auth/verify-reset-code` |    | Check the reset code; returns a single-use reset token (10 min) |
| POST   | `/api/auth/complete-reset`  |      | Reset token + new password                                    |
| POST   | `/api/auth/change-password` | ✓    | Current + new password                                        |
| POST   | `/api/auth/set-password`    | ✓    | Add a password to a Google-only account (409 if one exists)   |
| GET    | `/api/profile`              | ✓    | The signed-in user's profile (recreated if missing), with `hasPassword` |
| PUT    | `/api/profile`              | ✓    | Update name, income, city, province, filer status             |
| GET    | `/api/accounts`             | ✓    | The user's linked bank accounts with live `balance` (opening balance + their transactions) |
| POST   | `/api/accounts`             | ✓    | Link an account (app-generated UUID `id`; only `accountLast4` is stored) |
| PUT    | `/api/accounts/{id}/balance` | ✓   | Set what the account holds now (its transactions stay as they are) |
| DELETE | `/api/accounts/{id}`        | ✓    | Remove an account (soft delete; its transactions keep the link) |
| GET    | `/api/bills`                | ✓    | Repeated monthly bills (each paid from a linked account)      |
| POST   | `/api/bills`                | ✓    | Add a bill (app-generated UUID `id`)                          |
| PUT    | `/api/bills/{id}`           | ✓    | Edit a bill                                                   |
| DELETE | `/api/bills/{id}`           | ✓    | Remove a bill (soft delete)                                   |
| POST   | `/api/bills/{id}/pay`       | ✓    | Mark paid: logs an expense (`transactionId`, `date`) in the bill's account |
| GET    | `/api/loans`                | ✓    | Loans and debts                                               |
| POST   | `/api/loans`                | ✓    | Add a loan (app-generated UUID `id`)                          |
| PUT    | `/api/loans/{id}`           | ✓    | Edit a loan                                                   |
| DELETE | `/api/loans/{id}`           | ✓    | Remove a loan (soft delete)                                   |
| GET    | `/api/transfers`            | ✓    | Money moved between the user's own accounts                   |
| POST   | `/api/transfers`            | ✓    | Move money (`fromAccountId` ≠ `toAccountId`, both linked)     |
| DELETE | `/api/transfers/{id}`       | ✓    | Delete a transfer (soft delete)                               |
| POST   | `/api/transfers/{id}/restore` | ✓  | Undo a delete                                                 |
| GET    | `/api/goals`                | ✓    | Savings goals, each with `saved` (sum of its contributions)   |
| POST   | `/api/goals`                | ✓    | Add a goal (app-generated UUID `id`)                          |
| PUT    | `/api/goals/{id}`           | ✓    | Edit name, target, deadline, icon, paused                     |
| DELETE | `/api/goals/{id}`           | ✓    | Archive a goal (soft delete)                                  |
| POST   | `/api/goals/{id}/contributions` | ✓ | Put money towards a goal (negative to withdraw; total can't go below 0) |
| GET    | `/api/budget`               | ✓    | Monthly limit (null until set) and envelopes                  |
| PUT    | `/api/budget`               | ✓    | Set the monthly limit (not below what envelopes hold)         |
| POST   | `/api/budget/envelopes`     | ✓    | Add an envelope (needs a budget; must fit in it; unique name) |
| PUT    | `/api/budget/envelopes/{id}` | ✓   | Edit an envelope                                              |
| DELETE | `/api/budget/envelopes/{id}` | ✓   | Remove an envelope (soft delete)                              |
| GET    | `/api/transactions`         | ✓    | The user's transactions, newest first, paged (`limit` ≤ 500, `cursor`); filters `from`, `to`, `type`, `category`, `accountId`, `q` |
| GET    | `/api/transactions/{id}`    | ✓    | One transaction                                               |
| POST   | `/api/transactions`         | ✓    | Create with an app-generated UUID `id` (same id again returns the existing row) |
| PUT    | `/api/transactions/{id}`    | ✓    | Edit amount, type, category, note, `accountId`, date, `excludeFromBudget` |
| DELETE | `/api/transactions/{id}`    | ✓    | Soft delete (204, also when already deleted)                  |
| POST   | `/api/transactions/{id}/restore` | ✓ | Undo a delete                                                |
| POST   | `/api/transactions/{id}/split` | ✓  | Replace with 2–10 parts that add up to the original           |
| GET    | `/api/sync` (WebSocket)     | ✓    | Live sync: `{"type":"changed","tables":[...]}` after any save to the user's data, from any device; closes when the token expires |
| GET    | `/health`                   |      | Liveness: the API process is up                               |
| GET    | `/health/ready`             |      | Readiness: Supabase Auth and the database are reachable       |
| GET    | `/scalar`                   |      | API docs and test UI (Development only)                       |

✓ = send `Authorization: Bearer <accessToken>`. `/api/auth/*` is limited to 10 requests per
minute per IP.

Errors are [ProblemDetails](https://www.rfc-editor.org/rfc/rfc9457) JSON. Auth errors carry a
`code` the app can branch on, e.g. `invalid_credentials` (401), `email_not_confirmed` (403),
`otp_expired` (403), `weak_password` (422), `invalid_current_password` (400),
`refresh_token_not_found` (401), `over_email_send_rate_limit` (429).

Profile values: `monthlyIncome` is one of `under_25k`, `25k_50k`, `50k_100k`, `100k_150k`,
`150k_plus`; `province` is one of `Punjab`, `Sindh`, `KPK`, `Balochistan`, `ICT`, `AJK`, `GB`;
`filerStatus` is one of `filer`, `non_filer`, `unsure`.

Transactions: `type` is `expense` or `income`; `amount` is positive (0.01 to 1,000,000,000);
`category` is one of `Groceries`, `Fuel`, `Salary`, `Bills`, `Dining`, `Other`; `date` is a
calendar date (`YYYY-MM-DD`, not in the future); `source` is `manual`, `scan` or `import`;
`accountId` (required) is one of the user's linked, not removed, bank accounts. Another user's
transaction or account answers 404. Error codes: `transaction_not_found` / `account_not_found`
(404), `id_conflict` (409), `future_date` (400), `split_total_mismatch` (400),
`invalid_split` (400), `invalid_account` (400). Bills, loans and transfers follow the same
rules (owned by the user, soft delete, 404 for another user's row) with codes `bill_not_found`,
`loan_not_found`, `transfer_not_found`, `same_account` and `remaining_exceeds_total`. An account's
`balance` includes its transfers in and out. Goals and budget codes: `goal_not_found`,
`insufficient_saved`, `envelope_not_found`, `no_budget`, `duplicate_envelope`, `over_budget`,
`below_allocated`.

## Authentication model

Supabase issues the access tokens (JWT, signed with ES256). The API validates them using the
public keys from `https://jlbvnztpzztoazeujaxa.supabase.co/auth/v1/.well-known/openid-configuration`,
checking signature, issuer, audience (`authenticated`) and expiry. No JWT secret is stored here.

Profiles live in `public.profiles` and are created by a database trigger when a user signs up,
from the name sent with `/api/auth/email-code` (the wizard fills in the rest via `PUT /api/profile`). The table has RLS enabled with no policies and
no grants for `anon`/`authenticated`, so the public Supabase Data API cannot read it; only this
backend (connected as `postgres`) can.

## Supabase dashboard settings

- **Authentication → Emails → Confirm signup**, **Magic Link** and **Reset password**: the templates
  must include `{{ .Token }}` so users receive a code instead of only a link. (New sign-ups get
  Confirm signup; the sign-up code for an email that already has an account uses Magic Link.)
- **Authentication → Providers → Email**: keep "Confirm email" on; email OTP length 6 (the app's
  OTP screen expects 6 digits); minimum password length 8.
- **Authentication → Sign In / Providers → Google**: enabled; Client IDs = the web, iOS and
  Android OAuth client IDs (comma-separated, web first); Client Secret = the web client's secret;
  "Skip nonce check" on (the free Google Sign-In SDK on iOS adds a nonce the app can't read).
- The built-in email sender is for testing only: a few emails per hour, delivered only to members
  of the Supabase organization. Set up custom SMTP before real users sign up.
