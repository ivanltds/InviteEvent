'use client';

import { useState, useEffect } from 'react';
import styles from "./OsNoivos.module.css";
import { Configuracao } from '@/lib/types/database';

export default function OsNoivos({ config }: { config: Configuracao }) {
  const [bios, setBios] = useState({
    noiva: config.noiva_bio || 'Intensa, forte e decidida. A chama que ilumina a relação e traz a força necessária para enfrentar qualquer desafio.',
    noivo: config.noivo_bio || 'Paciente, leve e equilibrado. A brisa suave que traz tranquilidade e estabilidade aos dias mais corridos.',
    conclusao: config.noivos_conclusao || 'Nossas diferenças não nos afastam, mas nos complementam de forma única. Onde há intensidade, há também paciência. E é justamente nessa união perfeita de temperamentos que encontramos o amor verdadeiro.'
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
        <h2 className="cursive">O Casal Perfeito</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3 className="cursive">{config.noiva_nome}</h3>
            <p className={styles.desc}>{bios.noiva}</p>
          </div>
          <div className={styles.card}>
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
