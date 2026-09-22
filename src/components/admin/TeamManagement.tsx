'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEvent } from '@/lib/contexts/EventContext';
import { eventService } from '@/lib/services/eventService';
import { EventoOrganizador, EventoConviteEquipe } from '@/lib/types/database';
import styles from './AdminComponents.module.css';

export default function TeamManagement() {
  const { currentEvent, userProfile, userRole, loading: contextLoading } = useEvent();
  const [organizers, setOrganizers] = useState<(EventoOrganizador & { email: string })[]>([]);
  const [invites, setInvites] = useState<EventoConviteEquipe[]>([]);
  
  // Opção 1: Link Mágico
  const [magicRole, setMagicRole] = useState<'owner' | 'organizador'>('owner');
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copied, setCopied] = useState(false);

  // Opção 2: Adição por E-mail
  const [email, setEmail] = useState('');
  const [emailRole, setEmailRole] = useState<'owner' | 'organizador'>('owner');
  const [addingEmail, setAddingEmail] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!currentEvent) return;
    setLoading(true);
    try {
      const [orgs, pendingInvites] = await Promise.all([
        eventService.getOrganizers(currentEvent.id),
        eventService.getTeamInvites(currentEvent.id)
      ]);
      setOrganizers(orgs);
      setInvites(pendingInvites);
    } catch (err: unknown) {
      console.error('[TeamManagement] Erro ao carregar equipe:', err);
    } finally {
      setLoading(false);
    }
  }, [currentEvent]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Opção 1: Gerar Link de Convite Mágico
  const handleGenerateMagicLink = async () => {
    if (!currentEvent) return;
    setGeneratingLink(true);
    setError(null);
    setSuccess(null);
    try {
      const invite = await eventService.createTeamInvite(currentEvent.id, magicRole);
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${origin}/admin/equipe/aceitar?token=${invite.token}`;
      setGeneratedInviteUrl(url);
      setSuccess('Link de convite gerado com sucesso!');
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar link de convite.';
      setError(message);
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyLink = (urlToCopy?: string) => {
    const text = urlToCopy || generatedInviteUrl;
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const getWhatsAppShareUrl = (url?: string) => {
    const targetUrl = url || generatedInviteUrl;
    if (!targetUrl) return '#';
    const isOwner = magicRole === 'owner';
    const roleText = isOwner ? 'proprietário(a) com acesso total' : 'organizador(a)';
    const text = `Oi amor! Criei o painel do nosso casamento no Celebre. Clica neste link para gerenciar o casamento comigo como ${roleText}:\n\n${targetUrl}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  // Opção 2: Adição direta por E-mail
  const handleAddByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent || !email) return;
    setAddingEmail(true);
    setError(null);
    setSuccess(null);

    try {
      await eventService.addOrganizer(currentEvent.id, email, emailRole);
      setEmail('');
      setSuccess(`Membro adicionado como ${emailRole === 'owner' ? 'Proprietário' : 'Organizador'} com sucesso!`);
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao adicionar membro.';
      if (message.includes('não encontrado')) {
        setError(`O e-mail "${email}" ainda não possui cadastro no Celebre. Use o "Link Mágico" acima para enviar o convite pelo WhatsApp!`);
      } else {
        setError(message);
      }
    } finally {
      setAddingEmail(false);
    }
  };

  // Alterar papel (Promover a Owner ou Rebaixar a Organizador)
  const handleUpdateRole = async (userId: string, newRole: 'owner' | 'organizador') => {
    if (!currentEvent) return;
    setError(null);
    setSuccess(null);
    try {
      const ok = await eventService.updateOrganizerRole(currentEvent.id, userId, newRole);
      if (ok) {
        setSuccess(`Papel atualizado para ${newRole === 'owner' ? 'Proprietário' : 'Organizador'}!`);
        await loadData();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao alterar papel.';
      setError(message);
    }
  };

  // Remover membro da equipe
  const handleRemove = async (userId: string) => {
    if (!currentEvent) return;
    if (!confirm('Tem certeza que deseja remover este membro da equipe do evento?')) return;
    
    setError(null);
    try {
      const ok = await eventService.removeOrganizer(currentEvent.id, userId);
      if (ok) {
        setSuccess('Membro removido da equipe.');
        await loadData();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao remover membro.';
      setError(message);
    }
  };

  // Revogar convite pendente
  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm('Deseja cancelar este link de convite?')) return;
    try {
      await eventService.revokeTeamInvite(inviteId);
      await loadData();
    } catch {
      setError('Erro ao cancelar convite.');
    }
  };

  if (!currentEvent) return null;

  const isOwnerOrMaster = userRole === 'owner' || userProfile?.is_master;

  if (contextLoading) {
    return <p>Verificando permissões...</p>;
  }

  if (!isOwnerOrMaster) {
    return <p>Apenas os Proprietários podem gerenciar a equipe do evento.</p>;
  }

  const ownersCount = organizers.filter(o => o.role === 'owner').length;

  return (
    <div className={styles.managerContainer}>
      {/* Alertas globais */}
      {error && (
        <div style={{
          padding: '0.85rem 1.25rem',
          background: '#fff5f5',
          border: '1px solid #feb2b2',
          borderRadius: '8px',
          color: '#c53030',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '0.85rem 1.25rem',
          background: '#f0fff4',
          border: '1px solid #9ae6b4',
          borderRadius: '8px',
          color: '#276749',
          fontSize: '0.9rem'
        }}>
          {success}
        </div>
      )}

      {/* SEÇÃO 1: Link Mágico de Convite (Opção 1) */}
      <div className={styles.faqForm} style={{ borderLeft: '4px solid var(--admin-accent, #d4af37)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.4rem' }}>✨</span>
          <h3 style={{ margin: 0 }}>Opção 1: Link Mágico (WhatsApp / Compartilhável)</h3>
        </div>
        <p className={styles.helpText} style={{ marginTop: 0 }}>
          Gere um link exclusivo para enviar para o seu noivo, noiva ou assessor. Ao clicar, a pessoa se cadastra ou faz login e ganha acesso imediato ao painel!
        </p>

        <div className={styles.inlineRow} style={{ flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
              Nível de Acesso:
            </label>
            <select
              value={magicRole}
              onChange={(e) => setMagicRole(e.target.value as 'owner' | 'organizador')}
              className={styles.input}
              style={{ height: '46px' }}
            >
              <option value="owner">👑 Co-Proprietário(a) (Recomendado para Noivo/Noiva - Acesso Total)</option>
              <option value="organizador">📋 Organizador(a) (Cerimonialista / Assessor)</option>
            </select>
          </div>

          <div style={{ alignSelf: 'flex-end' }}>
            <button
              type="button"
              onClick={handleGenerateMagicLink}
              disabled={generatingLink}
              className={styles.saveBtn}
              style={{ height: '46px', whiteSpace: 'nowrap' }}
            >
              {generatingLink ? 'Gerando...' : '✨ Gerar Link Mágico'}
            </button>
          </div>
        </div>

        {/* Caixa de exibição do link gerado */}
        {generatedInviteUrl && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#ffffff',
            border: '1.5px dashed var(--admin-accent, #d4af37)',
            borderRadius: '10px'
          }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 600, color: '#333' }}>
              Link de Convite Gerado:
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                readOnly
                value={generatedInviteUrl}
                className={styles.input}
                style={{ flex: '1 1 250px', background: '#f8fafc', fontSize: '0.85rem' }}
              />
              <button
                type="button"
                onClick={() => handleCopyLink()}
                className={styles.saveBtn}
                style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}
              >
                {copied ? '✓ Copiado!' : '📋 Copiar'}
              </button>
              <a
                href={getWhatsAppShareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.6rem 1.2rem',
                  background: '#25D366',
                  color: '#ffffff',
                  borderRadius: '50px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)'
                }}
              >
                <span>💬</span> WhatsApp
              </a>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', marginBottom: 0 }}>
              Válido por 7 dias. O convite expira automaticamente após o primeiro uso.
            </p>
          </div>
        )}
      </div>

      {/* SEÇÃO 2: Adicionar diretamente por E-mail (Opção 2) */}
      <form onSubmit={handleAddByEmail} className={styles.faqForm}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.4rem' }}>✉️</span>
          <h3 style={{ margin: 0 }}>Opção 2: Adicionar por E-mail</h3>
        </div>
        <p className={styles.helpText} style={{ marginTop: 0 }}>
          Se a outra pessoa já possui uma conta no Celebre, digite o e-mail dela para conceder o acesso na hora.
        </p>

        <div className={styles.inlineRow}>
          <input
            type="email"
            placeholder="E-mail da pessoa (ex: noivo@exemplo.com)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
          />
          <select
            value={emailRole}
            onChange={(e) => setEmailRole(e.target.value as 'owner' | 'organizador')}
            className={styles.input}
            style={{ width: 'auto', minWidth: '180px' }}
          >
            <option value="owner">👑 Proprietário(a)</option>
            <option value="organizador">📋 Organizador(a)</option>
          </select>
          <button type="submit" className={styles.saveBtn} disabled={addingEmail}>
            {addingEmail ? 'Adicionando...' : 'Adicionar'}
          </button>
        </div>
      </form>

      {/* SEÇÃO 3: Convites Pendentes */}
      {invites.length > 0 && (
        <div className={styles.faqList}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', margin: '0 0 0.5rem 0' }}>
            Convites Pendentes ({invites.length})
          </h3>
          {invites.map((inv) => {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const inviteUrl = `${origin}/admin/equipe/aceitar?token=${inv.token}`;
            return (
              <div key={inv.id} className={styles.faqItem} style={{ borderLeft: '3px solid #cbd5e1' }}>
                <div>
                  <strong>{inv.email ? `Destinado a: ${inv.email}` : 'Link Mágico Aberto'}</strong>
                  <p>
                    Papel: <span className={styles.badge}>{inv.role === 'owner' ? '👑 Proprietário' : '📋 Organizador'}</span>
                    {' • '}
                    Expira em: {new Date(inv.expira_em).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className={styles.itemActions}>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(inviteUrl)}
                    title="Copiar link"
                  >
                    Copiar Link
                  </button>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Acesse o painel do casamento comigo: ${inviteUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.4rem 0.8rem',
                      background: '#e2f9eb',
                      color: '#15803d',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      fontSize: '0.85rem',
                      border: '1px solid rgba(21, 128, 61, 0.2)'
                    }}
                  >
                    WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRevokeInvite(inv.id)}
                    className={styles.deleteBtn}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SEÇÃO 4: Membros Atuais da Equipe */}
      <div className={styles.faqList}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', margin: 0 }}>
            Membros Atuais ({organizers.length})
          </h3>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {ownersCount} {ownersCount === 1 ? 'Proprietário' : 'Proprietários'}
          </span>
        </div>

        {loading ? (
          <p>Carregando equipe...</p>
        ) : (
          organizers.map((org) => {
            const isOwner = org.role === 'owner';
            const isMe = org.email === userProfile?.email;

            return (
              <div
                key={org.user_id}
                className={styles.faqItem}
                style={{
                  borderLeft: isOwner ? '4px solid var(--admin-accent, #d4af37)' : '4px solid #cbd5e1',
                  background: isOwner ? 'rgba(212, 175, 55, 0.03)' : '#ffffff'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong>{org.email}</strong>
                    {isMe && (
                      <span style={{
                        fontSize: '0.75rem',
                        background: '#f1f5f9',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        color: '#475569'
                      }}>
                        Você
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '0.35rem 0 0 0' }}>
                    Função:{' '}
                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: isOwner ? 'var(--admin-accent, #d4af37)' : '#e2e8f0',
                        color: isOwner ? '#ffffff' : '#475569'
                      }}
                    >
                      {isOwner ? '👑 Proprietário' : '📋 Organizador'}
                    </span>
                  </p>
                </div>

                <div className={styles.itemActions}>
                  {/* Se for Organizador, pode ser promovido a Proprietário */}
                  {!isOwner && (
                    <button
                      type="button"
                      onClick={() => handleUpdateRole(org.user_id, 'owner')}
                      style={{ color: '#b45309' }}
                    >
                      👑 Tornar Proprietário
                    </button>
                  )}

                  {/* Se for Proprietário e houver mais de um, pode ser rebaixado */}
                  {isOwner && ownersCount > 1 && (
                    <button
                      type="button"
                      onClick={() => handleUpdateRole(org.user_id, 'organizador')}
                    >
                      Mudar para Organizador
                    </button>
                  )}

                  {/* Botão de remoção (permitido se não for o único owner) */}
                  {(!isOwner || ownersCount > 1) && (
                    <button
                      type="button"
                      onClick={() => handleRemove(org.user_id)}
                      className={styles.deleteBtn}
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
