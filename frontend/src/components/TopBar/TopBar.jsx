import React from 'react';
import styles from './TopBar.module.css';

const TopBar = () => {
  return (
    <header className={styles.topBar}>
      <div className={styles.logoContainer}>
        <img src="/utb.png" alt="UTB Logo" className={styles.logo} />
        <h1 className={styles.appTitle}>STEM Analytics</h1>
      </div>
      <button className={styles.loginButton}>
        Iniciar Sesión
      </button>
    </header>
  );
};

export default TopBar;