import { Configuracao } from "@/lib/types/database";
import styles from "./Detalhes.module.css";

export default function Detalhes({ config }: { config?: Configuracao }) {
  const dateStr = config ? new Date(config.data_casamento).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }) : '13 de Junho de 2026';

  return (
    <section className={styles.section} id="detalhes">
      <div className={styles.container}>
        <h2 className="cursive">O Evento</h2>
        <p className={styles.intro}>Estamos preparando tudo com muito carinho para celebrarmos juntos.</p>
        
        <div className={styles.cards}>
          <div className={styles.card}>
            <h3>A Cerimônia</h3>
            <div className={styles.info}>
              <p className={styles.date}>{dateStr}</p>
              <p className={styles.time}>{config?.horario_cerimonia || '16:00'}</p>
              <p className={styles.location}>{config?.local_cerimonia || 'Igreja Matriz'}</p>
              <p className={styles.address}>{config?.endereco_cerimonia || 'Praça da Matriz, Centro'}</p>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config?.endereco_cerimonia || '')}`} className={styles.mapLink} target="_blank" rel="noopener noreferrer">Ver no Mapa</a>
            </div>
          </div>
          
          <div className={styles.card}>
            <h3>A Recepção</h3>
            <div className={styles.info}>
              <p className={styles.date}>{dateStr}</p>
              <p className={styles.time}>{config?.horario_recepcao || '18:30'}</p>
              <p className={styles.location}>Local a confirmar</p>
              <p className={styles.address}>Mesmo endereço ou local próximo</p>
              <a href="#" className={styles.mapLink} target="_blank" rel="noopener noreferrer">Ver no Mapa</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
