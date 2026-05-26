"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/error-fallback";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorFallback
      title="Service temporairement indisponible"
      message="Notre portail de prise de rendez-vous rencontre une difficulté technique. Pour planifier ou modifier un état des lieux, contactez-nous directement :"
      action={{ kind: "reset", onClick: reset }}
    />
  );
}
