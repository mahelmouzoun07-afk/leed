import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Shell } from "@/components/Shell";
import { Footer } from "@/components/Footer";
import { BRAND } from "@/components/data";

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

export const metadata: Metadata = {
  title: `${BRAND} — 24/7 AI agent that finds clients while you sleep`,
  description:
    "Enter your domain and let AI find ideal customers, write personalized emails, and handle follow-ups.",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = { themeColor: "#f6f5f3", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full`}>
      <body className="h-full">
        <Shell footer={<Footer />}>{children}</Shell>
      </body>
    </html>
  );
}
