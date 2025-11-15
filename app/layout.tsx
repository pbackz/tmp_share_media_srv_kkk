import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Partage Temporaire de Médias",
  description: "Partagez vos fichiers avec des liens temporaires sécurisés",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
