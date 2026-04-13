'use client';

import { useState, useEffect } from 'react';
import styles from "./Historia.module.css";
import { Configuracao } from '@/lib/types/database';

export default function Historia({ config }: { config: Configuracao }) {
  const [content, setContent] = useState({
    titulo: config.historia_titulo || 'Nossa História',
    subtitulo: config.historia_subtitulo || 'O caminho até aqui',
    texto: config.historia_texto || 'O encontro de duas almas é sempre um evento extraordinário. O que começou como uma simples coincidência transformou-se em uma jornada de parceria, risadas e cumplicidade. Descobrimos um no outro não apenas o amor, mas um lar e um porto seguro.',
    conclusao: config.historia_conclusao || 'Agora, estamos prontos para começar o capítulo mais importante das nossas vidas. O nosso "sim" não é apenas para hoje, mas para todos os amanhãs que virão.'
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
