'use client';

import styles from "./Landing.module.css";
import Link from 'next/link';

// Inline SVG Icons to avoid external dependencies
const Icons = {
  Heart: () => (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
  ),
  CheckCircle: () => (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
  ),
  Palette: () => (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
  ),
  ShieldCheck: () => (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
  ),
  Share2: () => (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
  ),
  Gift: () => (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
  ),
  ArrowRight: ({ size = 18 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
  ),
  Sparkles: ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg>
  )
};

export default function LandingPage() {
  return (
    <div className={styles.landingWrapper}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <div className={styles.badge}>
              <Icons.Sparkles size={16} />
              <span>InviteEventAI - Edição Casamentos</span>
            </div>
            <h1>Crie uma experiência digital inesquecível para o seu casamento</h1>
            <p>
              Transforme seu convite em um portal interativo. Gestão de RSVP, lista de presentes, 
              personalização visual completa e segurança para seus convidados.
            </p>
            <div className={styles.heroActions}>
              <Link href="/admin" className={styles.primaryBtn}>
                Começar agora <Icons.ArrowRight size={18} />
              </Link>
              <a href="#features" className={styles.secondaryBtn}>
                Ver funcionalidades
              </a>
            </div>
          </div>
          <div className={styles.heroImage}>
            {/* Mockup simplificado ou ilustração via CSS */}
            <div className={styles.mockup}>
              <div className={styles.mockupHeader}></div>
              <div className={styles.mockupBody}>
                <div className={styles.mockupLineLarge}></div>
                <div className={styles.mockupLineMedium}></div>
                <div className={styles.mockupCircle}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.features}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>Tudo o que você precisa em um só lugar</h2>
            <p>Desenvolvido para simplificar a vida dos noivos e encantar os convidados.</p>
          </div>

          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.iconWrapper}><Icons.CheckCircle /></div>
              <h3>RSVP Inteligente</h3>
              <p>Confirmações de presença integradas com gestão de acompanhantes e restrições alimentares.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.iconWrapper}><Icons.Palette /></div>
              <h3>Personalização Total</h3>
              <p>Altere cores, fontes, fotos e textos em tempo real através de um painel administrativo intuitivo.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.iconWrapper}><Icons.Gift /></div>
              <h3>Lista de Presentes</h3>
              <p>Receba presentes via PIX diretamente na sua conta, com controle de estoque e mensagens de agradecimento.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.iconWrapper}><Icons.ShieldCheck /></div>
              <h3>Segurança e Privacidade</h3>
              <p>Links únicos e ofuscados. Apenas quem você convidou tem acesso aos detalhes do seu grande dia.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.iconWrapper}><Icons.Share2 /></div>
              <h3>Compartilhamento Fácil</h3>
              <p>Gere links personalizados para cada convidado e envie via WhatsApp com um único clique.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.iconWrapper}><Icons.Heart /></div>
              <h3>Nossa História</h3>
              <p>Conte sua trajetória, apresente os noivos e compartilhe fotos em uma timeline emocionante.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2>Pronto para digitalizar seu grande dia?</h2>
            <p>Junte-se a centenas de casais que escolheram a elegância e praticidade do InviteEventAI.</p>
            <Link href="/admin" className={styles.largeBtn}>
              Criar meu convite digital agora
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <p>&copy; 2026 InviteEventAI. Todos os direitos reservados.</p>
          <div className={styles.footerLinks}>
            <Link href="/admin">Painel Administrativo</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
