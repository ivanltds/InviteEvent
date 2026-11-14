'use client';

/* eslint-disable @next/next/no-img-element -- fotos ilustrativas do Unsplash (decorativas/stand-in), servidas direto do CDN deles */
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Alex_Brush, Corinthia, Great_Vibes, Hanken_Grotesk, Instrument_Serif, Pinyon_Script, Playfair_Display } from 'next/font/google';
import { formatWeddingDate, mountLanding, OPENINGS, pickOpening, type CoupleState } from './landingMotion';
import './landing.css';

const hanken = Hanken_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-hanken' });
const instrument = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-instrument' });
const greatVibes = Great_Vibes({ subsets: ['latin'], weight: '400', variable: '--font-greatvibes' });
const alexBrush = Alex_Brush({ subsets: ['latin'], weight: '400', variable: '--font-alexbrush' });
const corinthia = Corinthia({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-corinthia' });
// Pinyon/Playfair próprios: o DynamicStyles global sobrescreve --font-pinyon/--font-playfair no :root
const pinyon = Pinyon_Script({ subsets: ['latin'], weight: '400', variable: '--lp-pinyon' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--lp-playfair' });
const fontVars = [hanken, instrument, greatVibes, alexBrush, corinthia, pinyon, playfair].map(f => f.variable).join(' ');

const DEFAULT_COUPLE: CoupleState = { n1: 'Lia', n2: 'Tomás', date: '2027-04-18' };

/**
 * Landing Celebraê (proposta aprovada em docs/wireframes/landing-celebrae-taste-v2.html).
 * O hero é um convite real em tela cheia; o casal escreve os nomes e a data e
 * a página inteira passa a mostrar o convite deles.
 */
export default function CelebraeLanding() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [couple, setCouple] = useState<CoupleState>(DEFAULT_COUPLE);
  const coupleRef = useRef(couple);
  const motionRef = useRef<ReturnType<typeof mountLanding> | null>(null);

  const update = (key: keyof CoupleState, value: string) =>
    setCouple(prev => ({ ...prev, [key]: key === 'date' ? value : value.replace(/^\s+/, '') }));

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const opening = pickOpening(window.location.search);
    const label = root.querySelector('#openingName');
    if (label) label.textContent = OPENINGS[opening];
    const motion = mountLanding(root, () => coupleRef.current, opening);
    motionRef.current = motion;
    return () => {
      motion.destroy();
      motionRef.current = null;
    };
  }, []);

  useEffect(() => {
    coupleRef.current = couple;
    motionRef.current?.refresh();
  }, [couple]);

  const n1 = couple.n1.trim() || 'Noiva';
  const n2 = couple.n2.trim() || 'Noivo';
  const dateText = formatWeddingDate(couple.date);
  // /criar ainda não lê esses parâmetros; ficam prontos para pré-preencher o cadastro.
  const createHref = useMemo(
    () => `/criar?${new URLSearchParams({ nome1: couple.n1.trim(), nome2: couple.n2.trim(), data: couple.date })}`,
    [couple],
  );

  return (
    <div ref={rootRef} className={`lp ${fontVars}`}>
      <a className="skip" href="#conteudo">Pular para o conteúdo</a>
      
      <header className="nav" id="nav">
        <div className="wrap">
          <a href="#topo" className="mark" aria-label="Celebraê, início">Celebra<span>ê</span></a>
          <nav className="nav__links" aria-label="Seções">
            <a href="#aberturas">Aberturas</a><a href="#site">O site</a><a href="#presenca">Presença</a><a href="#presentes">Presentes</a><a href="#mural">Mural</a>
          </nav>
          <div className="nav__cta">
            <Link href="/admin/login" className="link">Entrar</Link>
            <Link href={createHref} className="btn btn--primary">Criar meu convite</Link>
            <button className="menu-btn" aria-expanded="false" aria-controls="menu" aria-label="Abrir menu"><span></span></button>
          </div>
        </div>
      </header>
      <div className="mobile-menu" id="menu">
        <a href="#aberturas">Aberturas</a><a href="#site">O site</a><a href="#presenca">Presença</a><a href="#presentes">Presentes</a><a href="#mural">Mural</a><Link href="/admin/login">Entrar</Link>
        <Link href={createHref} className="btn btn--primary">Criar meu convite</Link>
      </div>
      
      <main id="conteudo">
      
      
      <section className="hero pre" id="topo" data-enter="" aria-label="Convite de exemplo">
        <div className="inv">
          <div className="inv__bg" aria-hidden="true">
            
            <img className="desk on" src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=2000&q=75" alt="" />
            <img className="desk" src="https://images.unsplash.com/photo-1460978812857-470ed1c77af0?auto=format&fit=crop&w=2000&q=75" alt="" loading="lazy" />
            
            <video className="vid on" autoPlay muted loop playsInline preload="metadata" poster="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=900&q=70">
              <source src="/videos/8502799-uhd_2160_3840_24fps.mp4" type="video/mp4" />
            </video>
          </div>
          <div className="inv__content">
            <p className="inv__names"><span>{n1}</span> &amp; <span>{n2}</span></p>
            <p className="inv__date">{dateText}</p>
            <div className="inv__count" data-count aria-hidden="true"><div><b>0</b><small>dias</small></div><div><b>0</b><small>horas</small></div><div><b>0</b><small>min</small></div><div><b>0</b><small>seg</small></div></div>
            <p className="inv__tag">O nosso grande dia está chegando!</p>
            <div className="inv__cta">
              <a href="#presenca" className="inv__btn inv__btn--p">Confirmar presença</a>
              <a href="#presentes" className="inv__btn inv__btn--s">Lista de presentes</a>
            </div>
          </div>
        </div>
      
        <a href="#aberturas" className="example-tag"><i />Convite feito na Celebraê · abertura <b id="openingName">Pétalas ao Vento</b></a>
        <div className="wind" id="wind" aria-hidden="true"></div>
        <button className="skip-intro" id="skipIntro">Pular abertura</button>
      
        <div className="sheet" id="sheet">
          <div className="sheet__intro">
            <h1>Convite de casamento digital, <em>com site, presença e presentes</em>.</h1>
            <p className="sheet__facts"><b>Grátis</b> para começar · <b>5</b> aberturas animadas</p>
          </div>
          <button className="sheet__toggle" id="sheetToggle" aria-expanded="false" aria-controls="sheetForm">Ver com os nomes de vocês <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg></button>
          <form className="sheet__form" id="sheetForm" onSubmit={e => e.preventDefault()}>
            <div className="names">
              <div className="field"><label htmlFor="n1">Nome</label><input id="n1" value={couple.n1} onChange={e => update('n1', e.target.value)} maxLength={18} autoComplete="off" /></div>
              <span className="amp" aria-hidden="true">&amp;</span>
              <div className="field"><label htmlFor="n2">Nome</label><input id="n2" value={couple.n2} onChange={e => update('n2', e.target.value)} maxLength={18} autoComplete="off" /></div>
              <div className="field field--date"><label htmlFor="dt">Data do casamento</label><input id="dt" type="date" value={couple.date} onChange={e => update('date', e.target.value)} /></div>
            </div>
          </form>
          <Link href={createHref} className="btn btn--primary">Criar meu convite <span className="arr" aria-hidden="true">→</span></Link>
          <p className="sheet__hint">Escrevam os nomes de vocês: o convite muda na hora, nesta página inteira.</p>
        </div>
      </section>
      
      
      <section id="aberturas" aria-labelledby="ab-h">
        <div className="wrap open-grid">
          <div className="open-copy">
            <p className="eyebrow">Abertura do convite</p>
            <h2 id="ab-h">Cinco aberturas para o primeiro toque. <span className="muted">Escolha uma e veja tocar.</span></h2>
            <p className="lead">É o que o convidado vê ao abrir o link, antes da capa. Vocês trocam a abertura no painel quando quiserem, sem reenviar nada.</p>
            <div className="tabs" role="tablist" aria-label="Aberturas do convite">
              <button className="tab" role="tab" aria-selected="false" data-demo="trad"><span className="tab__n">01</span><span><span className="tab__name">Tradicional</span><span className="tab__desc">O cartão aparece limpo, como no papel.</span></span><span className="tab__play"><svg viewBox="0 0 10 12"><path d="M0 0l10 6-10 6z"/></svg></span></button>
              <button className="tab" role="tab" aria-selected="false" data-demo="env"><span className="tab__n">02</span><span><span className="tab__name">Envelope 3D</span><span className="tab__desc">O selo se solta e a carta sobe do envelope.</span></span><span className="tab__play"><svg viewBox="0 0 10 12"><path d="M0 0l10 6-10 6z"/></svg></span></button>
              <button className="tab" role="tab" aria-selected="false" data-demo="cine"><span className="tab__n">03</span><span><span className="tab__name">Cinematic Spark</span><span className="tab__desc">Um risco de luz no escuro revela os nomes.</span></span><span className="tab__play"><svg viewBox="0 0 10 12"><path d="M0 0l10 6-10 6z"/></svg></span></button>
              <button className="tab" role="tab" aria-selected="true" data-demo="pet"><span className="tab__n">04</span><span><span className="tab__name">Pétalas ao Vento</span><span className="tab__desc">Pétalas caem pela tela antes do convite.</span></span><span className="tab__play"><svg viewBox="0 0 10 12"><path d="M0 0l10 6-10 6z"/></svg></span></button>
              <button className="tab" role="tab" aria-selected="false" data-demo="pet2"><span className="tab__n">05</span><span><span className="tab__name">Pétalas ao Vento 2</span><span className="tab__desc">Folhas atravessam a tela com o vento.</span></span><span className="tab__play"><svg viewBox="0 0 10 12"><path d="M0 0l10 6-10 6z"/></svg></span></button>
            </div>
          </div>
          <div className="open-stage">
            <div className="phone" role="tabpanel" aria-label="Prévia da abertura"><div className="phone__screen"><div className="demo" id="demo"></div></div></div>
            <button className="replay" id="replay"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>Ver de novo</button>
          </div>
        </div>
      </section>
      
      
      <section id="site" aria-labelledby="site-h">
        <div className="wrap site-grid">
          <div className="site-copy">
            <p className="eyebrow">O site do casamento</p>
            <h2 id="site-h">O convite é também <em>o site de vocês</em>.</h2>
            <p className="lead">Depois da capa, o convidado rola e encontra tudo do dia. Role o celular ao lado e troquem cores e letra.</p>
            <ul className="parts">
              <li><span>i</span><div><b>Nossa história</b> e quem são os noivos</div></li>
              <li><span>ii</span><div><b>Agenda</b> da cerimônia e da recepção, com o mapa de cada lugar</div></li>
              <li><span>iii</span><div><b>Confirmação de presença</b> e perguntas frequentes</div></li>
              <li><span>iv</span><div><b>Ordem das seções</b> do jeito que vocês quiserem</div></li>
            </ul>
          </div>
      
          <div className="studio">
            <div className="phone">
              <div className="phone__screen">
                <div className="scroller" id="scroller" tabIndex={0} aria-label="Convite de exemplo, role para ver as seções">
                  <div className="inv">
                    <div className="inv__bg" aria-hidden="true"><img className="on" src="https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=700&q=70" alt="" /></div>
                    <p className="inv__names"><span>{n1}</span> &amp; <span>{n2}</span></p>
                    <p className="inv__date">{dateText}</p>
                    <div className="inv__count" data-count><div><b>0</b><small>dias</small></div><div><b>0</b><small>horas</small></div><div><b>0</b><small>min</small></div><div><b>0</b><small>seg</small></div></div>
                    <p className="inv__tag">O nosso grande dia está chegando!</p>
                    <div className="inv__cta"><span className="inv__btn inv__btn--p">Confirmar presença</span><span className="inv__btn inv__btn--s">Lista de presentes</span></div>
                  </div>
                  <div className="isec">
                    <h4>Nossa História</h4>
                    <p className="sub">O início de tudo</p>
                    <p>Nos conhecemos numa festa de aniversário, no meio de um assunto que não tinha nada a ver com a gente. Dez anos depois, aqui estamos.</p>
                    <p className="hl">Agora começa o capítulo mais bonito: e queremos vocês do nosso lado.</p>
                  </div>
                  <div className="isec isec--white">
                    <h4>Agenda</h4>
                    <p className="sub" style={{'textTransform': 'none', 'letterSpacing': '0', 'fontSize': '.82rem', 'color': '#666'} as React.CSSProperties}>Acompanhe cada momento do nosso grande dia</p>
                    <div className="tl">
                      <div className="tl-item"><span className="tl-time">16:00</span><div className="tl-card"><b>Cerimônia</b>Capela do Bosque<br /><span className="gps">Abrir no mapa</span></div></div>
                      <div className="tl-item"><span className="tl-time">18:00</span><div className="tl-card"><b>Recepção</b>Casa Jardim<br /><span className="gps">Abrir no mapa</span></div></div>
                    </div>
                  </div>
                </div>
                <span className="scroll-hint" id="scrollHint">Role o convite ↓</span>
              </div>
            </div>
      
            <div className="controls">
              <div>
                <span className="ctrl-label" id="lbl-cor">Cores</span>
                <div className="swatches" role="group" aria-labelledby="lbl-cor">
                  <button className="swatch" aria-pressed="true" data-bg="#fdfbf7" data-ink="#4a4a4a" data-acc="#C5A059"><span className="sw-dots"><i style={{'background': '#fdfbf7'} as React.CSSProperties}></i><i style={{'background': '#C5A059'} as React.CSSProperties}></i></span>Dourado</button>
                  <button className="swatch" aria-pressed="false" data-bg="#fbf5f0" data-ink="#4d3c36" data-acc="#b97a62"><span className="sw-dots"><i style={{'background': '#fbf5f0'} as React.CSSProperties}></i><i style={{'background': '#b97a62'} as React.CSSProperties}></i></span>Terracota</button>
                  <button className="swatch" aria-pressed="false" data-bg="#f5f7fa" data-ink="#3a4450" data-acc="#6f8aa6"><span className="sw-dots"><i style={{'background': '#f5f7fa'} as React.CSSProperties}></i><i style={{'background': '#6f8aa6'} as React.CSSProperties}></i></span>Azul</button>
                  <button className="swatch" aria-pressed="false" data-bg="#1a1917" data-ink="#efe8dc" data-acc="#C5A059"><span className="sw-dots"><i style={{'background': '#1a1917'} as React.CSSProperties}></i><i style={{'background': '#C5A059'} as React.CSSProperties}></i></span>Noite</button>
                </div>
                <p className="ctrl-note">No painel, qualquer cor de fundo, texto e destaque.</p>
              </div>
              <div>
                <span className="ctrl-label" id="lbl-fonte">Letra dos nomes</span>
                <div className="fonts" role="group" aria-labelledby="lbl-fonte">
                  <button className="font-opt" aria-pressed="true" data-font="var(--lp-pinyon), cursive" style={{'fontFamily': 'var(--lp-pinyon)'} as React.CSSProperties} aria-label="Pinyon Script">Lia</button>
                  <button className="font-opt" aria-pressed="false" data-font="var(--font-greatvibes), cursive" style={{'fontFamily': 'var(--font-greatvibes)'} as React.CSSProperties} aria-label="Great Vibes">Lia</button>
                  <button className="font-opt" aria-pressed="false" data-font="var(--font-alexbrush), cursive" style={{'fontFamily': 'var(--font-alexbrush)'} as React.CSSProperties} aria-label="Alex Brush">Lia</button>
                  <button className="font-opt" aria-pressed="false" data-font="var(--font-corinthia), cursive" style={{'fontFamily': 'var(--font-corinthia)', 'fontSize': '32px'} as React.CSSProperties} aria-label="Corinthia">Lia</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      
      <section id="presenca" aria-labelledby="pr-h">
        <div className="wrap">
          <div className="sec-head">
            <h2 id="pr-h">Lista de presença, <em>nome a nome</em>.</h2>
            <p className="lead">Cadastrem cada convidado com o limite de acompanhantes, ou mandem um link único e cada pessoa escreve o próprio nome. As respostas chegam no painel na hora.</p>
          </div>
          <div className="app" aria-label="Painel de convidados da Celebraê">
            <div className="app__bar"><i /><i /><i /><span>Painel · Convidados</span></div>
            <div className="app__body">
              <nav className="app__side" aria-hidden="true">
                <span className="mark">Celebra<span>ê</span></span>
                <a><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>Painel</a>
                <a className="on"><svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .7 3.2 2.5 3.6 5.2"/></svg>Convidados</a>
                <a><svg viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18"/></svg>Presentes</a>
                <a><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>Mural</a>
                <a><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>Agenda</a>
                <a><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>Configurações</a>
              </nav>
              <div className="app__main">
                <div className="app__top">
                  <h3>Convidados</h3>
                  <div className="seg" role="group" aria-label="Modo do convite">
                    <button aria-pressed="true" data-mode="ind">Convites individuais</button>
                    <button aria-pressed="false" data-mode="link">Link único</button>
                  </div>
                </div>
                <div className="stats">
                  <div className="stat"><small>Convidados</small><b>143</b></div><div className="stat"><small>Confirmados</small><b>92</b></div><div className="stat"><small>Pendentes</small><b>38</b></div><div className="stat"><small>Não vão</small><b>13</b></div>
                </div>
                <table className="table"><thead><tr><th id="col1">Convidado</th><th>Acompanhantes</th><th>Respondeu</th><th>Status</th></tr></thead><tbody id="rsvpRows"></tbody></table>
              </div>
            </div>
          </div>
          <div className="app-notes">
            <div><h3>Painel a dois</h3><p>Os dois noivos entram com a própria conta e mexem no mesmo evento.</p></div>
            <div><h3>E-mails prontos</h3><p>Modelos de mensagem para avisar os convidados, já com o link do convite.</p></div>
            <div><h3>Acompanhantes no limite</h3><p>Cada convite aceita só quantas pessoas vocês liberaram.</p></div>
          </div>
        </div>
      </section>
      
      
      <section id="presentes" aria-labelledby="gi-h">
        <div className="wrap">
          <div className="sec-head">
            <h2 id="gi-h">Lista de presentes <em>pelo Pix</em>.</h2>
            <p className="lead">O convidado escolhe o presente, copia o código Pix e paga no app do banco. O valor vai direto para a conta de vocês.</p>
          </div>
          <div className="gift-grid">
            <div className="gift-photo"><img src="https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1000&q=75" alt="Duas alianças douradas sobre papel de seda e flores secas" loading="lazy" /></div>
            <div className="gift-cards">
              <article className="card card--wide">
                <div><h3>Paga em segundos pelo celular</h3><p style={{'marginTop': '8px'} as React.CSSProperties}>QR Code para quem está no computador, código copia-e-cola para quem está no celular.</p></div>
                <div className="ui pix">
                  <div className="qr" id="qr" aria-hidden="true"></div>
                  <div><div className="f-line">Jogo de taças de cristal</div><div className="f-sub">Presente para <span>{n1}</span> &amp; <span>{n2}</span></div><button className="copy-btn" id="copyBtn">Copiar código Pix</button></div>
                </div>
              </article>
              <article className="card">
                <h3>Cotas da lua de mel</h3>
                <div className="ui">
                  <div className="quota"><span>Passeio de barco</span><small>3 de 4</small></div><div className="quota-bar"><i style={{'--w': '75%'} as React.CSSProperties}></i></div>
                  <div className="quota"><span>Jantar especial</span><small>2 de 5</small></div><div className="quota-bar"><i style={{'--w': '40%'} as React.CSSProperties}></i></div>
                </div>
                <p>Dividam a viagem em partes e cada convidado leva uma.</p>
              </article>
              <article className="card">
                <h3>Gravata do noivo</h3>
                <div className="ui"><div className="f-line">Quanto você gostaria de contribuir?</div><div className="amounts" id="amounts"><span>R$ 20</span><span className="on">R$ 50</span><span>R$ 100</span><span>Outro</span></div></div>
                <p>A tradição da festa, agora com um link: cada um escolhe o valor.</p>
              </article>
            </div>
          </div>
        </div>
      </section>
      
      
      <section id="mural" aria-labelledby="mu-h">
        <div className="wrap mural-grid">
          <div className="mural-copy">
            <p className="eyebrow">Durante a festa</p>
            <h2 id="mu-h">Mural de fotos e recados, <em>ao vivo</em>.</h2>
            <p className="lead">Convidados mandam fotos e mensagens pelo celular. Vocês aprovam o que aparece.</p>
            <div className="mural-list">
              <div><span className="m-ico"><svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg></span><p><b>Modo TV para o telão</b><span>O mural se atualiza sozinho na tela da festa.</span></p></div>
              <div><span className="m-ico"><svg viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4"/></svg></span><p><b>Story para o Instagram</b><span>Sete modelos de cartão para o convidado postar.</span></p></div>
            </div>
          </div>
          <div className="wall">
            <div className="tile t-a"><img src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=72" alt="Noivos de mãos dadas diante dos convidados e de balões" loading="lazy" /><span className="tv-badge"><i />Modo TV</span></div>
            <div className="tile t-b"><img src="https://images.unsplash.com/photo-1525772764200-be829a350797?auto=format&fit=crop&w=500&q=70" alt="Mesa de recepção com flores rosadas e velas acesas" loading="lazy" /></div>
            <div className="tile t-c note"><p>“Que dia lindo. Obrigada por nos deixarem fazer parte.”</p><small>Recado de convidada</small></div>
            <div className="tile t-d"><img src="https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=500&q=70" alt="Altar com cúpula decorado com flores num jardim" loading="lazy" /></div>
            <div className="tile t-e new"><img src="https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=500&q=70" alt="Mãos dos noivos com alianças sobre o buquê" loading="lazy" /></div>
            <div className="tile t-f"><img src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=500&q=70" alt="Mesa longa da recepção com arranjos azuis e brancos" loading="lazy" /></div>
            <div className="tile t-g"><img src="https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=500&q=70" alt="Corredor da cerimônia com arranjos de rosas" loading="lazy" /></div>
            <div className="tile t-h"><img src="https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=500&q=70" alt="Duas cadeiras decoradas no gramado à beira do lago" loading="lazy" /></div>
          </div>
        </div>
      </section>
      
      
      <section className="close" aria-labelledby="cl-h">
        <img src="https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=2000&q=75" alt="Noivos abraçados na praia com o véu ao vento" loading="lazy" />
        <div className="wrap">
          <h2 id="cl-h">O convite de <span>{n1}</span> &amp; <span>{n2}</span> já está quase pronto.</h2>
          <p className="lead">Criar é grátis. Vocês ajustam fotos, cores e textos e veem tudo antes de mandar para alguém.</p>
          <Link href={createHref} className="btn btn--primary">Criar meu convite <span className="arr" aria-hidden="true">→</span></Link>
        </div>
      </section>
      </main>
      
      <footer>
        <div className="wrap">
          <div className="foot">
            <div className="foot__brand"><span className="mark">Celebra<span>ê</span></span><p>Convites de casamento digitais, com site, lista de presença e presentes pelo Pix.</p></div>
            <div className="foot__col"><h4>Produto</h4><a href="#aberturas">Aberturas</a><a href="#site">O site</a><a href="#presenca">Presença</a><a href="#presentes">Presentes</a><a href="#mural">Mural</a></div>
            <div className="foot__col"><h4>Conta</h4><Link href={createHref}>Criar convite</Link><Link href="/admin/login">Entrar</Link><Link href="/inv/preview">Convite de exemplo</Link></div>
          </div>
          <div className="foot__base"><span>Fotografias: Unsplash (Licença Unsplash). Vídeo de capa: acervo do projeto.</span></div>
        </div>
      </footer>
      
      <div className="phone-bar" id="phoneBar"><Link href={createHref} className="btn btn--primary">Criar meu convite</Link></div>
    </div>
  );
}
