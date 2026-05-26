import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: "degraded",
          timestamp: new Date().toISOString(),
          error: "database_unreachable",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { status: "ok", timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        timestamp: new Date().toISOString(),
        error: "database_unreachable",
      },
      { status: 503 }
    );
  }
}
