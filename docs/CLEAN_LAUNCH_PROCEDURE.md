# Procédure clean-launch axis-experts-rdv

Réf : V2.5 — Item 4. Référence de bascule du portail Axis Experts en
production. À relire en intégralité avant chaque relance d'environnement
ou en prévision d'un déploiement officiel.

---

## 1. Avant le lancement officiel

### 1.1 Purge des comptes de démo

La purge initiale a été effectuée en SQL ad-hoc le **2026-05-20**. Sept
comptes de démo ont été retirés, ne laissant que deux comptes actifs :

- `n.rommiee@axis-experts.be` (admin)
- `nrommiee@icloud.com` (compte test)

Pour rejouer la procédure (relance ou nouvel environnement), exécuter
le bloc SQL ci-dessous dans le SQL editor Supabase, en tant que
`service_role`. **Ajuster la liste `keep_emails`** en fonction des comptes
à préserver.

```sql
-- ⚠️  Adapter la liste des emails à conserver.
WITH keep AS (
  SELECT id
  FROM auth.users
  WHERE lower(email) IN (
    'n.rommiee@axis-experts.be',
    'nrommiee@icloud.com'
  )
),
to_remove AS (
  SELECT id, email
  FROM auth.users
  WHERE id NOT IN (SELECT id FROM keep)
)
SELECT id, email FROM to_remove;
-- Vérifier la liste ci-dessus AVANT d'exécuter le bloc suivant.

-- Brouillons & valeurs de champs custom liés aux users à supprimer.
DELETE FROM rdv_drafts
WHERE user_id IN (SELECT id FROM auth.users
  WHERE id NOT IN (SELECT id FROM (
    SELECT id FROM auth.users
    WHERE lower(email) IN ('n.rommiee@axis-experts.be','nrommiee@icloud.com')
  ) k));

-- Invitations émises pour ces emails.
DELETE FROM invitations
WHERE lower(email) NOT IN ('n.rommiee@axis-experts.be','nrommiee@icloud.com');

-- portal_clients (cascade soft → hard pour la purge initiale).
DELETE FROM portal_clients
WHERE user_id NOT IN (
  SELECT id FROM auth.users
  WHERE lower(email) IN ('n.rommiee@axis-experts.be','nrommiee@icloud.com')
);

-- Auth users.
DELETE FROM auth.users
WHERE lower(email) NOT IN ('n.rommiee@axis-experts.be','nrommiee@icloud.com');
```

⚠️ Ne **jamais** toucher aux tables `portal_submissions` ni
`rdv_notifications_sent` (historique des demandes RDV — règle V2.5).

### 1.2 Vérification Supabase Dashboard

- **Authentication → URL Configuration → Redirect URLs** :
  - `https://rdv.axis-experts.be/auth/callback` (prod)
  - `https://rdv.axis-experts.be/reset-password` (legacy — peut être
    retiré une fois la migration callback validée)
  - URL preview Vercel équivalente (ex. `https://*.vercel.app/auth/callback`)
    si autorisée par la conf wildcard.
- **Authentication → Email Templates** : templates personnalisés Axis
  Experts (en français) vérifiés — sujet, expéditeur, bandeau, lien
  d'action.
- **Database → Backups** : snapshot manuel **pré-launch** effectué (PITR
  ou backup logique exporté hors Supabase).

### 1.3 Vérification Vercel

Variables d'environnement **prod** présentes :

| Variable                         | Notes                                                              |
|----------------------------------|--------------------------------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`       | URL projet Supabase prod                                           |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Clé anon                                                           |
| `SUPABASE_SERVICE_ROLE_KEY`      | Service role (secret)                                              |
| `ADMIN_EMAILS`                   | Comma-separated, lowercase. Source de vérité unique pour l'admin.  |
| `RESEND_API_KEY`                 | Clé API Resend                                                     |
| `ODOO_URL`, `ODOO_DB`, `ODOO_USER`, `ODOO_API_KEY` | Accès Odoo                                       |
| `CRON_SECRET`                    | Bearer pour `/api/cron/*`                                          |
| `NEXT_PUBLIC_SITE_URL`           | URL prod (utilisée par les emails Resend / liens client)           |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`| Autocomplete adresses BE                                           |

À **retirer** depuis V2.5 :

- `NEXT_PUBLIC_ADMIN_EMAIL` — plus utilisée (Item 1 V2.5). La source de
  vérité admin est server-side via `ADMIN_EMAILS` + middleware.

### 1.4 Vérification Resend

- DKIM `axis-experts.be` actif et vérifié dans Resend.
- DMARC policy en `quarantine` minimum.
- Quotas connus : 3000 emails/jour sur le plan free Resend, plus selon
  l'offre souscrite. Vérifier le plan actif et la marge avant le pic
  de lancement (envoi de N invitations dans la même journée).

### 1.5 Test de bout en bout (smoke test pré-launch)

1. Créer une invitation pour un email réel d'un client beta depuis
   `/admin/organizations/[id]`.
2. Cliquer le lien d'invitation, créer le compte, login.
3. Soumettre une demande RDV avec documents.
4. Vérifier l'arrivée dans Odoo (commande créée, agence et partenaire
   corrects, pièces jointes attachées).
5. Test « mot de passe oublié » **cross-device** :
   - Demander la réinit depuis le navigateur A.
   - Cliquer sur le lien email depuis le navigateur B (ou un autre
     device).
   - Vérifier l'arrivée sur `/reset-password` sans
     « Auth session missing » (Item 2 V2.5).
6. Test soft-delete + ré-invitation (cf. V2_TEST_RESULTS Item 2).

---

## 2. Procédure de rollback si problème post-launch

1. Identifier le commit fautif (`git log`, Sentry, bug report).
2. `git revert <commit>` → nouveau PR de revert.
3. Squash and merge → Vercel redéploie automatiquement l'état précédent.
4. **Urgence** : Vercel Dashboard → Deployments → « Promote to
   Production » sur le déploiement sain immédiatement précédent. Cela
   n'inverse pas les migrations SQL mais restaure l'app.
5. Pour les régressions DB : restaurer le snapshot Supabase pris en 1.2
   (avec coordination de toute l'équipe — perte de données entre
   snapshot et restore).

---

## 3. Procédure de blocage / nettoyage d'urgence

- **Suspendre une organisation** : `/admin/organizations/[id]` →
  toggle `is_active = false`. Le trigger
  `trigger_cascade_org_deactivation` bloque tous les users actifs de
  l'org (cf. `docs/ADMIN_USERS.md`).
- **Bloquer un user** : `/admin/users` → action Bloquer.
- **Révoquer un admin compromis** : retirer son email de la variable
  `ADMIN_EMAILS` sur Vercel, redéployer (ou redémarrer l'instance).
  Le check est exclusivement server-side (V2.5 Item 1), donc immédiat
  après redéploiement.
- **Couper l'envoi d'emails** : retirer `RESEND_API_KEY` sur Vercel.
  L'init lazy (V2 Item 0) fait que toute route qui essaie d'envoyer
  un email échouera proprement avec `RESEND_API_KEY is not set`.

---

## 4. Références

- Audit V2.5 source : `/docs/ADMIN_MODULE_AUDIT_2026-05-20.md`.
- Résultats de tests V2.5 : `/docs/V2_5_TEST_RESULTS.md`.
- Gestion users / invitations : `/docs/ADMIN_USERS.md`.
- Vague 2 résultats : `/docs/V2_TEST_RESULTS.md`.
