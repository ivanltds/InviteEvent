import type { Metadata } from 'next';
import CelebraeLanding from '@/components/landing/celebrae/CelebraeLanding';
import LegalFooter from '@/components/ui/LegalFooter';
import LandingChatWidget from '@/components/landing/LandingChatWidget';

export const metadata: Metadata = {
  title: 'Celebraê · Convite de casamento digital',
  description:
    'Convite de casamento digital com abertura animada, site do casal, confirmação de presença nome a nome, presentes pelo Pix e mural de fotos ao vivo. Grátis para começar.',
  openGraph: {
    title: 'Celebraê · Convite de casamento digital',
    description: 'Escrevam os nomes de vocês e vejam o convite pronto, do jeito que os convidados vão abrir.',
    type: 'website',
  },
};

export default function LandingPage() {
  return (
    <>
      <CelebraeLanding />
      <LegalFooter theme="dark" />
      <LandingChatWidget />
    </>
  );
}
