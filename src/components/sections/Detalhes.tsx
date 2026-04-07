import styles from "./Detalhes.module.css";

export default function Detalhes() {
  return (
    <section className={styles.section} id="detalhes">
      <div className={styles.container}>
        <h2 className="cursive">O Evento</h2>
        <p className={styles.intro}>Estamos preparando tudo com muito carinho para celebrarmos juntos.</p>
        
        <div className={styles.cards}>
          <div className={styles.card}>
            <h3>A Cerimônia</h3>
            <div className={styles.info}>
              <p className={styles.date}>13 de Junho de 2026</p>
              <p className={styles.time}>16:00</p>
              <p className={styles.location}>Igreja Matriz de Nossa Senhora</p>
              <p className={styles.address}>Praça da Matriz, Centro - Cidade, Estado</p>
              <a href="#" className={styles.mapLink} target="_blank" rel="noopener noreferrer">Ver no Mapa</a>
            </div>
          </div>
          
          <div className={styles.card}>
            <h3>A Recepção</h3>
            <div className={styles.info}>
              <p className={styles.date}>13 de Junho de 2026</p>
              <p className={styles.time}>18:30</p>
              <p className={styles.location}>Espaço Jardins do Lago</p>
              <p className={styles.address}>Estrada das Flores, KM 2 - Cidade, Estado</p>
              <a href="#" className={styles.mapLink} target="_blank" rel="noopener noreferrer">Ver no Mapa</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
