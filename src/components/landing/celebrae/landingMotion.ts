/**
 * Camada imperativa da landing (animações e micro-interações).
 *
 * O markup e o estado do casal (nomes/data) vivem no React (CelebraeLanding.tsx);
 * aqui ficam as partes que são DOM + Web Animations puras: aberturas do hero,
 * prévias da seção "Aberturas", contagem regressiva, nav, menu, cores do estúdio,
 * painel de presença e QR do Pix. Tudo escopado ao elemento raiz e desmontado
 * em `destroy()`.
 */

export interface CoupleState {
  n1: string;
  n2: string;
  date: string; // yyyy-mm-dd
}

type OpeningId = 'trad' | 'env' | 'cine' | 'pet' | 'pet2';

export const OPENINGS: Record<OpeningId, string> = {
  trad: 'Tradicional',
  env: 'Envelope 3D',
  cine: 'Cinematic Spark',
  pet: 'Pétalas ao Vento',
  pet2: 'Pétalas ao Vento 2',
};

/** Aberturas que entram no sorteio do hero (as demais ficam disponíveis via ?abertura=). */
const HERO_POOL: OpeningId[] = ['pet', 'pet2'];
const STORAGE_KEY = 'celebrae:abertura';

const UNSPLASH_COVER =
  'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=700&q=70';

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

export const formatWeddingDate = (iso: string) => {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
};

export function pickOpening(search: string): OpeningId {
  const forced = new URLSearchParams(search).get('abertura') as OpeningId | null;
  if (forced && forced in OPENINGS) return forced;
  let last: string | null = null;
  try { last = localStorage.getItem(STORAGE_KEY); } catch { /* modo privado */ }
  const pool = HERO_POOL.filter(k => k !== last);
  const pick = pool[Math.floor(Math.random() * pool.length)] ?? HERO_POOL[0];
  try { localStorage.setItem(STORAGE_KEY, pick); } catch { /* modo privado */ }
  return pick;
}

export function mountLanding(root: HTMLElement, getState: () => CoupleState, opening: OpeningId) {
  const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = root) => r.querySelector(s) as T | null;
  const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = root) => Array.from(r.querySelectorAll<T>(s)) as T[];

  const canAnimate = typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function';
  const reduce =
    !canAnimate ||
    (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const cleanups: Array<() => void> = [];
  const intervals: number[] = [];
  const timeouts: number[] = [];
  const every = (fn: () => void, ms: number) => intervals.push(window.setInterval(fn, ms));
  const after = (fn: () => void, ms: number) => { const id = window.setTimeout(fn, ms); timeouts.push(id); return id; };
  const on = <K extends keyof HTMLElementEventMap>(el: HTMLElement | null, ev: K, fn: (e: HTMLElementEventMap[K]) => void, opts?: AddEventListenerOptions) => {
    if (!el) return;
    el.addEventListener(ev, fn as EventListener, opts);
    cleanups.push(() => el.removeEventListener(ev, fn as EventListener, opts));
  };
  const observe = (target: Element | null, cb: (e: IntersectionObserverEntry) => void, threshold: number) => {
    if (!target || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => cb(e), { threshold });
    io.observe(target);
    cleanups.push(() => io.disconnect());
  };

  const coupleNames = () => {
    const { n1, n2 } = getState();
    return `${escapeHtml(n1 || 'Noiva')} &amp; ${escapeHtml(n2 || 'Noivo')}`;
  };
  const initials = () => { const { n1, n2 } = getState(); return escapeHtml((n1[0] || '') + (n2[0] || '')); };
  const dateText = () => formatWeddingDate(getState().date);

  /* ---------- contagem regressiva (todas as capas) ---------- */
  const tick = () => {
    const t = new Date(`${getState().date}T16:00:00-03:00`).getTime();
    const s = Math.max(0, Math.floor((t - Date.now()) / 1000)) || 0;
    const v = [Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60];
    $$('[data-count]').forEach(c => $$('b', c).forEach((b, i) => { b.textContent = i ? String(v[i]).padStart(2, '0') : String(v[i]); }));
  };
  tick();
  every(tick, 1000);

  /* ---------- nav, menu e barra do celular ---------- */
  const nav = $('#nav');
  const menuBtn = $('.menu-btn');
  const menu = $('#menu');
  const menuOpen = () => menuBtn?.getAttribute('aria-expanded') === 'true';
  const onScroll = () => nav?.classList.toggle('is-scrolled', menuOpen() || window.scrollY > window.innerHeight * 0.6);
  window.addEventListener('scroll', onScroll, { passive: true });
  cleanups.push(() => window.removeEventListener('scroll', onScroll));
  onScroll();
  const setMenu = (open: boolean) => {
    menuBtn?.setAttribute('aria-expanded', String(open));
    menuBtn?.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu?.classList.toggle('open', open);
    onScroll();
  };
  on(menuBtn, 'click', () => setMenu(!menuOpen()));
  $$('a', menu ?? root).forEach(a => on(a, 'click', () => setMenu(false)));
  const phoneBar = $('#phoneBar');
  observe($('#topo'), e => phoneBar?.classList.toggle('on', !e.isIntersecting), 0.1);

  const sheet = $('#sheet');
  const sheetToggle = $('#sheetToggle');
  on(sheetToggle, 'click', () => {
    const open = sheetToggle?.getAttribute('aria-expanded') !== 'true';
    sheetToggle?.setAttribute('aria-expanded', String(open));
    sheet?.classList.toggle('open', open);
    if (open) $<HTMLInputElement>('#n1')?.focus();
  });

  /* ---------- HERO: abertura sorteada ---------- */
  const hero = $('#topo');
  const wind = $('#wind');
  const reveal = () => hero?.classList.remove('pre');
  const clocks: Animation[] = [];
  const animations: Animation[] = [];
  const anim = (el: Element, kf: Keyframe[], o: KeyframeAnimationOptions) => { const a = el.animate(kf, o); animations.push(a); return a; };
  const clock = (ms: number, fn: () => void) => {
    if (!wind) return;
    const k = wind.animate([{ opacity: 1 }, { opacity: 1 }], { duration: ms });
    k.onfinish = fn;
    clocks.push(k);
  };
  const el = (tag: string, cls?: string, parent: Element | null = wind) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    parent?.appendChild(e);
    return e;
  };
  const ease = { out: 'cubic-bezier(.22,1,.36,1)', inOut: 'cubic-bezier(.37,0,.63,1)' };
  const clearWind = () => { if (wind) wind.innerHTML = ''; };
  const finish = (D: number, revealAt: number, dimUntil: number) => {
    hero?.classList.add('blooming');
    clock(dimUntil, () => hero?.classList.remove('blooming'));
    clock(revealAt, reveal);
    clock(D + 100, clearWind);
  };

  const intros: Record<OpeningId, () => void> = {
    /* Pétalas ao Vento: a flor desabrocha girando e o vento a desfaz */
    pet() {
      if (!hero || !wind) return reveal();
      const W = hero.clientWidth, H = hero.clientHeight;
      const base = W < 700 ? 30 : 44, D = 4400;
      const smooth = 'cubic-bezier(.37,0,.63,1)';
      const rings = [
        { n: 5, d: 0.1, s: 0.5, c: ['#e9a6a0', '#c9726b'] },
        { n: 7, d: 0.32, s: 0.72, c: ['#f2bfb6', '#d98c80'] },
        { n: 9, d: 0.58, s: 0.92, c: ['#f8d6cd', '#e4a596'] },
        { n: 11, d: 0.86, s: 1.1, c: ['#fde9e2', '#efc0b2'] },
      ];
      const frag = document.createDocumentFragment();
      [...rings].reverse().forEach((ring, ri) => {
        const r = rings.length - 1 - ri; // 0 = miolo
        for (let k = 0; k < ring.n; k++) {
          const a = (360 / ring.n) * k + (r % 2 ? 360 / ring.n / 2 : 0) + (Math.random() - 0.5) * 6;
          const [c1, c2] = ring.c;
          const outer = el('b', undefined, null), spin = el('u', undefined, outer), place = el('i', undefined, spin), shape = el('span', undefined, place);
          shape.style.cssText = `--s:${base * ring.s * (0.92 + Math.random() * 0.16)}px;--c1:${c1};--c2:${c2}`;
          frag.appendChild(outer);
          const dist = base * ring.d;
          // 1. a flor gira inteira, rápido no começo e desacelerando
          anim(spin, [{ transform: 'rotate(-160deg)' }, { transform: 'rotate(110deg)' }], { duration: D, easing: 'cubic-bezier(.12,.55,.25,1)', fill: 'both' });
          // 2. cada pétala desabrocha do miolo para fora
          anim(place, [
            { transform: `rotate(${a - 25}deg) translateY(0) scale(.1)`, opacity: 0 },
            { transform: `rotate(${a}deg) translateY(${-dist}px) scale(1)`, opacity: 1 },
          ], { duration: 1300, delay: 120 + r * 150 + Math.random() * 90, easing: ease.out, fill: 'both' });
          // 3. o vento solta as pétalas de fora primeiro e as leva em curva
          const go = 0.44 + (rings.length - 1 - r) * 0.035 + Math.random() * 0.05;
          const wx = W * (0.45 + Math.random() * 0.55), wy = -H * (0.08 + Math.random() * 0.32);
          anim(outer, [
            { transform: 'translate(0,0)', opacity: 1 },
            { transform: 'translate(0,0)', opacity: 1, offset: go, easing: 'cubic-bezier(.45,0,.75,.7)' },
            { transform: `translate(${wx * 0.32}px,${wy * 0.2 + 18}px)`, opacity: 1, offset: go + (1 - go) * 0.45, easing: smooth },
            { transform: `translate(${wx}px,${wy}px)`, opacity: 0 },
          ], { duration: D, fill: 'both' });
          // 4. ao sair, a pétala vira no ar devagar
          anim(shape, [
            { transform: 'rotate(0deg) rotateX(0deg)' },
            { transform: 'rotate(0deg) rotateX(0deg)', offset: go, easing: smooth },
            { transform: `rotate(${120 + Math.random() * 220}deg) rotateX(${140 + Math.random() * 200}deg)` },
          ], { duration: D, fill: 'both' });
        }
      });
      const coreWrap = el('b', undefined, null), core = el('i', 'core', coreWrap);
      frag.appendChild(coreWrap);
      anim(core, [
        { transform: 'scale(0)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.14 },
        { transform: 'scale(1)', opacity: 1, offset: 0.46 },
        { transform: 'scale(.4)', opacity: 0 },
      ], { duration: D, easing: ease.out, fill: 'both' });
      wind.appendChild(frag);
      finish(D, D * 0.58, D * 0.5);
    },

    /* Pétalas ao Vento 2: folhas atravessam a tela em rajadas */
    pet2() {
      if (!hero || !wind) return reveal();
      const W = hero.clientWidth, H = hero.clientHeight, N = W < 700 ? 34 : 64, D = 3800;
      const tones = [['#f6ead1', '#d4b06a'], ['#efe2cb', '#c49a55'], ['#fbf3e3', '#e2c58c'], ['#ffffff', '#e6d6b8']];
      for (let i = 0; i < N; i++) {
        const o = el('b', 'leaf-o'), l = el('span', 'leaf-s', o), [c1, c2] = tones[i % 4];
        const sz = (W < 700 ? 16 : 22) * (0.7 + Math.random() * 0.8);
        l.style.cssText = `--s:${sz}px;--c1:${c1};--c2:${c2}`;
        const y = H * (0.12 + Math.random() * 0.7), amp = 30 + Math.random() * 70, wave = Math.random() * 6.28;
        const dur = 2000 + Math.random() * 1100, delay = Math.random() * 1300;
        const pts = [0, 0.25, 0.5, 0.75, 1].map(k => ({
          transform: `translate(${-60 + k * (W + 140)}px,${y + Math.sin(wave + k * 5) * amp - k * 60}px)`,
          opacity: k === 0 || k === 1 ? 0 : 1,
        }));
        anim(o, pts, { duration: dur, delay, easing: ease.inOut, fill: 'both' });
        anim(l, [
          { transform: `rotate(${Math.random() * 360}deg) rotateX(0deg)` },
          { transform: `rotate(${360 + Math.random() * 540}deg) rotateX(${180 + Math.random() * 360}deg)` },
        ], { duration: dur, delay, easing: 'linear', fill: 'both' });
      }
      finish(D, 1500, 1400);
    },

    /* Envelope 3D (fora do sorteio por enquanto) */
    env() {
      if (!wind) return reveal();
      const D = 4200, box = el('div', 'h-env'), env = el('div', 'env', box);
      env.innerHTML = `<div class="env__back"></div><div class="env__letter"><span class="s">Convite</span><span class="n">${coupleNames()}</span></div><div class="env__front"></div><div class="env__flap"></div><div class="env__seal">${initials()}</div>`;
      const letter = $('.env__letter', env), flap = $('.env__flap', env), seal = $('.env__seal', env);
      anim(env, [{ transform: 'translateY(40px) rotateX(18deg) scale(.86)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 1100, easing: ease.out, fill: 'both' });
      if (seal) anim(seal, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.12)', opacity: 1, offset: 0.4 }, { transform: 'scale(1.5) translateY(-6px)', opacity: 0 }], { duration: 700, delay: 1100, easing: ease.inOut, fill: 'both' });
      if (flap) anim(flap, [{ transform: 'rotateX(0deg)', zIndex: 4 }, { transform: 'rotateX(180deg)', zIndex: 1 }], { duration: 1100, delay: 1500, easing: ease.inOut, fill: 'both' });
      if (letter) anim(letter, [{ transform: 'translateY(0)', zIndex: 2 }, { transform: 'translateY(-62%)', zIndex: 2 }], { duration: 1200, delay: 2200, easing: ease.out, fill: 'both' });
      anim(box, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.08)', opacity: 0 }], { duration: 1000, delay: 3200, easing: ease.inOut, fill: 'both' });
      finish(D, 3150, 3200);
    },

    /* Cinematic Spark (fora do sorteio por enquanto) */
    cine() {
      if (!hero || !wind) return reveal();
      const D = 4200, W = hero.clientWidth, black = el('div', 'h-black'), line = el('i', 'h-line');
      anim(black, [{ opacity: 1 }, { opacity: 1, offset: 0.55 }, { opacity: 0 }], { duration: 3600, easing: ease.inOut, fill: 'both' });
      anim(line, [{ width: '0px', opacity: 0 }, { width: `${W * 0.5}px`, opacity: 1, offset: 0.5 }, { width: `${W * 1.1}px`, opacity: 0 }], { duration: 1900, delay: 300, easing: ease.out, fill: 'both' });
      for (let i = 0; i < (W < 700 ? 24 : 44); i++) {
        const sp = el('i', 'h-spark'), a = Math.random() * 6.28, r = 80 + Math.random() * W * 0.28;
        anim(sp, [
          { transform: 'translate(0px,0px) scale(1)', opacity: 0 },
          { opacity: 1, offset: 0.1 },
          { transform: `translate(${Math.cos(a) * r}px,${Math.sin(a) * r * 0.55}px) scale(.3)`, opacity: 0 },
        ], { duration: 1500 + Math.random() * 1100, delay: 700 + Math.random() * 500, easing: ease.out, fill: 'both' });
      }
      clock(1500, reveal);
      clock(D + 100, clearWind);
    },

    /* Tradicional (fora do sorteio por enquanto) */
    trad() {
      if (!wind) return reveal();
      const D = 3800, paper = el('div', 'h-paper'), card = el('div', 'h-card', paper);
      root.classList.add('intro-light');
      clock(2300, () => root.classList.remove('intro-light'));
      card.innerHTML = `<span class="s">Com a bênção de Deus e de nossos pais</span><span class="n">${coupleNames()}</span><hr><span class="s">${dateText()}</span>`;
      anim(card, [
        { transform: 'translateY(36px) scale(1)', opacity: 0 },
        { transform: 'translateY(0px) scale(1)', opacity: 1, offset: 0.38 },
        { transform: 'translateY(0px) scale(1)', opacity: 1, offset: 0.7 },
        { transform: 'translateY(0px) scale(1.06)', opacity: 0 },
      ], { duration: 3200, delay: 150, easing: ease.inOut, fill: 'both' });
      anim(paper, [{ opacity: 1 }, { opacity: 1, offset: 0.65 }, { opacity: 0 }], { duration: 3500, easing: ease.inOut, fill: 'both' });
      clock(2500, reveal);
      clock(D + 100, clearWind);
    },
  };

  const skip = () => {
    clocks.forEach(c => c.cancel());
    animations.forEach(a => a.cancel());
    clearWind();
    hero?.classList.remove('blooming');
    root.classList.remove('intro-light');
    reveal();
  };
  on($('#skipIntro'), 'click', skip);
  let started = false;
  const raf1 = requestAnimationFrame(() => requestAnimationFrame(() => {
    if (started) return;
    started = true;
    if (reduce) return reveal();
    intros[opening]();
  }));
  cleanups.push(() => cancelAnimationFrame(raf1));
  after(reveal, 5200); // garantia: o convite aparece de qualquer jeito

  /* crossfade das fotos do PC (como o HeroCarousel) */
  const slides = $$<HTMLImageElement>('#topo .inv__bg img.desk');
  let si = 0;
  if (!reduce && slides.length > 1) {
    every(() => {
      slides[si].classList.remove('on');
      si = (si + 1) % slides.length;
      const s = slides[si];
      s.classList.add('on');
      s.style.animation = 'none';
      void s.offsetWidth;
      s.style.animation = '';
    }, 7000);
  }

  /* ---------- ABERTURAS (prévia no celular) ---------- */
  const demo = $('#demo');
  const countMarkup = '<div class="inv__count" data-count><div><b>0</b><small>dias</small></div><div><b>0</b><small>horas</small></div><div><b>0</b><small>min</small></div><div><b>0</b><small>seg</small></div></div>';
  const finalCover = () => {
    const f = document.createElement('div');
    f.className = 'final';
    f.innerHTML = `<div class="inv"><div class="inv__bg"><img src="${UNSPLASH_COVER}" alt=""></div>
      <p class="inv__names">${coupleNames()}</p><p class="inv__date">${dateText()}</p>${countMarkup}
      <p class="inv__tag">O nosso grande dia está chegando!</p>
      <div class="inv__cta"><span class="inv__btn inv__btn--p">Confirmar presença</span><span class="inv__btn inv__btn--s">Lista de presentes</span></div></div>`;
    demo?.appendChild(f);
    tick();
    return f;
  };
  let demoTimers: number[] = [];
  let raf = 0;
  const later = (fn: () => void, ms: number) => { demoTimers.push(window.setTimeout(fn, reduce ? 0 : ms)); };
  const clearDemo = () => {
    demoTimers.forEach(clearTimeout);
    demoTimers = [];
    cancelAnimationFrame(raf);
    if (demo) demo.innerHTML = '';
  };
  cleanups.push(clearDemo);
  const particles = (kind: 'petal' | 'leaf', n: number) => {
    if (!demo) return;
    const H = demo.clientHeight, W = demo.clientWidth, t0 = performance.now();
    const els = Array.from({ length: n }, () => {
      const p = document.createElement('i');
      p.className = kind;
      demo.appendChild(p);
      return { el: p, x: Math.random(), d: Math.random() * 1600, s: 0.55 + Math.random() * 0.6, r: Math.random() * 360, w: Math.random() * 6.28 };
    });
    const step = (t: number) => {
      const e = t - t0;
      let alive = false;
      for (const p of els) {
        const k = Math.max(0, e - p.d) / (2600 / p.s);
        if (k < 1) alive = true;
        p.el.style.transform = kind === 'petal'
          ? `translate(${p.x * W + Math.sin(k * 6 + p.w) * 26}px,${-30 + k * (H + 60)}px) rotate(${p.r + k * 400}deg) rotateX(${k * 540}deg)`
          : `translate(${-30 + k * (W + 60)}px,${p.x * H * 0.9 + Math.sin(k * 5 + p.w) * 40 - k * 60}px) rotate(${p.r + k * 520}deg)`;
        p.el.style.opacity = k >= 1 ? '0' : '1';
      }
      if (alive) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };
  const dateSpan = () => `<span class="s">${dateText()}</span>`;
  const demos: Record<OpeningId, () => void> = {
    trad() {
      if (!demo) return;
      demo.innerHTML = `<div class="d-trad"><div class="d-card" style="opacity:0;transform:translateY(24px);transition:opacity 1.1s ease,transform 1.1s var(--ease)"><span class="s">Com a bênção de Deus e de nossos pais</span><span class="n">${coupleNames()}</span><hr>${dateSpan()}</div></div>`;
      later(() => { const c = $('.d-card', demo); if (c) { c.style.opacity = '1'; c.style.transform = 'none'; } }, 150);
      const f = finalCover(); later(() => f.classList.add('show'), 3000);
    },
    env() {
      if (!demo) return;
      demo.innerHTML = `<div class="d-env"><div class="env"><div class="env__back"></div><div class="env__letter"><span class="s">Convite</span><span class="n">${coupleNames()}</span></div><div class="env__front"></div><div class="env__flap"></div><div class="env__seal">${initials()}</div></div></div>`;
      const d = demo.firstElementChild;
      later(() => d?.classList.add('open'), 700);
      later(() => d?.classList.add('rise'), 1500);
      const f = finalCover(); later(() => f.classList.add('show'), 3100);
    },
    cine() {
      if (!demo) return;
      demo.innerHTML = `<div class="d-cine"><div class="cine-line"></div><div class="cine-text"><span class="n">${coupleNames()}</span>${dateSpan()}</div></div>`;
      const d = demo.firstElementChild;
      later(() => {
        d?.classList.add('go');
        if (reduce || !d) return;
        for (let i = 0; i < 26; i++) {
          const s = document.createElement('i');
          s.className = 'spark';
          d.appendChild(s);
          const a = Math.random() * 6.28, r = 60 + Math.random() * 140;
          s.animate([{ transform: 'translate(-50%,-50%)', opacity: 1 }, { transform: `translate(${Math.cos(a) * r}px,${Math.sin(a) * r * 0.6}px)`, opacity: 0 }],
            { duration: 1400 + Math.random() * 900, delay: 300 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' });
        }
      }, 300);
      const f = finalCover(); later(() => f.classList.add('show'), 3800);
    },
    pet() {
      if (!demo) return;
      demo.innerHTML = `<div class="d-pet"><div class="pet-text"><span class="n">${coupleNames()}</span>${dateSpan()}</div></div>`;
      if (!reduce) particles('petal', 34);
      later(() => $('.pet-text', demo)?.classList.add('show'), 1400);
      const f = finalCover(); later(() => f.classList.add('show'), 4000);
    },
    pet2() {
      if (!demo) return;
      demo.innerHTML = `<div class="d-pet" style="background:linear-gradient(180deg,#fbf7ef,#f0e6d4)"><div class="pet-text"><span class="n">${coupleNames()}</span>${dateSpan()}</div></div>`;
      if (!reduce) particles('leaf', 30);
      later(() => $('.pet-text', demo)?.classList.add('show'), 1400);
      const f = finalCover(); later(() => f.classList.add('show'), 4000);
    },
  };
  const tabs = $$('.tab');
  let current: OpeningId = opening;
  tabs.forEach(x => x.setAttribute('aria-selected', String(x.dataset.demo === opening)));
  const play = (id: OpeningId) => { clearDemo(); current = id; demos[id](); };
  tabs.forEach(t => on(t, 'click', () => {
    tabs.forEach(x => x.setAttribute('aria-selected', String(x === t)));
    play(t.dataset.demo as OpeningId);
  }));
  on($('#replay'), 'click', () => play(current));
  let played = false;
  observe($('#aberturas'), e => { if (e.isIntersecting && !played) { played = true; play(current); } }, 0.3);
  finalCover().classList.add('show');

  /* ---------- SITE: cores e letra mudam o convite ---------- */
  const scroller = $('#scroller'), hint = $('#scrollHint');
  on(scroller, 'scroll', () => hint?.classList.toggle('off', (scroller?.scrollTop ?? 0) > 20), { passive: true });
  const onAccent = (hex: string) => {
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    return (r * 299 + g * 587 + b * 114) / 1000 >= 128 ? '#111' : '#fff';
  };
  const swatches = $$('.swatch');
  swatches.forEach(b => on(b, 'click', () => {
    swatches.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    const { bg = '', ink = '', acc = '' } = b.dataset;
    root.style.setProperty('--bg-primary', bg);
    root.style.setProperty('--text-main', ink);
    root.style.setProperty('--inv-accent', acc);
    root.style.setProperty('--text-on-accent', onAccent(acc));
  }));
  const fonts = $$('.font-opt');
  fonts.forEach(b => on(b, 'click', () => {
    fonts.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    root.style.setProperty('--font-cursive', b.dataset.font ?? '');
  }));

  /* ---------- PRESENÇA (dados de exemplo da interface) ---------- */
  type Row = [string, string, string, string, 'yes' | 'wait' | 'no'];
  const rows: Record<'ind' | 'link', Row[]> = {
    ind: [['Clara Mendes', '#1A1A1A', '2 de 2', 'há 4 min', 'yes'], ['Beto e Ana Lima', '#C98E77', '1 de 1', 'há 1 h', 'yes'], ['Lúcia Ferraz', '#B08A45', '0 de 2', '—', 'wait'], ['Rafael Souto', '#6B6B76', '1 de 1', 'ontem', 'yes'], ['Júlia Prado', '#9A4B3E', '0 de 1', 'ontem', 'no']],
    link: [['Marcos Tavares', '#6B6B76', '1', 'há 2 min', 'yes'], ['Paula e Leo', '#1A1A1A', '1', 'há 20 min', 'yes'], ['Sônia Reis', '#C98E77', '0', 'há 1 h', 'no'], ['Dani Costa', '#B08A45', '2', 'hoje, 9h', 'yes'], ['Igor Nunes', '#9A4B3E', '0', 'ontem', 'yes']],
  };
  const label = { yes: 'Confirmado', wait: 'Pendente', no: 'Não vai' };
  const renderRows = (m: 'ind' | 'link') => {
    const col = $('#col1');
    if (col) col.textContent = m === 'ind' ? 'Convidado' : 'Nome digitado pelo convidado';
    const tb = $('#rsvpRows');
    if (tb) tb.innerHTML = rows[m].map(([n, c, a, t, s]) => `<tr><td class="who"><span class="avatar" style="background:${c}">${n[0]}</span>${n}</td><td>${a}</td><td>${t}</td><td><span class="chip chip--${s}">${label[s]}</span></td></tr>`).join('');
  };
  renderRows('ind');
  const seg = $$('.seg button');
  seg.forEach(b => on(b, 'click', () => {
    seg.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    renderRows(b.dataset.mode as 'ind' | 'link');
  }));

  /* ---------- PRESENTES ---------- */
  const qr = $('#qr');
  if (qr && !qr.childElementCount) {
    let seed = 7;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let y = 0; y < 13; y++) for (let x = 0; x < 13; x++) {
      const i = document.createElement('i');
      const finder = (x < 4 && y < 4) || (x > 8 && y < 4) || (x < 4 && y > 8);
      if (finder) {
        const fx = x > 8 ? x - 9 : x, fy = y > 8 ? y - 9 : y;
        i.className = fx === 0 || fx === 3 || fy === 0 || fy === 3 || (fx > 0 && fx < 3 && fy > 0 && fy < 3) ? '' : 'o';
      } else i.className = rnd() > 0.5 ? '' : 'o';
      qr.appendChild(i);
    }
  }
  const copyBtn = $('#copyBtn');
  on(copyBtn, 'click', () => {
    if (!copyBtn) return;
    copyBtn.textContent = 'Código copiado';
    after(() => { copyBtn.textContent = 'Copiar código Pix'; }, 2200);
  });
  const amounts = $$('#amounts span');
  amounts.forEach(s => on(s, 'click', () => amounts.forEach(x => x.classList.toggle('on', x === s))));

  return {
    /** Chamado quando os nomes/data mudam: atualiza a contagem e a capa da prévia. */
    refresh() {
      tick();
      const names = $('.final .inv__names', demo ?? root);
      const date = $('.final .inv__date', demo ?? root);
      if (names) names.innerHTML = coupleNames();
      if (date) date.textContent = dateText();
    },
    destroy() {
      intervals.forEach(clearInterval);
      timeouts.forEach(clearTimeout);
      clocks.forEach(c => c.cancel());
      animations.forEach(a => a.cancel());
      cleanups.forEach(fn => fn());
      clearWind();
      root.classList.remove('intro-light');
    },
  };
}
