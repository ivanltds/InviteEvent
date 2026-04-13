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
  nome: string;
  confirmado: boolean | null;
  created_at?: string;
  updated_at?: string;
}

export interface RSVP {
  id: string;
  convite_id: string;
  confirmados: number;
  restricoes?: string;
  mensagem?: string;
  telefone?: string;
  status: RSVPStatus | string;
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
  status: 'disponivel' | 'reservado' | 'esgotado';
  quantidade_total: number;
  quantidade_reservada: number;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface Comprovante {
  id: string;
  presente_id: string;
  convite_id?: string;
  convidado_nome: string;
  url_comprovante: string;
  created_at?: string;
}

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
  historia_conclusao?: string;
  noivos_conclusao?: string;
  bg_primary?: string;
  text_main?: string;
  accent_color?: string;
  font_cursive?: string;
  font_serif?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

