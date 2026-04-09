'use client';

import { useState, useEffect } from 'react';
import styles from "./Historia.module.css";
import { Configuracao } from '@/lib/types/database';

export default function Historia({ config }: { config: Configuracao }) {
  const [content, setContent] = useState({
    titulo: config.historia_titulo || 'Nossa História',
    subtitulo: config.historia_subtitulo || 'O Início de Tudo',
    texto: config.historia_texto || 'Tudo começou através de um amigo distante do primo da noiva. O que era para ser apenas um encontro casual se transformou no momento mais importante das nossas vidas. Foi amor à primeira vista. A conexão foi tão forte e imediata que, pouco tempo depois, já estávamos namorando.',
    conclusao: config.historia_conclusao || 'O dia 13 de junho não é apenas uma data qualquer. Foi o dia em que o pedido de namoro aconteceu, e agora, será o dia em que diremos "sim" para o resto de nossas vidas.'
  });

  useEffect(() => {
    if (config) {
      setContent({
        titulo: config.historia_titulo || 'Nossa História',
        subtitulo: config.historia_subtitulo || 'O Início de Tudo',
        texto: config.historia_texto || content.texto,
        conclusao: config.historia_conclusao || content.conclusao
      });
    }
  }, [config]);

  return (
    <section className={styles.section} id="historia">
      <div className={styles.container}>
        <h2 className="cursive">{content.titulo}</h2>
        <h3 className={styles.subtitle}>{content.subtitulo}</h3>
        <div className={styles.textContainer}>
          {content.texto.split('\n').map((para, i) => (
            <p key={i} className={styles.text}>{para}</p>
          ))}
        </div>
        <p className={styles.highlight}>
          {content.conclusao}
        </p>
      </div>
    </section>
  );
}
