/**
 * STORY-057: Catálogo de Fontes Premium para o Font Picker
 * Suporta fontes cursivas exageradas/dramáticas conforme pedido do stakeholder.
 */

export type FontCategory = 'ultra-dramatic' | 'dramatic' | 'moderate' | 'vintage';

export interface FontOption {
  name: string;
  googleFamily: string;  // URL-encoded para uso direto na Google Fonts API
  category: FontCategory;
  cssValue: string;      // Valor pronto para uso em CSS font-family
}

export const CURSIVE_FONTS: FontOption[] = [
  // Ultra-dramáticas — para quem quer impacto máximo
  { name: 'Corinthia', googleFamily: 'Corinthia', category: 'ultra-dramatic', cssValue: "'Corinthia', cursive" },
  { name: '주시경', googleFamily: 'Nanum+Pen+Script', category: 'ultra-dramatic', cssValue: "'Nanum Pen Script', cursive" },

  // Dramáticas — o sweet spot: elegantes e expressivas
  { name: 'Pinyon Script', googleFamily: 'Pinyon+Script', category: 'dramatic', cssValue: "'Pinyon Script', cursive" },
  { name: 'Great Vibes', googleFamily: 'Great+Vibes', category: 'dramatic', cssValue: "'Great Vibes', cursive" },
  { name: 'Alex Brush', googleFamily: 'Alex+Brush', category: 'dramatic', cssValue: "'Alex Brush', cursive" },
  { name: 'Playlist Script', googleFamily: 'Birthstone', category: 'dramatic', cssValue: "'Birthstone', cursive" },
  { name: 'Ruthie', googleFamily: 'Ruthie', category: 'dramatic', cssValue: "'Ruthie', cursive" },
  { name: 'Euphoria Script', googleFamily: 'Euphoria+Script', category: 'dramatic', cssValue: "'Euphoria Script', cursive" },

  // Moderadas — elegantes sem exagero
  { name: 'Dancing Script', googleFamily: 'Dancing+Script', category: 'moderate', cssValue: "'Dancing Script', cursive" },
  { name: 'Sacramento', googleFamily: 'Sacramento', category: 'moderate', cssValue: "'Sacramento', cursive" },
  { name: 'Satisfy', googleFamily: 'Satisfy', category: 'moderate', cssValue: "'Satisfy', cursive" },
  { name: 'Pacifico', googleFamily: 'Pacifico', category: 'moderate', cssValue: "'Pacifico', cursive" },

  // Vintage — remetem a manuscritos históricos
  { name: 'Herr Von Muellerhoff', googleFamily: 'Herr+Von+Muellerhoff', category: 'vintage', cssValue: "'Herr Von Muellerhoff', cursive" },
  { name: 'Meddon', googleFamily: 'Meddon', category: 'vintage', cssValue: "'Meddon', cursive" },
];

export const SERIF_FONTS: FontOption[] = [
  { name: 'Cormorant Garamond', googleFamily: 'Cormorant+Garamond:ital,wght@0,400;0,600;1,400', category: 'moderate', cssValue: "'Cormorant Garamond', serif" },
  { name: 'Playfair Display', googleFamily: 'Playfair+Display:ital,wght@0,400;0,700;1,400', category: 'moderate', cssValue: "'Playfair Display', serif" },
  { name: 'EB Garamond', googleFamily: 'EB+Garamond:ital,wght@0,400;1,400', category: 'moderate', cssValue: "'EB Garamond', serif" },
  { name: 'Lora', googleFamily: 'Lora:ital,wght@0,400;0,600;1,400', category: 'moderate', cssValue: "'Lora', serif" },
  { name: 'Merriweather', googleFamily: 'Merriweather:ital,wght@0,300;0,400;1,300', category: 'moderate', cssValue: "'Merriweather', serif" },
  { name: 'Crimson Text', googleFamily: 'Crimson+Text:ital,wght@0,400;0,600;1,400', category: 'moderate', cssValue: "'Crimson Text', serif" },
  { name: 'Libre Baskerville', googleFamily: 'Libre+Baskerville:ital,wght@0,400;0,700;1,400', category: 'moderate', cssValue: "'Libre Baskerville', serif" },
  { name: 'Gentium Plus', googleFamily: 'Gentium+Plus:ital@0;1', category: 'moderate', cssValue: "'Gentium Plus', serif" },
];

/**
 * Gera URL do Google Fonts com preview otimizado e font-display:swap.
 * O parâmetro `text` faz com que o Google sirva apenas os glifos necessários
 * para o preview, reduzindo o tamanho da fonte carregada ~90%.
 */
export function getFontUrl(googleFamily: string, previewText: string): string {
  const encodedText = encodeURIComponent(previewText);
  return `https://fonts.googleapis.com/css2?family=${googleFamily}&text=${encodedText}&display=swap`;
}

/**
 * Retorna o label de categoria para exibição amigável na UI.
 */
export function getCategoryLabel(category: FontCategory): string {
  const labels: Record<FontCategory, string> = {
    'ultra-dramatic': '✦ Ultra Dramática',
    'dramatic': '★ Dramática',
    'moderate': 'Elegante',
    'vintage': 'Vintage',
  };
  return labels[category];
}
