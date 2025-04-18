"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./TopBar.module.css";

const TopBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className={styles.topbar}>
      <div className={styles.logoContainer}>
        <Link to="/" className={styles.logoLink}>
          <img src="/utb.png" alt="UTB Logo" className={styles.logo} />
          <h1 className={styles.appName}>STEM Vocational</h1>
        </Link>
      </div>

      <div className={`${styles.menuButton} ${isMenuOpen ? styles.active : ""}`} onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <ul className={`${styles.navLinks} ${isMenuOpen ? styles.active : ""}`}>
        <li>
          <Link to="/about">Sobre Nosotros</Link>
        </li>
        <li>
          <Link to="/features">Características</Link>
        </li>
        <li>
          <Link to="/contact">Contacto</Link>
        </li>
        <li>
          <Link to="/login" className={styles.loginButton}>
            Iniciar Sesión
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default TopBar;
