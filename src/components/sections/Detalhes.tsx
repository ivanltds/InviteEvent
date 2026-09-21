import { Configuracao } from "@/lib/types/database";
import styles from "./Detalhes.module.css";
import { resolveGoogleMapsUrl, resolveWazeUrl, resolveGoogleMapsEmbedUrl } from "@/lib/utils/maps";

/**
 * Correção de 20/09/2026 (feedback do usuário): recepção e cerimônia
 * geralmente acontecem no mesmo local, então o endereço não fica mais
 * duplicado (e às vezes inconsistente, com texto placeholder) dentro de
 * cada card — aparece uma única vez, fora dos cards de horário. Além
 * disso a Recepção passou a vir antes da Cerimônia, por pedido explícito.
 */
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

  const localCerimonia = config?.local_cerimonia || 'Igreja Matriz';
  const enderecoCerimonia = config?.endereco_cerimonia || 'Praça da Matriz, Centro';
  const enderecoParaNavegar = config?.endereco_cerimonia || config?.local_cerimonia;
  const googleMapsUrl = resolveGoogleMapsUrl(enderecoParaNavegar);
  const wazeUrl = resolveWazeUrl(enderecoParaNavegar);
  const mapEmbedUrl = resolveGoogleMapsEmbedUrl(enderecoParaNavegar);

  return (
    <section className={styles.section} id="detalhes">
      <div className={styles.container}>
        <h2 className="cursive">O Evento</h2>
        <p className={styles.intro}>Estamos preparando tudo com muito carinho para celebrarmos juntos.</p>

        <div className={styles.cards}>
          <div className={styles.card}>
            <h3>A Recepção</h3>
            <div className={styles.info}>
              <p className={styles.date}>{dateStr}</p>
              <p className={styles.time}>{config?.horario_recepcao || '18:30'}</p>
            </div>
          </div>

          <div className={styles.card}>
            <h3>A Cerimônia</h3>
            <div className={styles.info}>
              <p className={styles.date}>{dateStr}</p>
              <p className={styles.time}>{config?.horario_cerimonia || '16:00'}</p>
            </div>
          </div>
        </div>

        <div className={styles.venue}>
          <p className={styles.location}>{localCerimonia}</p>
          <p className={styles.address}>{enderecoCerimonia}</p>

          {mapEmbedUrl && (
            <div className={styles.mapEmbed}>
              <iframe
                src={mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Mapa de localização: ${localCerimonia}`}
              />
            </div>
          )}

          <div className={styles.mapLinks}>
            {googleMapsUrl && (
              <a href={googleMapsUrl} className={styles.mapLink} target="_blank" rel="noopener noreferrer">Google Maps</a>
            )}
            {wazeUrl && (
              <a href={wazeUrl} className={styles.mapLink} target="_blank" rel="noopener noreferrer">Waze</a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
