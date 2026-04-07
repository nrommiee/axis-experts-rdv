import xmlrpc from "xmlrpc";

const url = process.env.ODOO_URL!;
const db = process.env.ODOO_DB!;
const user = process.env.ODOO_USER!;
const apiKey = process.env.ODOO_API_KEY!;

function createSecureClient(path: string) {
  const parsed = new URL(url);
  return xmlrpc.createSecureClient({
    host: parsed.hostname,
    port: 443,
    path,
  });
}

function callXmlRpc(client: xmlrpc.Client, method: string, params: unknown[]): Promise<unknown> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client.methodCall(method, params as any, (err: any, value: any) => {
      if (err) reject(err);
      else resolve(value);
    });
  });
}

let uidCache: number | null = null;

async function authenticate(): Promise<number> {
  if (uidCache) return uidCache;
  const common = createSecureClient("/xmlrpc/2/common");
  const uid = await callXmlRpc(common, "authenticate", [db, user, apiKey, {}]);
  uidCache = uid as number;
  return uidCache;
}

export async function odooExecute(
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown> = {}
): Promise<unknown> {
  const uid = await authenticate();
  const object = createSecureClient("/xmlrpc/2/object");
  return callXmlRpc(object, "execute_kw", [db, uid, apiKey, model, method, args, kwargs]);
}

export async function odooCreate(model: string, values: Record<string, unknown>): Promise<number> {
  // Odoo create expects args = [values_dict] for single record
  // Returns an integer ID (or array of IDs if passed a list)
  const result = await odooExecute(model, "create", [values]);
  if (Array.isArray(result)) return result[0] as number;
  return result as number;
}

export async function odooSearch(
  model: string,
  domain: unknown[],
  fields: string[] = [],
  limit = 0
): Promise<Record<string, unknown>[]> {
  const result = await odooExecute(model, "search_read", [domain], { fields, limit });
  return result as Record<string, unknown>[];
}

// Client → template mapping
export interface TemplateMapping {
  [typeBien: string]: { entree: number; sortie: number };
}

export const CLIENT_TEMPLATES: Record<string, TemplateMapping> = {
  CPASBXL: {
    studio:   { entree: 165, sortie: 172 },
    app1:     { entree: 166, sortie: 166 }, // no specific sortie for app1 CPASBXL
    app2:     { entree: 167, sortie: 174 },
    app3:     { entree: 168, sortie: 175 },
    app4:     { entree: 169, sortie: 176 },
    app5:     { entree: 170, sortie: 177 },
    bureau:   { entree: 171, sortie: 178 },
    communs:  { entree: 181, sortie: 180 },
  },
  AXIS: {
    app1:   { entree: 143, sortie: 159 },
    app2:   { entree: 144, sortie: 160 },
    app3:   { entree: 145, sortie: 161 },
    app4:   { entree: 146, sortie: 162 },
    app5:   { entree: 147, sortie: 163 },
    studio: { entree: 148, sortie: 164 },
  },
};

export function getTemplateId(
  clientPrefix: string,
  typeBien: string,
  typeMission: "entree" | "sortie"
): number | null {
  const templates = CLIENT_TEMPLATES[clientPrefix];
  if (!templates) return null;
  const mapping = templates[typeBien];
  if (!mapping) return null;
  return mapping[typeMission];
}
