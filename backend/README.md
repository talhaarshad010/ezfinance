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
| POST   | `/api/auth/register`        |      | Create account; emails a verification code                    |
| POST   | `/api/auth/verify-email`    |      | Confirm email with the code; returns a session                |
| POST   | `/api/auth/resend-code`     |      | Send a new sign-up code                                       |
| POST   | `/api/auth/login`           |      | Email + password; returns a session                           |
| POST   | `/api/auth/google`          |      | Google ID token from native Google Sign-In; returns a session |
| POST   | `/api/auth/refresh`         |      | Swap a refresh token (single-use) for a new session           |
| POST   | `/api/auth/logout`          | ✓    | Revoke the current session                                    |
| POST   | `/api/auth/forgot-password` |      | Email a reset code (always 204)                               |
| POST   | `/api/auth/reset-password`  |      | Code + new password; returns a session                        |
| POST   | `/api/auth/change-password` | ✓    | Current + new password                                        |
| POST   | `/api/auth/set-password`    | ✓    | Add a password to a Google-only account (409 if one exists)   |
| GET    | `/api/profile`              | ✓    | The signed-in user's profile (recreated if missing), with `hasPassword` |
| PUT    | `/api/profile`              | ✓    | Update name, income, city, province, filer status             |
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

## Authentication model

Supabase issues the access tokens (JWT, signed with ES256). The API validates them using the
public keys from `https://jlbvnztpzztoazeujaxa.supabase.co/auth/v1/.well-known/openid-configuration`,
checking signature, issuer, audience (`authenticated`) and expiry. No JWT secret is stored here.

Profiles live in `public.profiles` and are created by a database trigger when a user signs up,
from the metadata sent by `/api/auth/register`. The table has RLS enabled with no policies and
no grants for `anon`/`authenticated`, so the public Supabase Data API cannot read it; only this
backend (connected as `postgres`) can.

## Supabase dashboard settings

- **Authentication → Emails → Confirm signup** and **Reset password**: the templates must
  include `{{ .Token }}` so users receive a code instead of only a link.
- **Authentication → Providers → Email**: keep "Confirm email" on; email OTP length 6 (the app's
  OTP screen expects 6 digits); minimum password length 8.
- **Authentication → Sign In / Providers → Google**: enabled; Client IDs = the web, iOS and
  Android OAuth client IDs (comma-separated, web first); Client Secret = the web client's secret;
  "Skip nonce check" on (the free Google Sign-In SDK on iOS adds a nonce the app can't read).
- The built-in email sender is for testing only: a few emails per hour, delivered only to members
  of the Supabase organization. Set up custom SMTP before real users sign up.
