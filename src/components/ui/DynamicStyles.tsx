'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DynamicStyles() {
  const [styles, setStyles] = useState({
    bg: '#fdfbf7',
    text: '#4a4a4a',
    accent: '#8fa89b',
    fontCursive: "'Pinyon Script', cursive",
    fontSerif: "'Playfair Display', serif"
  });

  useEffect(() => {
    async function fetchConfig() {
      const { data } = await supabase
        .from('configuracoes')
        .select('bg_primary, text_main, accent_color, font_cursive, font_serif')
        .eq('id', 1)
        .maybeSingle();
      
      if (data) {
        setStyles({
          bg: data.bg_primary || '#fdfbf7',
          text: data.text_main || '#4a4a4a',
          accent: data.accent_color || '#8fa89b',
          fontCursive: data.font_cursive || "'Pinyon Script', cursive",
          fontSerif: data.font_serif || "'Playfair Display', serif"
        });
      }
    }
    fetchConfig();
  }, []);

  return (
    <style dangerouslySetInnerHTML={{ __html: `
      :root {
        --bg-primary: ${styles.bg};
        --text-main: ${styles.text};
        --accent: ${styles.accent};
        --font-cursive: ${styles.fontCursive};
        --font-serif: ${styles.fontSerif};
      }
      
      body {
        background-color: var(--bg-primary);
        color: var(--text-main);
      }
      
      .cursive {
        font-family: var(--font-cursive) !important;
      }
      
      h1, h2, h3, h4, h5, h6 {
        font-family: var(--font-serif);
      }
    `}} />
  );
}
