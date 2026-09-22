import { Configuracao } from '@/lib/types/database';

/**
 * Valores-placeholder usados como estado inicial de `configuracoes` antes do
 * primeiro carregamento em src/app/(admin)/admin/configuracoes/page.tsx, e
 * como referência para detectar "o organizador ainda não personalizou isso"
 * em src/lib/utils/setupProgress.ts (checklist de setup guiado).
 *
 * Extraído pra cá pra não duplicar os mesmos valores em dois arquivos — se
 * um mudar, o outro tem que mudar junto, então viram a mesma fonte.
 */
export const DEFAULT_CONFIG: Omit<Configuracao, 'id' | 'evento_id'> = {
  noiva_nome: 'Noiva',
  noivo_nome: 'Noivo',
  data_casamento: '2026-06-13',
  prazo_rsvp: '2026-05-13',
  horario_cerimonia: '16:00',
  horario_recepcao: '18:30',
  local_cerimonia: 'Igreja Matriz',
  endereco_cerimonia: 'Praça da Matriz, Centro',
  mostrar_historia: true,
  mostrar_noivos: true,
  mostrar_faq: true,
  mostrar_presentes: true,
  mostrar_mural: true,
  mostrar_detalhes: true,
  secoes_ordem: ['detalhes', 'historia', 'noivos', 'agenda', 'rsvp', 'faq'],
  card_template: 'classico',
  card_template_styles: {},
  modo_arrecadacao: 'presentes',
  gravata_label: 'quero_colaborar',
  gravata_label_personalizado: '',
  gravata_recado: 'Sua presença já é o nosso maior presente, mas se quiser nos ajudar a começar essa nova fase, ficaremos muito felizes com sua contribuição.',
  gravata_valores_sugeridos: [],
  modo_convite: 'individual',
  pix_chave: '',
  pix_banco: '',
  pix_nome: '',
  pix_tipo: 'cpf',
  historia_titulo: 'Nossa História',
  historia_subtitulo: 'O Início de Tudo',
  historia_texto: 'Tudo começou através de um amigo distante do primo da noiva...',
  historia_conclusao: 'O dia 13 de junho não é apenas uma data qualquer. Foi o dia em que o pedido de namoro aconteceu, e agora, será o dia em que diremos "sim" para o resto de nossas vidas.',
  noiva_bio: 'Bio da Noiva...',
  noivo_bio: 'Bio do Noivo...',
  noivos_conclusao: 'Mensagem Final do Casal...',
  bg_primary: '#fdfbf7',
  text_main: '#4a4a4a',
  accent_color: '#8fa89b',
  font_cursive: "'Pinyon Script', cursive",
  font_serif: "'Playfair Display', serif"
};

/**
 * Dias entre a criação de um evento e a data de casamento "de mentira" que
 * eventService.createEvent grava automaticamente (ver
 * src/lib/services/eventService.ts) quando o organizador cria um evento
 * direto pelo Dashboard (sem passar por /criar). Usado por
 * setupProgress.ts pra saber se a data ainda é essa auto-gerada.
 */
export const AUTO_GENERATED_WEDDING_DATE_OFFSET_DAYS = 180;
