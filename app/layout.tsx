import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flash Share - Partage de fichiers temporaire",
  description: "Partage simplement tes fichiers avec des liens qui expirent automatiquement",
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
