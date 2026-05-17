import { Configuracao } from "@/lib/types/database";
import styles from "./Detalhes.module.css";

export default function Detalhes({ config }: { config?: Configuracao }) {
  let dateStr = '13 de Junho de 2026';
  if (config?.data_casamento) {
    const [year, month, day] = config.data_casamento.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    dateStr = dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

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
