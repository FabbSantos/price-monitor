import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monitor de Preços - Black Friday 2025",
  description: "Monitore preços de TVs TCL na Black Friday",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
