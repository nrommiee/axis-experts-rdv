# Vague 3 — Security hardening — Test results

Date: 2026-05-20
Branch: `claude/security-hardening-a1T8H`
Audit ref: `docs/V3_SECURITY_AUDIT_2026-05-20.md`

> **Stop**: these are agent-side local checks only. Real preview/prod
> testing against Supabase + Odoo + Resend must be performed by a human
> before opening the PR. Each item below lists the manual scenarios to
> execute against the preview environment.

---

## Local checks (agent)

- `pnpm exec tsc --noEmit` → **0 errors**.
- `pnpm test --run` → **52/52** tests passing across 5 files.
- `pnpm lint` → 24 problems (9 errors, 15 warnings) — **identical to the
  baseline before the V3 changes** (verified via `git stash`).
- `pnpm build` → fails at prerender of `/admin/custom-fields` with the
  exact same error as on the baseline (`Cannot read properties of
  undefined (reading 'trim')` in the admin layout). Pre-existing,
  unrelated to V3. The compile + TypeScript phases both pass.

---

## Item 1 — P0-04 Documents size cap + MIME magic + storage scoping

### Code changes

- `next.config.ts` : `proxyClientMaxBodySize` `"200mb"` → `"25mb"`.
- `src/lib/mime-validation.ts` (new) : `validateMagicBytes(filename, base64)`
  compares the first bytes of the decoded base64 payload against the
  signature expected for each allowed extension (PDF `%PDF`, JPEG
  `FF D8 FF`, PNG, OOXML ZIP `PK\x03\x04`, OLE2 for legacy
  `.doc`/`.xls`). Extensions outside the allowlist return `false`
  immediately.
- `src/app/api/submit-rdv/route.ts` :
  - New constants at the top of the file: `MAX_DOCUMENTS = 10`,
    `MAX_DOCUMENT_BYTES = 3 MB`, `TOTAL_DOCUMENTS_BUDGET = 20 MB`,
    `ALLOWED_EXTENSIONS = [pdf, jpg, jpeg, png, doc, docx, xls, xlsx]`.
  - Validation block runs **right after `validateBody`** (before any
    Odoo work) so a rejected payload never produces a half-created
    sale.order. Each document is checked for shape, extension,
    size-per-file, cumulative budget, and magic bytes — each failure
    returns a 400 with a user-readable error.
  - Storage path is now scoped per order: `${user.id}/${orderId}/${fileName}`.
  - `upsert: true` → `upsert: false` so any collision surfaces as an
    upload error instead of silently overwriting a previous attachment.

### Tests to execute in preview

| Scenario | Expected |
| --- | --- |
| Upload 11 documents in a single submit | HTTP 400 `Trop de documents (max 10)`; no Odoo order created. |
| Upload a `.png` whose payload is actually a PDF (renamed file) | HTTP 400 `Format invalide pour ...`. |
| Upload a single file > 3 MB | HTTP 400 `... dépasse 3 MB`. |
| Upload 10 files totalling > 20 MB | HTTP 400 `Budget total documents dépassé (max 20 MB)`. |
| Upload an exotic extension (e.g. `.exe`, `.zip`) | HTTP 400 `Type de fichier non autorisé`. |
| Upload 3 valid PDFs (~1 MB each) | HTTP 200, order created, files visible in Storage under `${userId}/${orderId}/` and in Odoo attachments. |
| Run two consecutive submits with the same filename | Both succeed; second one lives in a different `${orderId}` folder and the underlying Odoo attachment carries the user-provided `customName`. |
| Upload payload > 25 MB total (Vercel proxy guard) | Vercel rejects the request before the handler runs (was 200 MB, now 25 MB). |

---

## Item 2 — P0-03 Resend hardening

### Code changes

- `src/lib/rate-limit.ts` (new) : `checkRateLimit({ userId?, ipAddress?,
  endpoint, limit, windowMinutes })` queries `request_log` with a single
  `count: "exact", head: true` request, then inserts a fresh row when
  the call is allowed. `extractClientIp(request)` reads
  `x-forwarded-for` (first hop) with a fallback to `x-real-ip`.
- Rate limits wired into:
  - `POST /api/submit-rdv` — 10 / 60 min / user.
  - `POST /api/admin/invite` — 20 / 60 min / user (admin).
  - `POST /api/admin/organizations/[id]/notifications/test` —
    10 / 60 min / user.
  - `POST /api/auth/setup-account` — 5 / 60 min / IP.
  - `GET /api/auth/validate-token` — 20 / 60 min / IP.
- `src/lib/email.ts` : recipient guard checks each `to:` address against
  `PRODUCTION_BLOCKLIST_DOMAINS = ["axis-experts.test", "example.com",
  "example.org"]` when `NODE_ENV === "production"` (returns
  `{ success: false, error: "Blocked recipient domain" }` with a
  `console.warn`). Default `replyTo` is now `info@axis-experts.be`.
- `src/app/api/submit-rdv/route.ts` : both `sendEmail` calls now carry
  systematic `tags: [{ route: "submit-rdv" }, { env: NODE_ENV }]` so
  Resend dashboard slices are usable.

### SQL migration to run before deploy

`docs/MIGRATIONS_TO_RUN.md` — `public.request_log` table + two indexes,
RLS enabled with no policy (service_role only). **Not executed by the
agent.**

### Tests to execute in preview

| Scenario | Expected |
| --- | --- |
| 11 consecutive `/api/submit-rdv` from the same user within 60 min | 1st-10th: HTTP 200; 11th: HTTP 429 `Trop de requêtes, réessayez plus tard`. |
| 21 consecutive admin invites from the same admin within 60 min | 21st: 429. |
| 11 consecutive notification test sends from the same admin | 11th: 429. |
| 6 consecutive `setup-account` POST from the same IP | 6th: 429 even with a valid token. |
| 21 consecutive `validate-token` GET from the same IP | 21st: 429. |
| In production, attempt to send an email to `test@example.com` | Email blocked; Resend not called; `[email] blocked recipient domain in production` warning logged; caller receives `{ success: false }`. |
| Normal submit flow with a real bailleur email | Email sent, Resend dashboard shows the message tagged `route=submit-rdv` + `env=production` (or `preview`), `Reply-To` is `info@axis-experts.be`. |

---

## Item 3 — P1-06 PII logs cleanup

### Code changes

- `src/lib/safe-log.ts` (new) : `maskEmail`, `hashShort`,
  `safeLogContext` helpers.
- `src/lib/email.ts` : success / failure `console.log`/`console.error`
  no longer include the raw `subject`. They log `{ id,
  subject_hash: hashShort(subject) }` instead so messages remain
  greppable in Vercel logs without spilling PII.
- `src/app/api/submit-rdv/route.ts` :
  - Step 4 owner CREATED logs : removed `name="${ownerName}"`, keep
    only `id=`.
  - Step 5 locataire name-mismatch warning : replaced `existing="..."
    incoming="..."` by `existing_name_length=X incoming_name_length=Y`.
  - Step 9 product / note line logs : replaced
    `name="${...substring(0,60)}"` by `name_length=N` /
    `note_length=N`.
  - Step 10 template-line logs : replaced the substring of `tLine.name`
    by `display_type=... note_length=N`.
  - Step 11 storage logs : the file name (which often encodes the
    locataire name) is no longer logged; we log
    `ext=... size_kb=... order=${orderId}` instead. Same on failure
    paths.
  - Step 12 recipient list log : replaced
    `${emailRecipients.join(", ")}` by
    `recipients_count=${emailRecipients.length}`.
- `src/app/api/admin/organizations/[id]/notifications/test/route.ts` :
  audit log no longer prints `user.email`; uses `user_id=${user.id}`.

### Tests to execute in preview

| Scenario | Expected |
| --- | --- |
| Submit a complete RDV with a non-Axis locataire email/name on preview | Vercel function logs for `submit-rdv` contain **no** locataire/owner email or full name, **no** raw subject, **no** filename. The order is still created in Odoo with the original data. |
| Admin clicks "Envoyer email de test" on an org | Vercel logs show `[admin] org <id> test notification sent by user_id=<uuid>` and `recipients_count=N`, but **not** the admin's email. |
| Trigger the cron `/api/cron/check-rdv-notifications` (manual call) | No regression; logs do not surface raw emails through `sendEmail`. |

---

## Files touched

```
docs/MIGRATIONS_TO_RUN.md                                       (new)
docs/V3_TEST_RESULTS.md                                         (new)
next.config.ts
src/app/api/admin/invite/route.ts
src/app/api/admin/organizations/[id]/notifications/test/route.ts
src/app/api/auth/setup-account/route.ts
src/app/api/auth/validate-token/route.ts
src/app/api/submit-rdv/route.ts
src/lib/email.ts
src/lib/mime-validation.ts                                      (new)
src/lib/rate-limit.ts                                           (new)
src/lib/safe-log.ts                                             (new)
```

---

## ⚠️ STOP — Preview tests to perform

The scenarios above are reasoned from the diff but **none of them have
been executed against a live preview**. Before opening the PR:

1. Run `docs/MIGRATIONS_TO_RUN.md` in the Supabase SQL editor (preview
   project).
2. Deploy the branch to Vercel preview and execute every "Tests to
   execute in preview" row above.
3. Confirm Resend dashboard shows the new tags + reply-to.
4. Confirm Vercel function logs are PII-free for `submit-rdv` and the
   admin notification test.
