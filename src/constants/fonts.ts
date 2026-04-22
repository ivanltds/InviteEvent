export interface Font {
  code: string;
  name: string;
  cursiveValue: string;
  serifValue: string;
  sample: string;
  description: string;
  googleFamily: string;
  category: 'dramatic' | 'ultra-dramatic' | 'moderate' | 'vintage';
}

export const CURSIVE_FONTS: Font[] = [
  {
    code: 'PINYON',
    name: 'Pinyon Script',
    cursiveValue: "'Pinyon Script', cursive",
    serifValue: "'Playfair Display', serif",
    sample: 'Layslla & Marcus',
    description: 'Caligrafia clássica — elegância pura',
    googleFamily: 'Pinyon+Script|Playfair+Display',
    category: 'ultra-dramatic'
  },
  {
    code: 'GREAT_VIBES',
    name: 'Great Vibes',
    cursiveValue: "'Great Vibes', cursive",
    serifValue: "'Cormorant Garamond', serif",
    sample: 'Layslla & Marcus',
    description: 'Fluida e moderna — leveza romântica',
    googleFamily: 'Great+Vibes|Cormorant+Garamond',
    category: 'ultra-dramatic'
  },
  {
    code: 'ALEX_BRUSH',
    name: 'Alex Brush',
    cursiveValue: "'Alex Brush', cursive",
    serifValue: "'EB Garamond', serif",
    sample: 'Layslla & Marcus',
    description: 'Pincelada artesanal — intimidade chique',
    googleFamily: 'Alex+Brush|EB+Garamond',
    category: 'dramatic'
  },
  {
    code: 'DANCING',
    name: 'Dancing Script',
    cursiveValue: "'Dancing Script', cursive",
    serifValue: "'Roboto', serif",
    sample: 'Layslla & Marcus',
    description: 'Casual e amigável',
    googleFamily: 'Dancing+Script|Roboto',
    category: 'moderate'
  },
  {
    code: 'PARISIENNE',
    name: 'Parisienne',
    cursiveValue: "'Parisienne', cursive",
    serifValue: "'Lora', serif",
    sample: 'Layslla & Marcus',
    description: 'Vintage e sofisticado',
    googleFamily: 'Parisienne|Lora',
    category: 'vintage'
  },
  {
    code: 'ALLURA',
    name: 'Allura',
    cursiveValue: "'Allura', cursive",
    serifValue: "'Montserrat', serif",
    sample: 'Layslla & Marcus',
    description: 'Limpa e estilizada',
    googleFamily: 'Allura|Montserrat',
    category: 'moderate'
  },
  {
    code: 'ROCHESTER',
    name: 'Rochester',
    cursiveValue: "'Rochester', cursive",
    serifValue: "'Arvo', serif",
    sample: 'Layslla & Marcus',
    description: 'Estilo vitoriano elegante',
    googleFamily: 'Rochester|Arvo',
    category: 'vintage'
  },
  {
    code: 'PETIT_FORMAL',
    name: 'Petit Formal Script',
    cursiveValue: "'Petit Formal Script', cursive",
    serifValue: "'Crimson Text', serif",
    sample: 'Layslla & Marcus',
    description: 'Formalidade impecável',
    googleFamily: 'Petit+Formal+Script|Crimson+Text',
    category: 'dramatic'
  },
  {
    code: 'SACRAMENTO',
    name: 'Sacramento',
    cursiveValue: "'Sacramento', cursive",
    serifValue: "'Alice', serif",
    sample: 'Layslla & Marcus',
    description: 'Handwriting dos anos 50',
    googleFamily: 'Sacramento|Alice',
    category: 'moderate'
  },
  {
    code: 'WINDSOR',
    name: 'WindSong',
    cursiveValue: "'WindSong', cursive",
    serifValue: "'Cinzel', serif",
    sample: 'Layslla & Marcus',
    description: 'Expressiva artística',
    googleFamily: 'WindSong|Cinzel',
    category: 'dramatic'
  }
];

export const SERIF_FONTS = [
  { name: 'Cormorant Garamond', googleFamily: 'Cormorant+Garamond' },
  { name: 'Playfair Display', googleFamily: 'Playfair+Display' },
  { name: 'EB Garamond', googleFamily: 'EB+Garamond' },
  { name: 'Lora', googleFamily: 'Lora' },
  { name: 'Merriweather', googleFamily: 'Merriweather' },
  { name: 'Libre Baskerville', googleFamily: 'Libre+Baskerville' }
];

export function getFontUrl(family: string, text: string): string {
  const encodedText = encodeURIComponent(text);
  return `https://fonts.googleapis.com/css2?family=${family}&display=swap&text=${encodedText}`;
}
