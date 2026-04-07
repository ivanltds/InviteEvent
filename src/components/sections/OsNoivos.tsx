'use client';

import { useState, useEffect } from 'react';
import styles from "./OsNoivos.module.css";
import { supabase } from '@/lib/supabase';

export default function OsNoivos() {
  const [bios, setBios] = useState({
    noiva: 'Intensa, forte e decidida. A chama que ilumina a relação e traz a força necessária para enfrentar qualquer desafio.',
    noivo: 'Paciente, leve e equilibrado. A brisa suave que traz tranquilidade e estabilidade aos dias mais corridos.',
    conclusao: 'Nossas diferenças não nos afastam, mas nos complementam de forma única. Onde há intensidade, há também paciência. E é justamente nessa união perfeita de temperamentos que encontramos o amor verdadeiro.'
  });

  useEffect(() => {
    async function fetchBios() {
      const { data } = await supabase
        .from('configuracoes')
        .select('noiva_bio, noivo_bio, noivos_conclusao')
        .eq('id', 1)
        .maybeSingle();
      
      if (data) {
        setBios({
          noiva: data.noiva_bio || bios.noiva,
          noivo: data.noivo_bio || bios.noivo,
          conclusao: data.noivos_conclusao || bios.conclusao
        });
      }
    }
    fetchBios();
  }, []);

  return (
    <section className={styles.section} id="os-noivos">
      <div className={styles.container}>
        <h2 className="cursive">O Casal Perfeito</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3 className="cursive">Layslla</h3>
            <p className={styles.desc}>{bios.noiva}</p>
          </div>
          <div className={styles.card}>
            <h3 className="cursive">Marcus</h3>
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
