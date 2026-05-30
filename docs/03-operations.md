# 03 — Opérations (guide métier pas-à-pas)

Ce guide s'adresse aux **experts** et aux **administrateurs** d'Axis Experts. Il
décrit les gestes quotidiens dans **Odoo** et, le cas échéant, dans **Microsoft
365 / PowerShell**. Aucune intervention sur le code n'est nécessaire pour ces
opérations.

---

## A. Traiter une nouvelle demande confirmée

1. Le client a rempli `/prendre-rdv` puis cliqué sur le lien de confirmation
   reçu par email.
2. Un **devis Odoo (brouillon)** apparaît automatiquement avec :
   - le **contact** (dédoublonné),
   - l'**adresse de mission**,
   - les **parties** (bailleur / locataire) si renseignées,
   - les **pièces jointes** (trombone),
   - le statut `x_studio_suivi_expert = "Demande reçue"`.
3. **Complétez** ce qui n'est pas automatisé, notamment le **type de bien**
   (`x_studio_type_de_bien_1`, laissé vide volontairement) et l'affectation de
   l'**expert** (`x_studio_expert_externe_`).

> Le devis reste **en brouillon** : le moteur ne le confirme jamais
> (`action_confirm`).

---

## B. Proposer une date au client

1. Dans le devis Odoo, renseignez **`x_studio_date_prochain_rendez_vous_1`**.
   Format recommandé (nominal) :
   ```
   DD/MM/YYYY de (HH:MM:SS à HH:MM:SS) (Europe/Brussels)
   ```
   Les formats `DD/MM/YYYY de (HH:MM à HH:MM) ...` et `DD/MM/YYYY` seul sont
   également acceptés. **La date en tête `DD/MM/YYYY` est obligatoire**, sinon le
   cron ignore le devis.
2. Passez **`x_studio_suivi_expert`** à **« RDV proposé »**.
3. Dans les **15 minutes** (cron `validation-cron`), le système envoie à chaque
   partie **« doit valider »** un email contenant un **lien de validation**.
   - Une fois les liens partis, `x_studio_proposition_envoye` passe à `true`
     (anti-renvoi). **Ne le décochez pas** sauf si vous voulez délibérément
     renvoyer les liens.

> Pour **forcer un renvoi** des liens : décochez `x_studio_proposition_envoye`
> (le prochain passage du cron renverra les liens aux parties concernées).

---

## C. Validation des parties

Deux chemins équivalents, **la case Odoo faisant toujours foi** :

- **La partie clique son lien** (`/confirmer/partie/<token>`) → sa case
  `x_studio_partie_N_*_confirm` est cochée + `_confirm_le_1` horodaté.
- **L'expert coche manuellement** la case dans Odoo (voir section D).

Quand **toutes les parties requises** ont leur case cochée, le cron bascule
automatiquement le devis en **« RDV confirmé »** et envoie :

- un email de confirmation **à chaque partie** (ayant un email, sauf « Ne plus
  notifier ») ;
- une **copie à `info@axis-experts.be`**.

> Rappel des rôles (`res.partner.x_studio_rle_notification_rdv`) :
> **« Doit valider »** ou **vide** = requise ; **« Informé seulement »** = juste
> informée ; **« Ne plus notifier »** = ignorée. Voir
> [`02-cycle-de-vie.md`](./02-cycle-de-vie.md#rescpartner-contact).

---

## D. Confirmer une partie **sans email**

Cas d'une partie dont le contact Odoo n'a **pas d'email** (le cron la signale via
le compteur `skippedNoEmail` et n'envoie rien) :

1. Ouvrez le devis dans Odoo.
2. **Cochez manuellement** la case de cette partie :
   `x_studio_partie_1_bailleurs_confirm` ou
   `x_studio_partie_2_locataires_confirm`.
3. Au prochain passage du cron de validation, dès que **toutes** les parties
   requises sont cochées, la bascule « RDV confirmé » se fait automatiquement.

> Vous pouvez aussi cocher manuellement une partie qui a un email mais ne
> répond pas : **la case fait foi**, peu importe comment elle a été cochée.

---

## E. Ajouter un expert *(module Outlook)*

Pour qu'un expert voie les RDV se créer dans **son** agenda Outlook, trois
conditions — **aucune modification de code** :

1. **Compte M365** : l'expert dispose d'un compte Microsoft 365 avec un agenda
   Outlook.
2. **Email dans Odoo** : sa fiche `res.partner` (celle référencée par
   `x_studio_expert_externe_` sur les devis) porte **son email M365**.
3. **Appartenance au groupe de portée** : ajoutez l'expert au groupe de sécurité
   **`AxisRDVOutlookScope`** (groupe *mail-enabled security*), qui autorise
   l'application à écrire dans son agenda, via PowerShell :

   ```powershell
   Add-DistributionGroupMember -Identity "AxisRDVOutlookScope" -Member "prenom.nom@axis-experts.be"
   ```

> Pourquoi un groupe ? L'application Microsoft Graph est volontairement **limitée
> par une Application Access Policy** (`RestrictAccess`) au seul groupe
> `AxisRDVOutlookScope`. Sans appartenance au groupe, l'app ne peut pas écrire
> dans l'agenda de l'expert (sécurité : pas d'accès à toute l'organisation).
> Voir [`05-configuration.md`](./05-configuration.md#microsoft-azure--graph-module-outlook).

---

## F. Gérer l'événement Outlook *(module Outlook)*

Le module Outlook (branche `claude/outlook-sync`, **non encore mergé**)
maintient un **miroir** du cycle de vie du RDV dans l'agenda de l'expert via
**Microsoft Graph (app-only)** :

| Statut du devis | Action dans l'agenda Outlook |
|---|---|
| **Demande reçue** | Crée un événement **« ⚠️ RDV à planifier »** sur un **créneau repère** (prochain jour ouvré, 9h–10h). |
| **RDV proposé** | **Déplace** l'événement sur le **vrai créneau** (date proposée). |
| **RDV confirmé** | Change le **titre** en **« ✓ RDV confirmé »**. |

**Respect de la suppression manuelle** : si l'expert supprime l'événement dans
Outlook, Graph renvoie `404` lors de la prochaine synchro → `sync_state =
manually_deleted` dans `outlook_calendar_sync`, et le module **ne recrée pas**
l'événement.

Diagnostic rapide via la table `outlook_calendar_sync` :

- `sync_state = active` : synchro nominale.
- `sync_state = manually_deleted` : supprimé manuellement, non recréé (normal).
- `sync_state = error` + `last_error` : voir [`06-depannage.md`](./06-depannage.md).

> **État actuel du module** : configuration validée
> (`Test-ApplicationAccessPolicy = Granted`), mais la **propagation de la policy
> Microsoft peut prendre jusqu'à 24 h**. Tant qu'elle n'est pas propagée, les
> tests renvoient encore `ErrorAccessDenied` — **ce n'est pas un bug**.
</content>
