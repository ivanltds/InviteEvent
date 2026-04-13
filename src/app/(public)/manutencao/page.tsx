import styles from './Manutencao.module.css';

export default function ManutencaoPage() {
  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1 className="cursive">Em Breve...</h1>
        <p>Este site de casamento está sendo preparado com muito carinho e será liberado em breve.</p>
        <p className={styles.sub}>Agradecemos a compreensão!</p>
      </div>
    </main>
  );
}
