'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { rsvpService } from '@/lib/services/rsvpService';
import { configService } from '@/lib/services/configService';
import { eventService } from '@/lib/services/eventService';
import { generatePixPayload } from '@/lib/utils/pix';
import { Configuracao } from '@/lib/types/database';
import PixPanel from '@/components/shared/PixPanel';
import styles from './PublicGravata.module.css';

export default function PublicGravataPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [eventoNome, setEventoNome] = useState('');
  const [config, setConfig] = useState<Configuracao | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [valorSelecionado, setValorSelecionado] = useState<number | null>(null);
  // No modo Link Único, antes da confirmação de presença ainda não existe
  // convite — o botão "Quero colaborar" do hero usa o slug do EVENTO, não
  // de um convite. "Voltar ao convite" precisa saber qual rota usar.
  const [backHref, setBackHref] = useState<string>('/');

  useEffect(() => {
    async function init() {
      try {
        // 1. Tenta como slug de convite (fluxo tradicional, ou Link Único
        // já com convite auto-cadastrado após o RSVP).
        const invite = await rsvpService.getInviteBySlug(slug);
        if (invite) {
          const configData = await configService.getConfig(invite.evento_id);
          setConfig(configData);
          setEventoNome(configData ? `${configData.noiva_nome} & ${configData.noivo_nome}` : '');
          setBackHref(`/inv/${slug}`);
          return;
        }

        // 2. Correção de 20/09/2026 ("Convite não encontrado" ao clicar em
        // "Quero colaborar" antes de confirmar presença): tenta como slug
        // de EVENTO, modo Link Único.
        const evento = await eventService.getEventoBySlug(slug);
        if (!evento) {
          setNotFound(true);
          return;
        }
        const configData = await configService.getConfig(evento.id);
        if (!configData || configData.modo_convite !== 'link_unico') {
          // Evento existe mas não é Link Único — esse slug não corresponde
          // a nenhum convite de verdade.
          setNotFound(true);
          return;
        }
        setConfig(configData);
        setEventoNome(`${configData.noiva_nome} & ${configData.noivo_nome}`);
        setBackHref(`/inv/evento/${slug}`);
      } catch (err) {
        console.error('[Gravata] Erro ao carregar:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [slug]);

  // Correção de 20/09/2026: NÃO cair para uma chave PIX hardcoded de
  // fallback como o fluxo de presentes fazia (docs/analise/05-privacidade-e-higiene-repo.md).
  // Sem chave cadastrada, simplesmente não gera payload — a tela mostra
  // "em breve" em vez de cobrar de um PIX que não é do casal.
  const pixPayload = useMemo(() => {
    if (!config?.pix_chave) return '';
    return generatePixPayload(
      config.pix_chave,
      config.pix_nome || eventoNome || 'CASAMENTO',
      config.pix_tipo || 'aleatoria',
      'SAO PAULO',
      valorSelecionado ?? undefined
    );
  }, [config, eventoNome, valorSelecionado]);

  const copyPixCode = () => {
    if (!pixPayload) return;
    navigator.clipboard.writeText(pixPayload);
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 3000);
  };

  if (loading) return <div className={styles.loading}>Carregando...</div>;

  if (notFound || !config) {
    return (
      <main className={styles.container}>
        <p className={styles.empty}>Convite não encontrado.</p>
      </main>
    );
  }

  const accentColor = config.accent_color || undefined;

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <Link href={backHref} className={styles.backBtn} style={{ color: accentColor }}>
          ← Voltar ao Convite
        </Link>
        <h1 className="cursive">{eventoNome}</h1>
      </header>

      <div className={styles.recado}>
        {config.gravata_recado || 'Sua presença já é o nosso maior presente!'}
      </div>

      {pixPayload && (config.gravata_valores_sugeridos?.length ?? 0) > 0 && (
        <div className={styles.valoresSugeridos}>
          <p className={styles.valoresLabel}>Quanto você gostaria de contribuir?</p>
          <div className={styles.valoresChips}>
            {config.gravata_valores_sugeridos!.map((valor) => (
              <button
                key={valor}
                type="button"
                onClick={() => setValorSelecionado(valorSelecionado === valor ? null : valor)}
                className={styles.valorChip}
                style={
                  valorSelecionado === valor
                    ? { backgroundColor: accentColor, borderColor: accentColor, color: '#fff' }
                    : { borderColor: accentColor }
                }
              >
                {valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </button>
            ))}
          </div>
        </div>
      )}

      {pixPayload ? (
        <PixPanel
          pixPayload={pixPayload}
          onCopy={copyPixCode}
          copyStatus={copyStatus}
          accentColor={accentColor}
          qrAltLabel={eventoNome}
          total={valorSelecionado ?? undefined}
        />
      ) : (
        <div className={styles.emComBreve}>
          <p>Em breve os noivos disponibilizarão os dados para contribuição.</p>
        </div>
      )}
    </main>
  );
}
