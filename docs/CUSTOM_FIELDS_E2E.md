# Custom Fields — E2E audit

Date: 2026-05-20
Scope: items P1-04 (RLS / authorization hardening on POST /api/rdv-custom-values)
and UX #5 (verify the custom-field feature works end-to-end).

> **Confirmed:** custom field values are stored in Supabase only
> (`rdv_custom_values`) and **never** sent to Odoo. Verified by grepping
> `src/app/api/submit-rdv/route.ts` for any `custom_field*` / `customValue*`
> reference — zero hits.

---

## 1. DB schema

Source: `supabase/migrations/0010_custom_fields.sql` (+ seed extensions in
`supabase/migrations/0011_custom_fields_garage_dates.sql`).

### `custom_fields` (library — shared across orgs)

| column        | type    | notes                                                                |
| ------------- | ------- | -------------------------------------------------------------------- |
| `id`          | uuid PK |                                                                      |
| `label`       | text    | display name                                                         |
| `field_key`   | text    | UNIQUE, used as JSON key when surfaced to dashboard / admin views    |
| `field_type`  | text    | CHECK: `text` / `number` / `boolean` / `date` / `select`             |
| `options`     | jsonb   | for `select` fields                                                  |
| `mission_type`| text    | CHECK: `entree` / `sortie` / `both`                                  |
| `description` | text    |                                                                      |

RLS: `SELECT` granted to all authenticated users (catalog is intentionally
shared so admins can activate any field per org).

### `organization_custom_fields` (per-org activation)

| column            | type    | notes                                                  |
| ----------------- | ------- | ------------------------------------------------------ |
| `id`              | uuid PK |                                                        |
| `organization_id` | uuid    | FK → `organizations(id)` ON DELETE CASCADE             |
| `custom_field_id` | uuid    | FK → `custom_fields(id)` ON DELETE CASCADE             |
| `required`        | bool    | defaults `false`                                       |
| `position`        | int     | display order                                          |
| `active`          | bool    | defaults `true` — soft-disable without losing settings |
| UNIQUE            |         | `(organization_id, custom_field_id)`                   |

RLS:
- `SELECT`: only when `organization_id` belongs to the caller's portal_client
  (`portal_clients.user_id = auth.uid()`).
- INSERT / UPDATE / DELETE: only via service-role (admin API).

### `rdv_custom_values` (per-RDV submitted value)

| column            | type    | notes                                            |
| ----------------- | ------- | ------------------------------------------------ |
| `id`              | uuid PK |                                                  |
| `organization_id` | uuid    | FK → `organizations(id)` ON DELETE CASCADE       |
| `custom_field_id` | uuid    | FK → `custom_fields(id)` ON DELETE CASCADE       |
| `order_ref`       | text    | Odoo `sale.order.name`, e.g. `S00123`            |
| `value`           | text    | always serialized as text                        |
| UNIQUE            |         | `(organization_id, custom_field_id, order_ref)`  |

RLS:
- `SELECT` / `INSERT` / `UPDATE`: only when `organization_id` belongs to the
  caller's portal_client. **There is no check on `custom_field_id`** at the
  policy level — that whitelist is enforced in the API layer (see §3).

---

## 2. Frontend chain

| Surface                    | File                                                              |
| -------------------------- | ----------------------------------------------------------------- |
| Admin lib / catalog        | `src/app/admin/custom-fields/page.tsx`                            |
| Per-org activation tab     | `src/app/admin/organizations/[id]/CustomFieldsTab.tsx`            |
| User saisie (RDV form)     | `src/app/demande/page.tsx` (load via `/api/custom-fields`, persist via POST `/api/rdv-custom-values`) |
| Dashboard display          | `src/app/dashboard/page.tsx` (GET `/api/rdv-custom-values?order_refs=...`) |

`f.id` consumed by the form is `custom_fields.id` (UUID). The activation row
in `organization_custom_fields` is looked up server-side by org + active flag,
not exposed to the client.

---

## 3. Backend chain

| Verb / Path                                              | File                                                                  |
| -------------------------------------------------------- | --------------------------------------------------------------------- |
| `GET /api/custom-fields`                                 | `src/app/api/custom-fields/route.ts`                                  |
| `GET / POST / PATCH / DELETE /api/admin/custom-fields`   | `src/app/api/admin/custom-fields/route.ts`                            |
| `POST /api/admin/organizations/[id]/custom-fields`       | `src/app/api/admin/organizations/[id]/custom-fields/route.ts`         |
| `POST / GET /api/rdv-custom-values`                      | `src/app/api/rdv-custom-values/route.ts`                              |

`POST /api/rdv-custom-values` now enforces:
1. `order_ref` exists in `portal_submissions` for the user's `organization_id`
   (rejects 400 otherwise).
2. Every `custom_field_id` in the payload must appear in
   `organization_custom_fields` for the user's org with `active = true`
   (rejects 400 if any are foreign / inactive).
3. The upsert itself remains scoped to `clientRow.organization_id` so RLS
   could not be tricked into writing under a different org.

Both rejection paths emit a `console.warn('[rdv-custom-values] ...')` with
the user_id, org_id, order_ref and the offending value so abuse attempts are
visible in logs.

---

## 4. E2E test plan (to be executed manually in preview / prod)

Run these against the deployed preview after the branch lands. Both an admin
account and a regular org user are needed.

### 4.1 Happy path

1. Admin → `/admin/custom-fields`: create a new library field
   `surface_m2` (type `number`, mission_type `both`).
2. Admin → `/admin/organizations/<orgA>` → Custom fields tab: activate
   `surface_m2`, mark `required = true`.
3. Log in as a user of `orgA`, go to `/demande`, fill out an RDV, surface_m2 = `42`.
   Submit.
4. SQL: `SELECT * FROM rdv_custom_values WHERE order_ref = '<S00123>';` →
   row exists with `value = '42'`, scoped to orgA.
5. `/dashboard` for the same user: the order card surfaces the `surface_m2`
   value via GET `/api/rdv-custom-values?order_refs=S00123`.
6. Odoo: confirm `sale.order` for `S00123` has **no** custom field traces
   (no message in chatter, no x_studio_* field updated).

### 4.2 P1-04 — foreign `custom_field_id`

Browser DevTools → Network → resend the POST with a `custom_field_id` that
belongs to a field activated only for `orgB` (or to no org at all). Expected:
**HTTP 400 `custom_field_id invalide`** and a `[rdv-custom-values] invalid
custom_field_id` warn line in the server logs.

### 4.3 P1-04 — invalid `order_ref`

Same as 4.2 but with `order_ref = "NOT_A_REAL_ORDER"`. Expected: **HTTP 400
`order_ref invalide`** and a server-side warn line.

### 4.4 P1-04 — order_ref of another org

POST with an `order_ref` that exists in `portal_submissions` but under a
different `organization_id` than the caller. Expected: **HTTP 400
`order_ref invalide`** (the `.eq("organization_id", ...)` filter on the
submission lookup blocks it).

### 4.5 GET regression

`GET /api/rdv-custom-values?order_refs=S00123` returns values only for orders
belonging to the caller's org (existing RLS-backed behavior — left unchanged).

### 4.6 Inactive field

Admin deactivates `surface_m2` for `orgA` (toggle `active = false`). A user
of `orgA` reposting a value for `surface_m2` should now be rejected with
**HTTP 400 `custom_field_id invalide`** because the activation row no longer
matches the API whitelist.
