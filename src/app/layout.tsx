import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Axis Experts - Portail de demande de RDV",
  description: "Demandez un rendez-vous pour un état des lieux avec Axis Experts",
  icons: {
    icon: "https://axis-experts.be/wp-content/uploads/2022/11/cropped-Axis-favicon-32x32.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
