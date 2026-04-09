/**
 * Gera o payload do PIX Estático (Copia e Cola) seguindo o padrão EMV (Banco Central do Brasil)
 */

export function generatePixPayload(
  chave: string = '',
  nome: string = 'CASAMENTO',
  tipo: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria' = 'cpf',
  cidade: string = 'SAO PAULO',
  valor?: number,
  idTransacao: string = '***'
): string {
  if (!chave) return '';
  
  const cleanChave = formatKeyByType(chave, tipo || 'cpf');
  const cleanNome = cleanString(nome || 'CASAMENTO').substring(0, 25);
  const cleanCidade = cleanString(cidade || 'SAO PAULO').substring(0, 15);
  const cleanId = (idTransacao || '***').replace(/\s+/g, '').substring(0, 25) || '***';

  const formatField = (id: string, value: string): string => {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  };

  // 1. Merchant Account Information (ID 26)
  const gui = formatField('00', 'br.gov.bcb.pix');
  const key = formatField('01', cleanChave);
  const merchantAccountInfo = formatField('26', `${gui}${key}`);

  // 2. Montagem dos campos base
  const payloadParts = [
    formatField('00', '01'), // Payload Format Indicator
    merchantAccountInfo,
    formatField('52', '0000'), // Merchant Category Code
    formatField('53', '986'), // Currency (BRL)
  ];

  if (valor && valor > 0) {
    payloadParts.push(formatField('54', valor.toFixed(2))); // Amount
  }

  payloadParts.push(
    formatField('58', 'BR'), // Country Code
    formatField('59', cleanNome), // Merchant Name
    formatField('60', cleanCidade), // Merchant City
    formatField('62', formatField('05', cleanId)), // TxID
    '6304' // CRC16 Indicator (Tag 63, Length 04)
  );

  const payloadSemCRC = payloadParts.join('');
  return `${payloadSemCRC}${calculateCRC16(payloadSemCRC)}`;
}

/**
 * Formata a chave PIX de acordo com o tipo escolhido
 */
function formatKeyByType(chave: string, tipo: string): string {
  const raw = chave.trim();
  
  switch (tipo) {
    case 'email':
      return raw.toLowerCase();
    
    case 'telefone':
      const phoneDigits = raw.replace(/\D/g, '');
      // Garante o +55 no início
      if (phoneDigits.length === 10 || phoneDigits.length === 11) {
        return `+55${phoneDigits}`;
      }
      if (phoneDigits.startsWith('55') && phoneDigits.length > 11) {
        return `+${phoneDigits}`;
      }
      return `+${phoneDigits}`;

    case 'cpf':
    case 'cnpj':
      return raw.replace(/\D/g, ''); // Apenas números para CPF/CNPJ

    case 'aleatoria':
    default:
      return raw;
  }
}

/**
 * Limpa string para o padrão ASCII do PIX (Letras, números e espaços)
 */
function cleanString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^A-Z0-9\s]/gi, '') // Mantém apenas letras, números e espaços
    .replace(/\s+/g, ' ') // Remove espaços duplos
    .trim()
    .toUpperCase();
}

/**
 * Cálculo do CRC16 CCITT-FALSE (Polinômio 0x1021, Init 0xFFFF)
 */
function calculateCRC16(data: string): string {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < data.length; i++) {
    const byte = data.charCodeAt(i);
    crc ^= (byte << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}
