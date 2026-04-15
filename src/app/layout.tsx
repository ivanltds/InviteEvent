import type { Metadata } from "next";
import { Playfair_Display, Pinyon_Script, Inter } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import Navbar from "@/components/ui/Navbar";
import DynamicStyles from "@/components/ui/DynamicStyles";
import { Analytics } from "@vercel/analytics/react";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const pinyon = Pinyon_Script({
  variable: "--font-pinyon",
  subsets: ["latin"],
  weight: "400",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Layslla & Marcus | 13.06.2026",
  description: "Nosso grande dia está chegando! Venha celebrar conosco o início do nosso namoro que agora se torna o nosso casamento.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${pinyon.variable} ${inter.variable}`} data-scroll-behavior="smooth">
      <body>
        <Suspense fallback={null}>
          <DynamicStyles />
        </Suspense>
        <Navbar />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  );
}

