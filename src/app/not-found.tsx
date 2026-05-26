import { ErrorFallback } from "@/components/error-fallback";

export default function NotFound() {
  return (
    <ErrorFallback
      title="Page introuvable"
      message="La page que vous cherchez n'existe pas ou a été déplacée. Pour toute question, contactez-nous :"
      action={{ kind: "home", href: "/" }}
    />
  );
}
