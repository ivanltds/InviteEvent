'use client';

import { motion } from 'framer-motion';
import styles from './Agenda.module.css';
import { AgendaEvent, Configuracao } from '@/lib/types/database';

interface AgendaSectionProps {
  events: AgendaEvent[];
  config?: Configuracao;
}

export default function AgendaSection({ events, config }: AgendaSectionProps) {
  if (!events || events.length === 0) return null;

  const sortedEvents = [...events].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5); // HH:mm
  };

  const getIcon = (type?: string) => {
    const color = config?.accent_color || 'var(--accent-gold)';
    switch (type) {
      case 'church': 
        return (
          <svg viewBox="0 0 24 24" width="24" height="24" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18"></path>
            <path d="M10 21v-4a2 2 0 0 1 4 0v4"></path>
            <path d="M4 21V10l8-7 8 7v11"></path>
            <path d="M9 9l3 3 3-3"></path>
          </svg>
        );
      case 'party': 
        return (
          <svg viewBox="0 0 24 24" width="24" height="24" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3h12l-2 8H8l-2-8z"></path>
            <path d="M12 11v10"></path>
            <path d="M8 21h8"></path>
          </svg>
        );
      case 'food': 
        return (
          <svg viewBox="0 0 24 24" width="24" height="24" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
            <line x1="6" y1="1" x2="6" y2="4"></line>
            <line x1="10" y1="1" x2="10" y2="4"></line>
            <line x1="14" y1="1" x2="14" y2="4"></line>
          </svg>
        );
      case 'ring': 
        return (
          <svg viewBox="0 0 24 24" width="24" height="24" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="5"></circle>
            <circle cx="16" cy="16" r="5"></circle>
          </svg>
        );
      default: 
        return (
          <svg viewBox="0 0 24 24" width="24" height="24" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        );
    }
  };

  return (
    <section className={styles.section} id="agenda">
      <div className={styles.container}>
        <motion.h2 
          className="cursive"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ color: config?.accent_color }}
        >
          Programação
        </motion.h2>
        <p className={styles.subtitle}>Acompanhe cada momento do nosso grande dia</p>

        <div className={styles.timeline}>
          {sortedEvents.map((item, index) => (
            <motion.div 
              key={item.id}
              className={styles.eventCard}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={styles.timeBadge} style={{ background: config?.accent_color }}>
                {formatTime(item.horario)}
              </div>
              
              <div className={styles.content}>
                <div className={styles.header}>
                  <span className={styles.icon}>{getIcon(item.icone)}</span>
                  <h3>{item.titulo}</h3>
                </div>
                
                <div className={styles.locationInfo}>
                  <p className={styles.localName}>{item.local_nome}</p>
                  <p className={styles.address}>{item.endereco}</p>
                </div>

                <div className={styles.actions}>
                  {item.link_google_maps && (
                    <a 
                      href={item.link_google_maps} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.gpsBtn}
                      style={{ '--btn-color': config?.accent_color || '#4285F4' } as any}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      Google Maps
                    </a>
                  )}
                  {item.link_waze && (
                    <a 
                      href={item.link_waze} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.gpsBtn}
                      style={{ '--btn-color': '#33CCFF' } as any}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>
                      Waze
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
