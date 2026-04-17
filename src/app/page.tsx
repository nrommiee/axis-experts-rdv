import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export default async function Home() {
  // Short-circuit the /dashboard hop for already-authenticated admins.
  // The proxy still enforces this for any other entry point.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user && isAdmin(user.email)) {
    redirect("/admin");
  }
  redirect("/dashboard");
}
