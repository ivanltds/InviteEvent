'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePathname, useSearchParams } from 'next/navigation';

import { getContrastColor, getLegibleText } from '@/lib/utils/colors';

export default function DynamicStyles() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [styles, setStyles] = useState({
    bg: '#fdfbf7',
    text: '#4a4a4a',
    accent: '#8fa89b',
    fontCursive: "'Pinyon Script', cursive",
    fontSerif: "'Playfair Display', serif"
  });

  useEffect(() => {
    setMounted(true);
    async function fetchConfig() {
      try {
        // 1. Identificar Slug (Path: /inv/[slug] ou Query: ?invite=slug) ou EventID direto (fallback para preview)
        const pathSlug = pathname?.startsWith('/inv/') ? pathname.split('/')[2] : null;
        const querySlug = searchParams?.get('invite');
        const activeSlug = pathSlug || querySlug;
        
        const queryEventId = searchParams?.get('eventId');
        
        let activeEventId = queryEventId;

        // 2. Se não temos EventId mas temos Slug, buscar o evento_id do convite
        if (!activeEventId && activeSlug) {
          const { data: invite } = await supabase.from('convites').select('evento_id').eq('slug', activeSlug).maybeSingle();
          if (invite) {
            activeEventId = invite.evento_id;
          }
        }

        // Se após todas as tentativas não temos EventID, abortamos
        if (!activeEventId) return;

        // 3. Buscar a config do evento diretamente pelo EventID recuperado
        const query = supabase
          .from('configuracoes')
          .select('bg_primary, text_main, accent_color, font_cursive, font_serif')
          .eq('evento_id', activeEventId);
        
        const { data, error } = await query.maybeSingle();
        
        if (error) {
          console.warn('Supabase não respondeu com dados:', error.message);
          return;
        }
        
        if (data) {
          setStyles({
            bg: data.bg_primary || '#fdfbf7',
            text: data.text_main || '#4a4a4a',
            accent: data.accent_color || '#8fa89b',
            fontCursive: data.font_cursive || "'Pinyon Script', cursive",
            fontSerif: data.font_serif || "'Playfair Display', serif"
          });
        }
      } catch (e) {
        console.error('Falha crítica ao carregar estilos dinâmicos:', e);
      }
    }
    fetchConfig();
  }, []);

  if (!mounted) return null;

  // Extrair nomes das fontes para carregar do Google Fonts
  // Exemplo: "'Playfair Display', serif" -> "Playfair+Display"
  const getFontFamilyName = (fontStr: string) => {
    const match = fontStr.match(/'([^']+)'/);
    return match ? match[1].replace(/\s+/g, '+') : null;
  };

  const cursiveName = getFontFamilyName(styles.fontCursive);
  const serifName = getFontFamilyName(styles.fontSerif);
  
  const googleFontsUrl = (cursiveName && serifName) 
    ? `https://fonts.googleapis.com/css2?family=${cursiveName}&family=${serifName}&display=swap`
    : null;

  return (
    <>
      {googleFontsUrl && (
        <style key="google-fonts" dangerouslySetInnerHTML={{ __html: `@import url('${googleFontsUrl}');` }} />
      )}
      <style key="dynamic-vars" dangerouslySetInnerHTML={{ __html: `
        :root {
          --bg-primary: ${styles.bg};
          --text-main: ${styles.text};
          --accent: ${styles.accent};
          
          /* Variáveis Calculadas para Segurança Visual */
          --text-on-accent: ${getContrastColor(styles.accent)};
          --text-main-safe: ${getLegibleText(styles.bg, styles.text)};
          --accent-safe: ${getLegibleText(styles.bg, styles.accent)};
          
          --font-cursive: ${styles.fontCursive};
          --font-serif: ${styles.fontSerif};
          --font-pinyon: ${styles.fontCursive};
          --font-playfair: ${styles.fontSerif};
          --font-editorial: ${styles.fontSerif};
        }
        
        body {
          background-color: var(--bg-primary);
          color: var(--text-main-safe);
        }
        
        .cursive {
          font-family: var(--font-cursive) !important;
        }
        
        h1, h2, h3, h4, h5, h6 {
          font-family: var(--font-serif);
          color: var(--accent-safe);
        }
      `}} />
    </>
  );
}
