import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Axis Experts - Portail de demande de RDV",
  description: "Demandez un rendez-vous pour un état des lieux avec Axis Experts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
