import { redirect } from "next/navigation";
import { readFile } from "fs/promises";
import path from "path";
import { createClient } from "@/lib/supabase/server";
import { CguModalClient } from "@/components/cgu-modal-client";

export const dynamic = "force-dynamic";

const CURRENT_CGU_VERSION = "v1.0";

export default async function CguRequiredPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  const params = await searchParams;
  const nextPath = params.next ?? "/dashboard";

  const { data: existing } = await supabase
    .from("user_consents")
    .select("id")
    .eq("user_id", user.id)
    .eq("cgu_version", CURRENT_CGU_VERSION)
    .maybeSingle();

  if (existing) {
    redirect(nextPath);
  }

  const cguPath = path.join(process.cwd(), "src/content/cgu-v1.md");
  const cguContent = await readFile(cguPath, "utf-8");

  return <CguModalClient cguMarkdown={cguContent} nextPath={nextPath} />;
}
