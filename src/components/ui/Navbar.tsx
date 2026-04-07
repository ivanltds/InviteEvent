'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
        
        <button 
          className={styles.hamburger} 
          onClick={toggleMenu}
          aria-label="Abrir menu de navegação"
        >
          <span className={`${styles.bar} ${isMenuOpen ? styles.bar1 : ''}`}></span>
          <span className={`${styles.bar} ${isMenuOpen ? styles.bar2 : ''}`}></span>
          <span className={`${styles.bar} ${isMenuOpen ? styles.bar3 : ''}`}></span>
        </button>

        <ul className={`${styles.links} ${isMenuOpen ? styles.menuActive : ''}`}>
          <li><Link href="/#historia" onClick={closeMenu}>Nossa História</Link></li>
          <li><Link href="/#detalhes" onClick={closeMenu}>O Evento</Link></li>
          <li><Link href="/#rsvp" onClick={closeMenu}>RSVP</Link></li>
          <li><Link href="/presentes" onClick={closeMenu}>Presentes</Link></li>
        </ul>
      </div>
      {isMenuOpen && <div className={styles.overlay} onClick={closeMenu}></div>}
    </nav>
  );
}
