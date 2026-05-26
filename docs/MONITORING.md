# Monitoring du portail Axis Experts

## Objectif

Surveiller en continu la disponibilité du portail de prise de rendez-vous
(`axis-experts-rdv`) afin de détecter rapidement toute panne (Vercel,
Supabase, code applicatif) et d'alerter l'équipe par email.

## Service recommandé : UptimeRobot

[UptimeRobot](https://uptimerobot.com) est gratuit jusqu'à 50 monitors avec
une fréquence minimale de 5 minutes, ce qui couvre largement nos besoins.

## Endpoint de health-check

Le portail expose un endpoint public, non authentifié :

```
GET https://<URL_PORTAIL>/api/health
```

Réponses possibles :

- **200 OK** — `{ "status": "ok", "timestamp": "..." }` : Supabase répond,
  le portail est opérationnel.
- **503 Service Unavailable** — `{ "status": "degraded", "timestamp": "...",
  "error": "database_unreachable" }` : Supabase ne répond pas (ou la
  fonction sans serveur a planté).

## Configuration recommandée du monitor

| Champ                     | Valeur                                                          |
| ------------------------- | --------------------------------------------------------------- |
| **Monitor type**          | HTTP(s)                                                         |
| **URL**                   | `https://<URL_PORTAIL>/api/health`                              |
| **Friendly name**         | Axis Experts — Portail RDV (health)                             |
| **Monitoring interval**   | 5 minutes                                                       |
| **Alert contacts**        | `info@axis-experts.be`                                          |
| **Conditions d'alerte**   | Status code ≠ 200 OU réponse ne contient pas le mot-clé `ok`    |
| **Keyword monitoring**    | Activer « Keyword exists » avec le mot-clé `ok`                 |

## Procédure de réponse incident

Quand une alerte UptimeRobot tombe, suivre cette séquence :

1. **Vérifier le statut Vercel** —
   https://www.vercel-status.com. Si Vercel signale une panne globale,
   patienter et communiquer interne (rien à faire côté code).
2. **Vérifier le statut Supabase** —
   https://status.supabase.com. Si Supabase est en panne, le `/api/health`
   restera en 503 jusqu'au rétablissement.
3. **Si les deux services sont up**, ouvrir les logs de la dernière fenêtre
   de 15 min sur Vercel (Project → Logs) pour identifier l'erreur. Si
   nécessaire, contacter le support Vercel/Supabase ou redéployer le dernier
   commit `main` stable.

Pendant l'incident, les utilisateurs verront automatiquement la page de
secours brandée (`src/app/error.tsx`, `src/app/global-error.tsx`) avec les
coordonnées de contact d'Axis Experts.

## À faire par Nicolas après merge

1. Créer un compte gratuit sur https://uptimerobot.com.
2. Ajouter un monitor avec la configuration ci-dessus en remplaçant
   `<URL_PORTAIL>` par l'URL de production Vercel.
3. Valider l'adresse `info@axis-experts.be` comme contact d'alerte.
4. Tester en provoquant un faux échec (par exemple en pointant le monitor
   sur `/api/url-inexistante` pendant 5 minutes) pour confirmer la
   réception de l'email d'alerte.
