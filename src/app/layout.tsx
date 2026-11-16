import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/components/data";

// Texte : Geist, la police du format d'origine (les espacements sont réglés pour elle).
const GeistSans = localFont({
  src: "../fonts/Geist-Variable.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});
const GeistMono = localFont({
  src: "../fonts/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});
// Titres : Bricolage Grotesque, police variable à forte personnalité (voir docs/DESIGN.md).
const Bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${BRAND} — Trouvez vos clients pendant que vous dormez`,
  description:
    "Leed étudie votre marché, écrit à vos futurs clients depuis vos propres comptes (WhatsApp, Instagram, Facebook, LinkedIn, email) et vous amène des rendez-vous.",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${GeistSans.variable} ${GeistMono.variable} ${Bricolage.variable} h-full`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
