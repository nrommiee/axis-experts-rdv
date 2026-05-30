// Client Microsoft Graph en mode APPLICATION (app-only / client credentials).
// fetch natif (zéro dépendance). Permission applicative : Calendars.ReadWrite,
// bornée par une Application Access Policy côté Entra (boîtes autorisées).
//
// Vars d'env (Vercel) : MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET.

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
export const RDV_TIMEZONE = "Europe/Brussels";

// ── Token (cache mémoire, marge de 60 s avant expiration) ──
let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getGraphToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt - 60_000 > now) {
    return cachedToken.value;
  }

  const tenant = process.env.MS_TENANT_ID;
  const clientId = process.env.MS_CLIENT_ID;
  const clientSecret = process.env.MS_CLIENT_SECRET;
  if (!tenant || !clientId || !clientSecret) {
    throw new Error("MS_TENANT_ID / MS_CLIENT_ID / MS_CLIENT_SECRET manquant(s).");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
    scope: "https://graph.microsoft.com/.default",
  });

  const res = await fetch(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    }
  );

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Graph token error ${res.status}: ${txt.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedToken = {
    value: json.access_token,
    expiresAt: now + (json.expires_in ?? 3600) * 1000,
  };
  return cachedToken.value;
}

// ── Types d'événement ──
export interface GraphEventInput {
  subject: string;
  bodyHtml: string;
  start: string; // "YYYY-MM-DDTHH:MM:SS" (heure locale Europe/Brussels)
  end: string; // idem
  location?: string;
}

export type GraphResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

function buildEventPayload(ev: GraphEventInput): Record<string, unknown> {
  return {
    subject: ev.subject,
    body: { contentType: "HTML", content: ev.bodyHtml },
    start: { dateTime: ev.start, timeZone: RDV_TIMEZONE },
    end: { dateTime: ev.end, timeZone: RDV_TIMEZONE },
    ...(ev.location ? { location: { displayName: ev.location } } : {}),
  };
}

async function graphFetch(
  token: string,
  method: "GET" | "POST" | "PATCH",
  path: string,
  payload?: Record<string, unknown>
): Promise<GraphResult<Record<string, unknown>>> {
  try {
    const res = await fetch(`${GRAPH_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(payload ? { "Content-Type": "application/json" } : {}),
      },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
    if (res.ok) {
      // PATCH/GET/POST renvoient l'événement ; tolère une 204 sans corps.
      const data =
        res.status === 204
          ? {}
          : ((await res.json().catch(() => ({}))) as Record<string, unknown>);
      return { ok: true, data };
    }
    const txt = await res.text().catch(() => "");
    return { ok: false, status: res.status, error: txt.slice(0, 300) };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

// Crée un événement dans l'agenda de {email} -> renvoie l'id Graph.
export async function createEvent(
  email: string,
  ev: GraphEventInput
): Promise<GraphResult<{ id: string }>> {
  const token = await getGraphToken();
  const r = await graphFetch(
    token,
    "POST",
    `/users/${encodeURIComponent(email)}/events`,
    buildEventPayload(ev)
  );
  if (!r.ok) return r;
  const id = typeof r.data.id === "string" ? r.data.id : "";
  if (!id) return { ok: false, status: 0, error: "Graph: id manquant" };
  return { ok: true, data: { id } };
}

// Met à jour un événement existant.
export async function updateEvent(
  email: string,
  eventId: string,
  ev: GraphEventInput
): Promise<GraphResult<{ id: string }>> {
  const token = await getGraphToken();
  const r = await graphFetch(
    token,
    "PATCH",
    `/users/${encodeURIComponent(email)}/events/${encodeURIComponent(eventId)}`,
    buildEventPayload(ev)
  );
  if (!r.ok) return r;
  return { ok: true, data: { id: eventId } };
}

// Vérifie l'existence d'un événement (404 = supprimé manuellement).
export async function getEvent(
  email: string,
  eventId: string
): Promise<GraphResult<{ id: string }>> {
  const token = await getGraphToken();
  const r = await graphFetch(
    token,
    "GET",
    `/users/${encodeURIComponent(email)}/events/${encodeURIComponent(eventId)}`
  );
  if (!r.ok) return r;
  return { ok: true, data: { id: eventId } };
}
