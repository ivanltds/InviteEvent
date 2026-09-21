export type InviteType = 'individual' | 'casal' | 'familia';
export type RSVPStatus = 'confirmado' | 'recusado' | 'excedente_solicitado';
export type OrganizerRole = 'owner' | 'organizador';

export interface Perfil {
  id: string;
  email: string;
  nome?: string;
  cpf?: string;
  telefone?: string;
  is_master: boolean;
  created_at: string;
}

export interface Evento {
  id: string;
  nome: string;
  slug: string;
  is_active?: boolean;
  onboarding_completed?: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface EventoOrganizador {
  evento_id: string;
  user_id: string;
  role: OrganizerRole;
}

export interface Convite {
  id: string;
  evento_id: string;
  nome_principal: string;
  limite_pessoas: number;
  tipo: InviteType;
  slug: string;
  telefone?: string;
  created_at: string;
  user_id?: string;
}

export interface ConviteMembro {
  id: string;
  convite_id: string;
  evento_id?: string;
  nome: string;
  confirmado: boolean | null;
  restricoes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RSVP {
  id: string;
  convite_id: string;
  evento_id?: string;
  confirmados: number;
  restricoes?: string;
  mensagem?: string;
  telefone?: string;
  status: RSVPStatus | string;
  lgpd_consent?: boolean;
  lgpd_consent_at?: string | null;
  lgpd_ip_address?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Presente {
  id: string;
  evento_id: string;
  nome: string;
  preco: number;
  descricao?: string;
  imagem_url?: string;
  link_externo?: string;
  status: 'disponivel' | 'reservado' | 'esgotado' | 'pausado';
  quantidade_total: number;
  quantidade_reservada: number;
  preco_de?: number;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  categoria_id?: string | null;
  base_id?: string | null;
  // Campos de Cotas (PRD-014)
  permite_cotas?: boolean;
  total_cotas?: number | null;
  cotas_compradas?: number;
  is_sonho_casal?: boolean;
  highlight_label?: string;
  highlight_icon?: string;
  parceiro_nome?: string;
  // Relacionamento mapeado para joins no Supabase client
  categoria?: PresenteCategoria | null;
  presentes_locks?: PresenteLock[];
}

export interface PresenteLock {
  id: string;
  presente_id: string;
  session_id: string;
  convite_id?: string;
  expira_em: string;
  criado_em?: string;
  quantidade_cotas?: number; // PRD-014
}

export interface PresenteCategoria {
  id: string;
  nome: string;
  slug: string;
  ordem_padrao: number;
  criado_em?: string;
}

export interface PresenteBase {
  id: string;
  nome: string;
  preco: number;
  preco_de?: number;
  descricao?: string;
  imagem_url?: string;
  categoria_id: string;
  link_varejo_padrao?: string;
  parceiro_nome?: string;
  criado_em?: string;
  categoria?: PresenteCategoria;
}

export interface Comprovante {
  id: string;
  presente_id: string;
  convite_id?: string;
  convidado_nome: string;
  url_comprovante: string;
  mensagem?: string;
  created_at?: string;
  cotas_pagas?: number; // PRD-014
}

/** Modo de arrecadação do evento: Lista de Presentes, Gravata dos Noivos ou nenhum. */
export type ModoArrecadacao = 'presentes' | 'gravata' | 'nenhum';

/** Preset fechado do texto do botão de Gravata dos Noivos no convite. */
export type GravataLabel = 'quero_presentear' | 'quero_colaborar';

/** Modo de convite do evento: cadastro individual pelos noivos ou auto-cadastro por link único. */
export type ModoConvite = 'individual' | 'link_unico';

export interface Configuracao {
  id: number;
  evento_id: string;
  noiva_nome: string;
  noivo_nome: string;
  data_casamento: string;
  prazo_rsvp?: string;
  horario_cerimonia?: string;
  horario_recepcao?: string;
  local_cerimonia?: string;
  endereco_cerimonia?: string;
  mostrar_faq?: boolean;
  mostrar_historia?: boolean;
  mostrar_noivos?: boolean;
  mostrar_presentes?: boolean;
  /** Seção "O Evento" (A Cerimônia/A Recepção, com local_cerimonia/endereco_cerimonia). */
  mostrar_detalhes?: boolean;
  /** Mural de Lembranças é opcional: pode ser removido do convite (botão + rota /mural) nas configurações. */
  mostrar_mural?: boolean;
  /** Ordem de exibição das seções do convite, reordenável nas configurações. Ver SECOES_CONVITE_ORDEM_PADRAO. */
  secoes_ordem?: string[];
  /** Modelo visual do cartão de preview (WhatsApp/redes sociais). Ver CARD_TEMPLATES em conviteCard.ts. */
  card_template?: string;
  /** Fonte, tamanho da fonte e zoom da foto, independentes para cada um dos 6 modelos de cartão. Ver CardTemplateStyles em conviteCard.ts. */
  card_template_styles?: Record<string, { font?: string; fontScale?: number; image?: string; imageScale?: number }>;
  /** Fonte de verdade para o botão de arrecadação no convite (substitui mostrar_presentes). */
  modo_arrecadacao?: ModoArrecadacao;
  gravata_label?: GravataLabel;
  gravata_recado?: string;
  /** Valores sugeridos de contribuição na tela da Gravata, cadastrados livremente pelos noivos. */
  gravata_valores_sugeridos?: number[];
  /** individual: noivos cadastram cada convite. link_unico: convidados se auto-cadastram. */
  modo_convite?: ModoConvite;
  pix_chave?: string;
  pix_banco?: string;
  pix_nome?: string;
  pix_tipo?: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  whatsapp_template?: string;
  historia_titulo?: string;
  historia_subtitulo?: string;
  historia_texto?: string;
  noiva_bio?: string;
  noivo_bio?: string;
  noiva_foto_url?: string;
  noivo_foto_url?: string;
  hero_images?: string[];
  hero_videos?: string[];
  historia_conclusao?: string;
  noivos_conclusao?: string;
  bg_primary?: string;
  text_main?: string;
  accent_color?: string;
  font_cursive?: string;
  font_serif?: string;
  animacao_tipo?: 'padrao' | 'envelope_v3' | 'cinematic' | 'flower_wind' | 'flower_wind_2';
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface AgendaEvent {
  id: string;
  evento_id: string;
  titulo: string;
  horario: string;
  local_nome: string;
  endereco: string;
  link_google_maps?: string;
  link_waze?: string;
  icone?: string;
  ordem?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DatabaseRPCs {
  reservar_presente_v1: {
    Args: {
      p_presente_id: string;
      p_url_comprovante: string;
      p_convite_id?: string;
      p_convidado_nome?: string;
    };
    Returns: { success: boolean; message: string };
  };
  reservar_multiplos_presentes_v1: {
    Args: {
      p_presentes_ids: string[];
      p_url_comprovante: string;
      p_convite_id?: string;
      p_evento_id?: string;
      p_convidado_nome?: string;
      p_mensagem?: string;
    };
    Returns: { success: boolean; message: string };
  };
  reservar_cotas_presente: {
    Args: {
      p_presente_id: string;
      p_convite_id: string;
      p_session_id: string;
      p_quantidade_solicitada: number;
    };
    Returns: boolean;
  };
}

export interface MuralItem {
  id: string;
  evento_id: string;
  tipo: 'FOTO' | 'MENSAGEM' | 'HIBRIDO' | 'VIDEO';
  url_midia?: string;
  mensagem?: string;
  autor?: string;
  aprovado: boolean;
  criado_em?: string;
}
