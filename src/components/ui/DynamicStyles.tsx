'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePathname, useSearchParams } from 'next/navigation';

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
        // 1. Identificar Slug (Path: /inv/[slug] ou Query: ?invite=slug)
        const pathSlug = pathname?.startsWith('/inv/') ? pathname.split('/')[2] : null;
        const querySlug = searchParams?.get('invite');
        const activeSlug = pathSlug || querySlug;

        if (!activeSlug) return;

        // 2. Buscar o evento_id do convite
        const { data: invite } = await supabase.from('convites').select('evento_id').eq('slug', activeSlug).maybeSingle();
        if (!invite) return;

        // 3. Buscar a config do evento
        const query = supabase
          .from('configuracoes')
          .select('bg_primary, text_main, accent_color, font_cursive, font_serif')
          .eq('evento_id', invite.evento_id);
        
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

  const getContrastColor = (hexcolor: string) => {
    if (!hexcolor) return '#ffffff';
    hexcolor = hexcolor.replace('#', '');
    if (hexcolor.length === 3) {
      hexcolor = hexcolor.split('').map(c => c + c).join('');
    }
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#1a1a1a' : '#ffffff';
  };

  // Garante que uma cor de texto seja legível contra um fundo
  const getLegibleText = (bgHex: string, textHex: string) => {
    const getLuminance = (hex: string) => {
      hex = hex.replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      const a = [r, g, b].map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };

    const lum1 = getLuminance(bgHex);
    const lum2 = getLuminance(textHex);
    const ratio = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);

    // Se o contraste for baixo (< 3:1), força um fallback
    if (ratio < 3) {
      return lum1 > 0.5 ? '#1a1a1a' : '#ffffff';
    }
    return textHex;
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
