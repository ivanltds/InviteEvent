'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo} onClick={closeMenu}>
          L & M
        </Link>
        
        <div className={styles.navActions}>
          <Link href="/admin" className={styles.admLinkMobile}>
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </Link>

          <button 
            className={styles.hamburger} 
            onClick={toggleMenu}
            aria-label="Abrir menu de navegação"
          >
            <span className={`${styles.bar} ${isMenuOpen ? styles.bar1 : ''}`}></span>
            <span className={`${styles.bar} ${isMenuOpen ? styles.bar2 : ''}`}></span>
            <span className={`${styles.bar} ${isMenuOpen ? styles.bar3 : ''}`}></span>
          </button>
        </div>

        <ul className={`${styles.links} ${isMenuOpen ? styles.menuActive : ''}`}>
          <li><Link href="/#historia" onClick={closeMenu}>Nossa História</Link></li>
          <li><Link href="/#detalhes" onClick={closeMenu}>O Evento</Link></li>
          <li><Link href="/#rsvp" onClick={closeMenu}>RSVP</Link></li>
          <li><Link href="/presentes" onClick={closeMenu}>Presentes</Link></li>
          <li className={styles.desktopOnly}>
            <Link href="/admin" onClick={closeMenu} className={styles.admLink}>
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              <span>ADM</span>
            </Link>
          </li>
        </ul>
      </div>
      {isMenuOpen && <div className={styles.overlay} onClick={closeMenu}></div>}
    </nav>
  );
}
