/**
 * Calcula a cor de contraste ideal (preto ou branco) para uma cor de fundo dada.
 */
export const getContrastColor = (hexcolor: string) => {
  if (!hexcolor) return '#ffffff';
  hexcolor = hexcolor.replace('#', '');
  if (hexcolor.length === 3) {
    hexcolor = hexcolor.split('').map(c => c + c).join('');
  }
  if (hexcolor.length !== 6) return '#ffffff';
  
  const r = parseInt(hexcolor.substring(0, 2), 16);
  const g = parseInt(hexcolor.substring(2, 4), 16);
  const b = parseInt(hexcolor.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#1a1a1a' : '#ffffff';
};

/**
 * Garante que uma cor de texto seja legível contra um fundo (Fórmula de Luminância).
 * Se o ratio for < 3 (critério mínimo), retorna fallback legível.
 */
export const getLegibleText = (bgHex: string, textHex: string) => {
  const getLuminance = (hex: string) => {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length !== 6) return 0.5;
    
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    const a = [r, g, b].map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  try {
    const lum1 = getLuminance(bgHex);
    const lum2 = getLuminance(textHex);
    const ratio = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);

    if (ratio < 3) {
      return lum1 > 0.5 ? '#1a1a1a' : '#ffffff';
    }
    return textHex;
  } catch (e) {
    return textHex;
  }
};
