import { NextResponse, type NextRequest } from "next/server";
import { odooSearch } from "@/lib/odoo";
import { checkRateLimit, extractClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Route PUBLIQUE (sans login) — grille tarifaire des prestations Axis.
// Lit Odoo et renvoie un JSON propre référence -> prix HTVA. Unique source de
// vérité = Odoo. Protégée par rate-limit IP + cache HTTP pour soulager Odoo.
// N'expose que les articles dont le default_code commence par "AXIS_".

interface OdooProduct {
  default_code: string | false;
  name: string | false;
  list_price: number;
}

export interface PublicPriceEntry {
  name: string;
  htva: number;
}

export interface PublicPricesResponse {
  currency: "EUR";
  prices: Record<string, PublicPriceEntry>;
}

export async function GET(request: NextRequest) {
  try {
    // Rate-limit par IP (pas de session côté public). checkRateLimit écrit
    // dans request_log via service_role (déjà utilisé par les routes publiques
    // /api/auth/*). Protège Odoo contre le scraping.
    const ipAddress = extractClientIp(request);
    const rl = await checkRateLimit({
      ipAddress,
      endpoint: "public_prices",
      limit: 30,
      windowMinutes: 5,
    });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Trop de requêtes, veuillez réessayer dans quelques minutes." },
        { status: 429 }
      );
    }

    // Grille tarifaire : tous les articles AXIS_ (biens AXIS_ELLE_*/AXIS_ELLS_*
    // ET suppléments AXIS_OPT_*). "=like" + "AXIS_%" = "commence par AXIS_".
    const rows = (await odooSearch(
      "product.template",
      [
        ["default_code", "=like", "AXIS_%"],
        ["active", "=", true],
      ],
      ["default_code", "name", "list_price"],
      300
    )) as unknown as OdooProduct[];

    const prices: Record<string, PublicPriceEntry> = {};
    for (const row of rows) {
      if (typeof row.default_code !== "string" || !row.default_code) continue;
      prices[row.default_code] = {
        name: typeof row.name === "string" ? row.name : "",
        htva: Number(row.list_price) || 0,
      };
    }

    const body: PublicPricesResponse = { currency: "EUR", prices };

    return NextResponse.json(body, {
      headers: {
        // Cache 1h (comme /api/agency/price-catalog) pour limiter les appels Odoo.
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("GET /api/public/prices error:", err);
    return NextResponse.json(
      { error: "Erreur lors du chargement de la grille tarifaire." },
      { status: 500 }
    );
  }
}
