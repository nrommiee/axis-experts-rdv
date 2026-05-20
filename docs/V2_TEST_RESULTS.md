# Vague 2 — Business fixes — Test results

Date: 2026-05-20
Branch: `claude/fix-business-logic-bugs-dRl9Y`
Audit ref: `docs/PRE_LAUNCH_AUDIT_2026-05-20.md`

> **Stop**: these are agent-side local checks only. Real preview/prod testing
> against Supabase + Odoo + Resend must be performed by a human before
> opening the PR.

---

## Item 0 — Resend lazy-init

- `src/lib/email.ts` no longer instantiates `new Resend()` at module load;
  `getResendClient()` lazily constructs it on first use and throws
  `RESEND_API_KEY is not set` otherwise.
- `pnpm build` with `RESEND_API_KEY` **unset**: compiled successfully, 18/18
  static pages generated.
- Test to run locally with `pnpm dev` and a real key: trigger an invitation
  (`POST /api/admin/invite`) → email arrives via Resend.

## Item 1 — Agency ownership for Odoo routes

- New helper `src/lib/odoo/ownership.ts` exporting `verifyOrderOwnership` +
  `getAgentIdsForAgency`, mirroring the listing logic of
  `src/app/api/odoo/orders/route.ts` (filter on
  `x_studio_agence_partenaire IN [agents]` for agencies, fall back to
  `partner_id` for everyone else).
- Wired into:
  - `src/app/api/odoo/attachments/route.ts` (GET)
  - `src/app/api/odoo/attachments/download/route.ts` (GET)
  - `src/app/api/odoo/messages/route.ts` (GET + POST)
- Local checks: `pnpm tsc --noEmit` clean.
- Tests to run manually:
  - **social user**: open one of their orders → PDF download + message
    thread OK.
  - **agency user** (request a test account if needed): open an order →
    PDF download + message thread OK, POST message returns 200.
  - **social user** attempts an unrelated order id → 404 (no regression).

## Item 2 — Soft-delete + re-invitation

- `/api/admin/invite`: emits `warning: 'user_soft_deleted'` (+ previous org
  name + deletion date) when a prior soft-deleted `portal_clients` row
  matches the email (case-insensitive on `email_bailleur`).
- `/api/auth/setup-account`: reactivates the existing auth.users entry when
  it is banned (lifts the ban, sets the new password) and upserts
  `portal_clients` to the new organization (clears `deleted_at`,
  `blocked_at`). Rejects with 409 if a non-banned, non-deleted account
  already exists (anti-takeover).
- `/api/admin/users`: now includes soft-deleted users so they show up with
  a `Supprimé` badge instead of disappearing.
- UI:
  - `src/app/admin/users/page.tsx` and the users table in
    `src/app/admin/organizations/[id]/page.tsx` render a 3-state badge
    (Supprimé gray / Bloqué red / Actif emerald) using `deleted_at`
    + `is_banned`.
  - The invite modal in the org detail page surfaces an amber warning
    banner when the API returns `warning: 'user_soft_deleted'`. Chose the
    inline-banner option over the pre-send modal (task left the choice
    open) because the invitation row is already created at that point and
    redoing it would race with the email send.
- Local checks: `pnpm tsc --noEmit` clean.
- Tests to run manually:
  1. Soft-delete a user; verify the list now shows them with `Supprimé`.
  2. Re-invite the same email in a different org; verify the amber banner
     mentions the previous org and deletion date.
  3. Click the invitation link, choose a new password.
  4. Log in — should land on the new org's dashboard (no `User is banned`).
  5. SQL: `auth.users.banned_until IS NULL`,
     `portal_clients.deleted_at IS NULL`,
     `portal_clients.organization_id = <new org id>`.

## Item 3 — Calendrier 2-month (Booking-style)

- State: **complete** (lightweight refactor — the existing component
  already used `react-day-picker` in range mode with FR locale + +30d
  ceiling).
- `src/components/ui/date-range-picker.tsx`: `numberOfMonths` is now
  responsive — 2 on `min-width: 768px`, 1 otherwise — via
  `window.matchMedia`. SSR keeps the 1-month layout and upgrades on
  hydration.
- No tabs / flexibility pills existed in the codebase (`Dates flexibles`,
  `± 1 jour` searches returned nothing); nothing to remove.
- Tests to run manually on `/demande`:
  - Desktop ≥ 768px: 2 months side-by-side, pick a range across months.
  - Mobile < 768px: 1 month, swipe to next month, pick a range.
  - Attempt > 30 days: end of range is blocked by `disabledMatchers`.
  - Submit: `dateDebut` and `dateFin` (ISO yyyy-MM-dd) flow into the
    existing submission state unchanged.

## Item 4 — Custom fields audit + P1-04

- `docs/CUSTOM_FIELDS_E2E.md` documents the schema, frontend/backend
  chains, and an E2E test plan (happy path + 5 P1-04 cases). Includes the
  explicit confirmation that custom field values are never sent to Odoo.
- `src/app/api/rdv-custom-values/route.ts` POST now rejects:
  - any `order_ref` not present in `portal_submissions` for the caller's
    organization (HTTP 400 `order_ref invalide`);
  - any `custom_field_id` not activated in `organization_custom_fields`
    for the caller's organization (HTTP 400 `custom_field_id invalide`).
- Both rejection paths log `[rdv-custom-values] invalid ...` with user,
  org, order, and offending value so abuse attempts surface in logs.
- Local checks: `pnpm tsc --noEmit` clean; existing 49 vitest tests
  remain green (`pnpm vitest run`).
- Manual E2E plan lives in `docs/CUSTOM_FIELDS_E2E.md` §4 — run after
  preview deploy.

---

## Local toolchain status

| Check                           | Result                                              |
| ------------------------------- | --------------------------------------------------- |
| `pnpm tsc --noEmit`             | 0 errors                                            |
| `pnpm vitest run`               | 49 passed / 5 files                                 |
| `pnpm build` *(no Resend key)*  | compiles + 18/18 prerender — needs dummy `NEXT_PUBLIC_SUPABASE_*` |
| `pnpm lint`                     | 9 errors / 16 warnings — **all pre-existing** (google-maps-loader, partner-products, useAddressAutocomplete, PriceCalculatorModal, admin/stats/missions-by-org, brouillons, dashboard, demande, login, profil, reset-password, setup-account); no new lint debt introduced by Vague 2 |

The build still requires `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` at prerender time because
`src/lib/supabase/client.ts` calls `.trim()` on them unconditionally. That
is out of scope for Vague 2 (no failing build in CI as long as the secrets
are wired up on the deployment), but worth flagging for a future hardening
pass — same lazy-init treatment as Item 0 would remove the hard
dependency.
