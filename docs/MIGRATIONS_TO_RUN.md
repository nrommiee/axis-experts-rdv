# Migrations Supabase à exécuter

Référence : `docs/V3_SECURITY_AUDIT_2026-05-20.md`.
Date : 2026-05-20.

> Aucune migration n'a été exécutée par l'agent. À exécuter manuellement
> dans le SQL Editor Supabase (rôle service_role) **avant** déploiement de
> la branche `claude/security-hardening-a1T8H`.

---

## V3 — Item 2 (P0-03 Resend hardening) : table `request_log`

Cette table sert au rate-limiting applicatif (helper `src/lib/rate-limit.ts`).
Elle n'a pas de policy RLS : seul le `service_role` y accède (lecture +
insertion via `createAdminClient`).

```sql
CREATE TABLE IF NOT EXISTS public.request_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  endpoint TEXT NOT NULL,
  status_code INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_request_log_user_endpoint_time
  ON public.request_log (user_id, endpoint, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_request_log_ip_endpoint_time
  ON public.request_log (ip_address, endpoint, created_at DESC);

ALTER TABLE public.request_log ENABLE ROW LEVEL SECURITY;
-- Pas de policy → service_role only
```

### Nettoyage périodique (optionnel)

Pour éviter une croissance illimitée, prévoir un job de purge des entrées
au-delà de 30 jours (cron Supabase / Edge Function / pg_cron) :

```sql
DELETE FROM public.request_log
WHERE created_at < NOW() - INTERVAL '30 days';
```

---

## V3.5 — Item B-07 : Toggle notifications création vs confirmation

Référence : `docs/UX_POLISH_AUDIT_2026-05-20.md`.

Deux nouvelles colonnes sur `organizations` pour permettre à l'admin de
filtrer indépendamment :
- `notify_on_create` — envoyer un email à la création d'une demande
- `notify_on_update` — envoyer un email à la confirmation/modification d'un RDV

Le master switch `notifications_enabled` reste prioritaire : si désactivé,
aucun email n'est envoyé, quels que soient les deux flags.

Si la migration n'est pas exécutée, le code applique le fallback
`notify_on_create = true` et `notify_on_update = true` (comportement
actuel préservé).

```sql
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS notify_on_create BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notify_on_update BOOLEAN DEFAULT TRUE;
```
