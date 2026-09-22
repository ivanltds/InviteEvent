import type { Metadata } from "next";
import { Playfair_Display, Pinyon_Script, Inter } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import DynamicStyles from "@/components/ui/DynamicStyles";
import CookieBanner from "@/components/ui/CookieBanner";
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

// Correção de 20/09/2026: o título/descrição aqui eram de um casal
// específico de dados de demonstração, hardcoded como padrão do app
// inteiro (aba do navegador mostrava "Layslla & Marcus" em qualquer
// página, inclusive admin). Esse título genérico agora é só o FALLBACK:
// `/inv/[slug]/page.tsx` e `/inv/evento/[eventoSlug]/page.tsx` viraram
// Server Components finos que exportam seu próprio `generateMetadata`
// por casal (ver src/lib/metadata/inviteMetadata.ts), então o link de
// cada convite mostra um cartão de preview (WhatsApp etc.) com o nome do
// casal e a foto, em vez deste texto genérico do app.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://invite-event-beryl.vercel.app'),
  title: "Celebraê",
  description: "Convites de casamento digitais, RSVP e lista de presentes inteligente.",
  other: {
    lomadee: "2324685",
  },
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
        {children}
        <CookieBanner />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  );
}
