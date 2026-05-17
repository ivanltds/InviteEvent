import React from 'react';

export type TemplateId = 
  | 'classic' | 'polaroid' | 'golden' | 'minimal' | 'magazine' | 'floral' 
  | 'gatsby' | 'party' | 'retro' | 'initials' | 'frame' | 'split' 
  | 'diamond' | 'zen' | 'chateau' | 'stardust' | 'mono' | 'sunset' 
  | 'vineyard' | 'symphony' | 'champagne' | 'lace' | 'minimal-alt' | 'luxury';

export interface Template {
  id: TemplateId;
  name: string;
  icon: React.ReactNode;
  renderOverlay: (coupleNames: string, eventDate: string) => React.ReactNode;
}

// Helper to format dates beautifully in various template styles
const formatEventDate = (dateStr: string, style: 'dot' | 'full' | 'short' | 'stamp' | 'split' | 'default') => {
  if (!dateStr) return '';
  
  // Parse date formatted as DD/MM/YYYY, DD.MM.YYYY, or DD-MM-YYYY
  let parts = dateStr.split('/').map(s => s.trim());
  if (parts.length !== 3) {
    parts = dateStr.split('.').map(s => s.trim());
  }
  if (parts.length !== 3) {
    parts = dateStr.split('-').map(s => s.trim());
  }
  
  let day = 12;
  let monthIndex = 9; // October (0-indexed is 9)
  let year = 2026;
  
  if (parts.length === 3 && !isNaN(parseInt(parts[0], 10)) && !isNaN(parseInt(parts[1], 10)) && !isNaN(parseInt(parts[2], 10))) {
    day = parseInt(parts[0], 10);
    monthIndex = parseInt(parts[1], 10) - 1;
    year = parseInt(parts[2], 10);
  } else {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      day = d.getDate();
      monthIndex = d.getMonth();
      year = d.getFullYear();
    }
  }

  const monthsFull = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ];
  
  const monthsShort = [
    'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
    'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'
  ];

  const monthsCapitalized = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const pad = (num: number) => String(num).padStart(2, '0');

  switch (style) {
    case 'dot':
      return `${pad(day)} . ${pad(monthIndex + 1)} . ${year}`;
    case 'full':
      return `${day} DE ${monthsFull[monthIndex]} DE ${year}`;
    case 'short':
      return `${day} ${monthsShort[monthIndex]} ${year}`;
    case 'stamp':
      return `${monthsShort[monthIndex]} ${pad(day)} ${String(year).slice(-2)}`;
    case 'split':
      return `${day} de ${monthsCapitalized[monthIndex]} de ${year}`;
    default:
      return `${pad(day)}/${pad(monthIndex + 1)}/${year}`;
  }
};

const getInitials = (names: string) => {
  if (!names) return 'A&P';
  const parts = names.split(/[&+]/).map(s => s.trim());
  if (parts.length >= 2) {
    return `${parts[0].charAt(0).toUpperCase()}&${parts[1].charAt(0).toUpperCase()}`;
  }
  const words = names.split(' ').map(s => s.trim());
  if (words.length >= 2) {
    return `${words[0].charAt(0).toUpperCase()}&${words[1].charAt(0).toUpperCase()}`;
  }
  return names.slice(0, 3).toUpperCase();
};

export const storyTemplates: Template[] = [
  {
    id: 'classic',
    name: 'Classic',
    icon: <svg viewBox="0 0 24 24"><path d="M3 21h18M3 7v10M21 7v10M3 7l9-4 9 4"/></svg>,
    renderOverlay: (names, date) => (
      <>
        <h3 className="shd">{names}</h3>
        <p className="shd">{formatEventDate(date, 'dot')}</p>
      </>
    )
  },
  {
    id: 'polaroid',
    name: 'Polaroid',
    icon: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 18h18"/></svg>,
    renderOverlay: (names, date) => (
      <>
        <h3>{names}</h3>
        <p>{formatEventDate(date, 'full')}</p>
      </>
    )
  },
  {
    id: 'golden',
    name: 'Golden',
    icon: <svg viewBox="0 0 24 24"><path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z"/></svg>,
    renderOverlay: (names, date) => (
      <>
        <h3>{names}</h3>
        <p>{formatEventDate(date, 'dot')}</p>
      </>
    )
  },
  {
    id: 'minimal',
    name: 'Minimal',
    icon: <svg viewBox="0 0 24 24"><path d="M3 3h18v18H3zM9 9h6v6H9z"/></svg>,
    renderOverlay: (names) => (
      <>
        <h3>{names}</h3>
        <p>PARA SEMPRE JUNTOS</p>
      </>
    )
  },
  {
    id: 'magazine',
    name: 'Revista',
    icon: <svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 7H20"/></svg>,
    renderOverlay: (names) => (
      <>
        <div className="mag-header"><h2>CASAMENTO</h2></div>
        <div className="mag-footer"><h3>{names}</h3><p>Edição Especial de Luxo</p></div>
      </>
    )
  },
  {
    id: 'floral',
    name: 'Floral',
    icon: <svg viewBox="0 0 24 24"><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>,
    renderOverlay: (names, date) => (
      <>
        <div className="floral-icon f-top">✿</div>
        <div className="floral-icon f-bottom">✿</div>
        <h3>{names}</h3>
        <p>{formatEventDate(date, 'dot')}</p>
      </>
    )
  },
  {
    id: 'gatsby',
    name: 'Gatsby',
    icon: <svg viewBox="0 0 24 24"><path d="M2 7l10-5 10 5-10 5zM2 17l10-5 10 5-10 5z"/></svg>,
    renderOverlay: (names, date) => (
      <>
        <h3>{names.toUpperCase()}</h3>
        <p>{formatEventDate(date, 'short')}</p>
      </>
    )
  },
  {
    id: 'party',
    name: 'Neon',
    icon: <svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
    renderOverlay: (names) => (
      <>
        <h3>{names.toUpperCase()}</h3>
        <p>NOITE INESQUECÍVEL</p>
      </>
    )
  },
  {
    id: 'retro',
    name: 'Retro',
    icon: <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h20"/></svg>,
    renderOverlay: (names, date) => (
      <>
        <div className="stamp">{formatEventDate(date, 'stamp')}</div>
        <div className="info"><h3>{names}</h3></div>
      </>
    )
  },
  {
    id: 'initials',
    name: 'Initials',
    icon: <svg viewBox="0 0 24 24"><path d="M4 20l4-12 4 12M4 14h8"/></svg>,
    renderOverlay: (names) => (
      <>
        <div className="big-char">{getInitials(names)}</div>
        <h3>{names.toUpperCase()}</h3>
      </>
    )
  },
  {
    id: 'frame',
    name: 'Frame',
    icon: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 14l5-5 10 10"/></svg>,
    renderOverlay: (names) => (
      <div className="tag">{names}</div>
    )
  },
  {
    id: 'split',
    name: 'Split',
    icon: <svg viewBox="0 0 24 24"><path d="M12 2v20M2 12h20"/></svg>,
    renderOverlay: (names, date) => {
      const parts = names.split('&');
      return (
        <>
          <h3>{parts[0]}<br/>&<br/>{parts[1] || ''}</h3>
          <p>{formatEventDate(date, 'split')}</p>
        </>
      );
    }
  },
  {
    id: 'diamond',
    name: 'Diamond',
    icon: <svg viewBox="0 0 24 24"><path d="M12 2l10 10-10 10-10-10z"/></svg>,
    renderOverlay: (names) => (
      <div className="d-box"><h3>{names}</h3></div>
    )
  },
  {
    id: 'zen',
    name: 'Zen',
    icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>,
    renderOverlay: (names) => (
      <div className="z-circle"><h3>{names}</h3></div>
    )
  },
  {
    id: 'chateau',
    name: 'Chateau',
    icon: <svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V7l7-4 7 4v14"/></svg>,
    renderOverlay: (names) => (
      <>
        <div className="arch"></div>
        <h3>{names}</h3>
      </>
    )
  },
  {
    id: 'stardust',
    name: 'Stardust',
    icon: <svg viewBox="0 0 24 24"><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M19 5l-2 2M7 17l-2 2M19 19l-2-2M7 7L5 5"/></svg>,
    renderOverlay: (names) => (
      <h3>{names}</h3>
    )
  },
  {
    id: 'mono',
    name: 'Mono',
    icon: <svg viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3L3 21"/></svg>,
    renderOverlay: (names) => (
      <h3>{getInitials(names)}</h3>
    )
  },
  {
    id: 'sunset',
    name: 'Sunset',
    icon: <svg viewBox="0 0 24 24"><path d="M12 2v2M4.9 4.9l1.4 1.4M2 12h2M4.9 19.1l1.4-1.4M12 20v2M17.7 17.7l1.4 1.4M22 12h-2M17.7 6.3l1.4-1.4"/></svg>,
    renderOverlay: () => (
      <h3>FIM DE TARDE</h3>
    )
  },
  {
    id: 'vineyard',
    name: 'Vineyard',
    icon: <svg viewBox="0 0 24 24"><path d="M12 2L4 7v10l8 5 8-5V7z"/></svg>,
    renderOverlay: (names) => (
      <div className="v-frame"><h3>{names}</h3></div>
    )
  },
  {
    id: 'symphony',
    name: 'Symphony',
    icon: <svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13M9 10l12-2"/></svg>,
    renderOverlay: (names) => (
      <>
        <h3>{names}</h3>
        <div className="line"></div>
      </>
    )
  },
  {
    id: 'champagne',
    name: 'Cheers',
    icon: <svg viewBox="0 0 24 24"><path d="M18 3H6L8 15h8zM12 15v7M8 21h8"/></svg>,
    renderOverlay: () => (
      <h3>UM BRINDE!</h3>
    )
  },
  {
    id: 'lace',
    name: 'Lace',
    icon: <svg viewBox="0 0 24 24"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/></svg>,
    renderOverlay: (names) => (
      <div className="inner-frame"><h3>{names}</h3></div>
    )
  },
  {
    id: 'minimal-alt',
    name: 'Clean',
    icon: <svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>,
    renderOverlay: (names) => (
      <h3>{names}</h3>
    )
  },
  {
    id: 'luxury',
    name: 'Luxury',
    icon: <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5zM2 17l10 5 10-5"/></svg>,
    renderOverlay: (names) => (
      <h3>{names}</h3>
    )
  }
];
