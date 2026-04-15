'use client';

import { useState, useEffect } from 'react';
import styles from "./OsNoivos.module.css";
import { Configuracao } from '@/lib/types/database';

export default function OsNoivos({ config }: { config: Configuracao }) {
  const [bios, setBios] = useState({
    noiva: config.noiva_bio || 'Sonhadora e dedicada, ela traz a sensibilidade e a determinação que tornam cada momento especial. É o coração que pulsa em sintonia com a felicidade.',
    noivo: config.noivo_bio || 'Calmo e companheiro, ele é o equilíbrio e o suporte constante. Sua leveza transforma desafios em aprendizado e dias comuns em memórias inesquecíveis.',
    conclusao: config.noivos_conclusao || 'Somos dois caminhos que se cruzaram para formar uma única história. Juntos, somos mais fortes, mais felizes e prontos para construir um futuro repleto de amor.'
  });

  useEffect(() => {
    if (config) {
      setBios({
        noiva: config.noiva_bio || bios.noiva,
        noivo: config.noivo_bio || bios.noivo,
        conclusao: config.noivos_conclusao || bios.conclusao
      });
    }
  }, [config]);

  return (
    <section className={styles.section} id="os-noivos">
      <div className={styles.container}>
        <h2 className="cursive">Os Protagonistas</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.photoContainer}>
              <img src={config.noiva_foto_url || 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop'} alt={config.noiva_nome} />
            </div>
            <h3 className="cursive">{config.noiva_nome}</h3>
            <p className={styles.desc}>{bios.noiva}</p>
          </div>
          <div className={styles.card}>
            <div className={styles.photoContainer}>
              <img src={config.noivo_foto_url || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop'} alt={config.noivo_nome} />
            </div>
            <h3 className="cursive">{config.noivo_nome}</h3>
            <p className={styles.desc}>{bios.noivo}</p>
          </div>
        </div>
        <p className={styles.conclusion}>
          {bios.conclusao}
        </p>
      </div>
    </section>
  );
}
