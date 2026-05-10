'use client';

import React from 'react';
import { Configuracao } from '@/lib/types/database';
import LiveInviteView from '../public/LiveInviteView';

interface ConfigPreviewProps {
  config: Partial<Configuracao>;
  agenda?: any[];
}

const ConfigPreview: React.FC<ConfigPreviewProps> = ({ config, agenda = [] }) => {
  
  // Construímos a data mockada ou real de forma robusta para o preview
  const getFormattedDate = () => {
    if (!config.data_casamento) return '13 de Junho de 2026';
    try {
      const [year, month, day] = config.data_casamento.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return '13 de Junho de 2026';
    }
  };

  // Mapeamento da visibilidade em tempo real
  const visibility = {
    historia: config.mostrar_historia !== false,
    noivos: config.mostrar_noivos !== false,
    faq: config.mostrar_faq !== false,
    presentes: config.mostrar_presentes !== false
  };

  // Se tivermos agenda do banco, usamos ela. Senão, fallback para preview preenchido.
  const displayAgenda = (agenda && agenda.length > 0) ? agenda : [
    { id: '1', titulo: 'Cerimônia', horario: config.horario_cerimonia || '16:00', local_nome: config.local_cerimonia || 'Igreja', icone: 'church' },
    { id: '2', titulo: 'Festa', horario: config.horario_recepcao || '18:30', local_nome: 'Recepção', icone: 'party' }
  ];

  const couple = {
    noiva: config.noiva_nome || 'Noiva',
    noivo: config.noivo_nome || 'Noivo',
    data: getFormattedDate(),
    rawDate: config.data_casamento || '2026-06-13'
  };

  return (
    <div style={{ 
      position: 'sticky', 
      top: '2rem', 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', color: '#666', letterSpacing: '0.05em' }}>
          📱 Pré-visualização do Convite
        </div>
        <div style={{ fontSize: '0.7rem', background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
          LIVE
        </div>
      </div>

      {/* Emulador de Smartphone para Renderizar o Convite Verdadeiro */}
      <div style={{
        width: '100%',
        maxWidth: '380px',
        height: '750px',
        margin: '0 auto',
        borderRadius: '32px',
        border: '12px solid #1a1a1a',
        backgroundColor: '#1a1a1a',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Notch do iPhone para estética premium */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '140px',
          height: '25px',
          background: '#1a1a1a',
          borderBottomLeftRadius: '16px',
          borderBottomRightRadius: '16px',
          zIndex: 1000000
        }} />

        {/* Container de Scroll Interno com o componente real */}
        <div style={{
          flex: 1,
          background: '#fff',
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
          borderRadius: '20px',
          // STORY: Para forçar o LiveInviteView a ser lido como mobile forçado no viewport e desabilitar ações
        }} className="hide-scrollbar">
          <LiveInviteView 
            config={config as any}
            couple={couple}
            visibility={visibility}
            agenda={displayAgenda}
            slug="preview"
            disableActions={true} // TRAVA AS INTERAÇÕES COMO O USUÁRIO SOLICITOU
          />
        </div>
      </div>

      <p style={{ fontSize: '0.8rem', textAlign: 'center', color: '#999', fontStyle: 'italic' }}>
        Esta é uma prévia real. Os botões estão inativos no modo de edição.
      </p>

      {/* Estilos Globais necessários para o preview e loaders de fonte */}
      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .hide-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .hide-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.3);
          border-radius: 10px;
        }
        
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display&family=Pinyon+Script&family=Great+Vibes&family=Dancing+Script&family=Alex+Brush&family=Parisienne&family=Rochester&family=Italianno&family=Allura&family=Homemade+Apple&family=Marck+Script&family=Satisfy&family=Courgette&family=Lora&family=Cinzel&family=Cormorant+Garamond&family=EB+Garamond&family=Libre+Baskerville&family=Cardo&family=Marcellus&family=Prata&display=swap');
      `}} />
    </div>
  );
};

export default ConfigPreview;
