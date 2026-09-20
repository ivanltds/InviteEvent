import type { Metadata } from 'next';
import InvitationPageClient from './InvitationPageClient';
import { buildInviteMetadataBySlug } from '@/lib/metadata/inviteMetadata';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Correção de 20/09/2026: card de preview do WhatsApp/redes sociais por
 * convite (nome do casal + data + foto), em vez do card genérico do app.
 * Ver src/lib/metadata/inviteMetadata.ts.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return buildInviteMetadataBySlug(slug);
}

export default async function InvitationPage({ params }: PageProps) {
  const { slug } = await params;
  return <InvitationPageClient slug={slug} />;
}
