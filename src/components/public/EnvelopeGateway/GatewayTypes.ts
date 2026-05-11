export interface GatewayProps {
  slug: string;
  bgPrimary?: string;
  textMain?: string;
  accentColor?: string;
  coupleNoiva?: string;
  coupleNoivo?: string;
  date?: string;
  rawDate?: string;
  fontCursive?: string;
  fontSerif?: string;
  heroImages?: string[];
  onComplete: () => void;
}
