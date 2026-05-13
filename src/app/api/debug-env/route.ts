import { NextResponse } from "next/server";

export async function GET() {
  const secret = process.env.CRON_SECRET;
  return NextResponse.json({
    cron_secret_defined: !!secret,
    cron_secret_length: secret?.length ?? 0,
    cron_secret_first_8: secret?.slice(0, 8) ?? null,
    cron_secret_last_4: secret?.slice(-4) ?? null,
    node_env: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV,
    all_env_keys_count: Object.keys(process.env).length,
    has_cron_secret_key: Object.keys(process.env).includes("CRON_SECRET"),
  });
}
