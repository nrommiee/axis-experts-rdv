# 06 — Dépannage

Catalogue des pièges rencontrés, présentés sous la forme **symptôme → cause →
solution**. Pour les notions sous-jacentes, voir
[`04-automatismes-crons.md`](./04-automatismes-crons.md) et
[`05-configuration.md`](./05-configuration.md).

---

## Emails / liens

### Les liens dans les emails pointent vers `*.vercel.app`

- **Symptôme** : les emails de confirmation / validation contiennent une URL
  `xxx.vercel.app` au lieu de `rdv.axis-experts.be`.
- **Cause** : `NEXT_PUBLIC_SITE_URL` n'est pas définie → le code retombe sur
  l'origin de la requête (le domaine Vercel).
- **Solution** : définir **`NEXT_PUBLIC_SITE_URL=https://rdv.axis-experts.be`**
  dans Vercel, puis **redéployer**.

### Un email n'est pas parti

- **Cause possible** : `RESEND_API_KEY` absente/incorrecte, ou domaine
  destinataire dans la blocklist de production (`example.com`, `example.org`,
  `axis-experts.test`).
- **Effet par conception** : un échec d'email **ne casse jamais** le flux (la
  demande reste enregistrée/confirmée). L'échec est **loggué**
  (`emailFailures`, logs `[email] failed to send`). Renvoyer manuellement si
  besoin.

---

## Crons

### Cron renvoie `401`

- **Symptôme** : `{ "error": "Unauthorized" }` (HTTP 401).
- **Cause** : `CRON_SECRET` manquant/incorrect, ou en-tête `Authorization: Bearer
  <secret>` absent.
- **Solution** : vérifier la variable **`CRON_SECRET`** sur Vercel et l'en-tête
  Bearer. En **preview** seulement, on peut utiliser le bypass `?test=1`
  (inopérant en production — voir
  [`04-automatismes-crons.md`](./04-automatismes-crons.md#sécurité-des-crons)).

### Les liens de validation ne partent pas / repartent en boucle

- **Ne partent pas** : vérifier que le devis est bien en **« RDV proposé »**, que
  `x_studio_date_prochain_rendez_vous_1` commence par une date `DD/MM/YYYY`
  valide, et que les contacts des parties ont un **email** et un **rôle** ≠ « Ne
  plus notifier ».
- **Repartent à chaque passage** : `x_studio_proposition_envoye` n'est pas resté
  à `true` (a été décoché). Pour un **renvoi volontaire**, c'est justement le
  geste à faire ; sinon, laisser le booléen à `true`.

### La bascule « RDV confirmé » ne se produit pas

- **Cause** : une partie **requise** (rôle « Doit valider » ou **vide**) n'a pas
  sa case `*_confirm` cochée. Les rôles « Informé seulement » / « Ne plus
  notifier » ne comptent pas.
- **Solution** : cocher la (les) case(s) manquante(s) dans Odoo (la **case fait
  foi**) ; au prochain passage du cron (≤ 15 min), la bascule se fait.

---

## Microsoft / Outlook *(module Outlook)*

### `MS_* manquant(s)`

- **Cause** : une variable `MS_TENANT_ID` / `MS_CLIENT_ID` / `MS_CLIENT_SECRET`
  est absente **ou** le déploiement est **antérieur** à l'ajout de la variable.
- **Solution** : ajouter/corriger la variable sur Vercel **puis redéployer** (un
  déploiement n'embarque que les variables présentes à son instant de build).

### `AADSTS7000215 — Invalid client secret`

- **Cause** : on a copié le **Secret ID** au lieu de la **Value** du secret lors
  de la création du client secret dans Entra.
- **Solution** : recréer/relire le secret et copier sa **Value** dans
  **`MS_CLIENT_SECRET`**, puis redéployer.

### `ErrorAccessDenied — Blocked by AppOnly AccessPolicy`

- **Cause** : l'**Application Access Policy** est correcte mais sa **propagation**
  côté Microsoft n'est pas terminée (peut prendre **jusqu'à 24 h**).
- **Vérification** : `Test-ApplicationAccessPolicy` doit renvoyer **`Granted`**.
  Si c'est le cas, **ce n'est pas un bug** : patienter le temps de la propagation.
- **Autre cause** : l'expert n'est pas membre du groupe **`AxisRDVOutlookScope`**
  (voir [`03-operations.md`](./03-operations.md#e-ajouter-un-expert-module-outlook)).

---

## Supabase / SQL

### `Success. No rows returned`

- **Symptôme** : message affiché après un `CREATE` / `ALTER` / `UPDATE` /
  `DELETE` dans le SQL Editor.
- **Cause** : **c'est normal** — ces ordres ne renvoient pas de lignes. Le message
  signale une exécution **réussie**, pas une erreur.

### Une route publique « ne voit » pas les données

- **Cause** : tentative d'accès avec une clé `anon`. Les tables publiques sont en
  **RLS `service_role` only** (deny-by-default).
- **Solution** : l'accès se fait **exclusivement** côté serveur via
  `SUPABASE_SERVICE_ROLE_KEY` (`createAdminClient`). Vérifier que la variable est
  présente sur l'environnement concerné.

---

## TODO / points à fiabiliser

Ces points sont **connus** et restent à traiter :

- **Emails des experts dans Odoo** : certains contacts `res.partner` n'ont pas
  d'email → le module Outlook ne sait pas dans quel agenda créer l'événement.
  À fiabiliser (compléter les emails des experts).
- **Purge RGPD automatique** : la suppression des demandes **expirées** (lignes
  `public_rdv_requests` **et** fichiers Storage associés) n'est **pas encore**
  automatisée. À implémenter (cron de purge). En attendant, la conservation des
  pièces jointes des demandes expirées doit être surveillée manuellement.
</content>
