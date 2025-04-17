import React from 'react';
import { Link } from 'react-router-dom';
import styles from './LandingPage.module.css';

const LandingPage = () => {
  return (
    <div className={styles.container}>
      <div className={styles.heroContent}>
        <div className={styles.textContainer}>
          <h1 className={styles.mainTitle}>
            <span className={styles.gradientText}>STEM</span>Analytics
            <div className={styles.animatedUnderline}></div>
          </h1>
          <p className={styles.subtitle}>
            Plataforma de análisis predictivo para el futuro de la educación en ciencia y tecnología
          </p>
          <Link to="/login" className={styles.ctaButton}>
            Comenzar Análisis
            <div className={styles.hoverEffect}></div>
          </Link>
        </div>
        
        <div className={styles.visualContainer}>
          <div className={styles.gradientSphere}></div>
          <div className={styles.dnaAnimation}>
            <div className={styles.dnaStrand}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;