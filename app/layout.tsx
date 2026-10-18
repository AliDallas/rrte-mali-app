import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import PresenceBeat from "@/components/PresenceBeat";

export const metadata: Metadata = {
  title: "RRTE MALI APP",
  description: "Réunir Rester Travailler Ensemble - Plateforme communautaire",
};

export const viewport: Viewport = {
  themeColor: "#26292D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Playfair+Display:wght@600;700&display=swap"
        />
      </head>
      <body>
        <AuthProvider>
          <PresenceBeat />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
