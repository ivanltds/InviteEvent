'use client';

import styles from "./Landing.module.css";
import Link from 'next/link';
import { 
  Heart, 
  CheckCircle, 
  Palette, 
  ShieldCheck, 
  Share2, 
  Gift,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className={styles.landingWrapper}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <div className={styles.badge}>
              <Sparkles size={16} />
              <span>InviteEventAI - Edição Casamentos</span>
            </div>
            <h1>Crie uma experiência digital inesquecível para o seu casamento</h1>
            <p>
              Transforme seu convite em um portal interativo. Gestão de RSVP, lista de presentes, 
              personalização visual completa e segurança para seus convidados.
            </p>
            <div className={styles.heroActions}>
              <Link href="/admin" className={styles.primaryBtn}>
                Começar agora <ArrowRight size={18} />
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
              <div className={styles.iconWrapper}><CheckCircle /></div>
              <h3>RSVP Inteligente</h3>
              <p>Confirmações de presença integradas com gestão de acompanhantes e restrições alimentares.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.iconWrapper}><Palette /></div>
              <h3>Personalização Total</h3>
              <p>Altere cores, fontes, fotos e textos em tempo real através de um painel administrativo intuitivo.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.iconWrapper}><Gift /></div>
              <h3>Lista de Presentes</h3>
              <p>Receba presentes via PIX diretamente na sua conta, com controle de estoque e mensagens de agradecimento.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.iconWrapper}><ShieldCheck /></div>
              <h3>Segurança e Privacidade</h3>
              <p>Links únicos e ofuscados. Apenas quem você convidou tem acesso aos detalhes do seu grande dia.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.iconWrapper}><Share2 /></div>
              <h3>Compartilhamento Fácil</h3>
              <p>Gere links personalizados para cada convidado e envie via WhatsApp com um único clique.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.iconWrapper}><Heart /></div>
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
