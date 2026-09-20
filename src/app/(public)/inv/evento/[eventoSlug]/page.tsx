'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { eventService } from '@/lib/services/eventService';
import { configService } from '@/lib/services/configService';
import { inviteService } from '@/lib/services/inviteService';
import { getSavedConvite, saveConvite } from '@/lib/utils/linkUnico';
import styles from './PublicAutoCadastro.module.css';

/**
 * "Portaria" do modo Link Único (docs/analise/04b-guia-de-extensao.md).
 * Convidado com registro salvo no navegador é redirecionado direto pro
 * convite dele (rota /inv/[slug] de sempre, sem nenhuma alteração nela).
 * Sem registro, mostra a tela de auto-identificação e cria o convite nos
 * bastidores antes de redirecionar.
 */
export default function PublicAutoCadastroPage() {
  const params = useParams();
  const router = useRouter();
  const eventoSlug = params.eventoSlug as string;

  const [loading, setLoading] = useState(true);
  const [eventoId, setEventoId] = useState<string | null>(null);
  const [eventoNome, setEventoNome] = useState('');
  const [accentColor, setAccentColor] = useState<string | undefined>();
  const [notFound, setNotFound] = useState(false);
  const [modoInvalido, setModoInvalido] = useState(false);

  const [nome, setNome] = useState('');
  const [acompanhantes, setAcompanhantes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const evento = await eventService.getEventoBySlug(eventoSlug);
      if (!evento) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setEventoId(evento.id);

      const config = await configService.getConfig(evento.id);
      if (config?.modo_convite !== 'link_unico') {
        // Evento existe, mas não está no modo Link Único (ou desativou depois
        // de compartilhar o link) — não deixa criar convite por engano.
        setModoInvalido(true);
        setLoading(false);
        return;
      }
      setEventoNome(`${config.noiva_nome} & ${config.noivo_nome}`);
      setAccentColor(config.accent_color || undefined);

      const saved = getSavedConvite(eventoSlug);
      if (saved) {
        router.replace(`/inv/${saved.slug}`);
        return;
      }

      setLoading(false);
    }
    init();
  }, [eventoSlug, router]);

  const addAcompanhante = () => setAcompanhantes(prev => [...prev, '']);
  const removeAcompanhante = (index: number) =>
    setAcompanhantes(prev => prev.filter((_, i) => i !== index));
  const updateAcompanhante = (index: number, value: string) =>
    setAcompanhantes(prev => prev.map((a, i) => (i === index ? value : a)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventoId || !nome.trim()) return;

    setSubmitting(true);
    setErrorMessage(null);

    const result = await inviteService.criarConviteAutoCadastro(eventoId, nome, acompanhantes);

    if (result.success && result.slug) {
      saveConvite(eventoSlug, result.slug);
      router.replace(`/inv/${result.slug}`);
    } else {
      setErrorMessage('Não conseguimos confirmar seu cadastro agora. Tente novamente em instantes.');
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loading}>Carregando...</div>;

  if (notFound) {
    return (
      <main className={styles.container}>
        <p className={styles.empty}>Convite não encontrado.</p>
      </main>
    );
  }

  if (modoInvalido) {
    return (
      <main className={styles.container}>
        <p className={styles.empty}>
          Para confirmar sua presença, utilize o link enviado pelos noivos.
        </p>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className="cursive">{eventoNome}</h1>
        <p className={styles.subtitle}>Antes de confirmar, como você se chama?</p>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.fieldGroup}>
          <label htmlFor="nome">Seu nome</label>
          <input
            id="nome"
            type="text"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Ana Souza"
            className={styles.input}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label>Vem mais alguém com você?</label>
          {acompanhantes.map((acompanhante, index) => (
            <div key={index} className={styles.acompanhanteRow}>
              <input
                type="text"
                value={acompanhante}
                onChange={(e) => updateAcompanhante(index, e.target.value)}
                placeholder="Nome do acompanhante"
                className={styles.input}
              />
              <button
                type="button"
                onClick={() => removeAcompanhante(index)}
                className={styles.removeBtn}
                aria-label="Remover acompanhante"
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" onClick={addAcompanhante} className={styles.addBtn} style={{ color: accentColor }}>
            + Adicionar acompanhante
          </button>
        </div>

        {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}

        <button type="submit" className={styles.primaryBtn} disabled={submitting} style={{ backgroundColor: accentColor }}>
          {submitting ? 'Confirmando...' : 'Continuar'}
        </button>
      </form>
    </main>
  );
}
