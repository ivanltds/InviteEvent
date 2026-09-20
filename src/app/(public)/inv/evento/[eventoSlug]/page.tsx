import type { Metadata } from 'next';
import PublicAutoCadastroClient from './PublicAutoCadastroClient';
import { buildInviteMetadataByEventoSlug } from '@/lib/metadata/inviteMetadata';

interface PageProps {
  params: Promise<{ eventoSlug: string }>;
}

/**
 * Correção de 20/09/2026: card de preview do WhatsApp/redes sociais para
 * o link do modo Link Único (nome do casal + data + foto), em vez do
 * card genérico do app. Ver src/lib/metadata/inviteMetadata.ts.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eventoSlug } = await params;
  return buildInviteMetadataByEventoSlug(eventoSlug);
}

export default async function PublicAutoCadastroPage({ params }: PageProps) {
  const { eventoSlug } = await params;
  return <PublicAutoCadastroClient eventoSlug={eventoSlug} />;
}
