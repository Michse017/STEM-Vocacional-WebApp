import React from 'react';
import styles from './LoginForm.module.css';

const LoginForm = () => {
  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <h2 className={styles.title}>Acceso al Sistema</h2>
        
        <form className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="email"
              placeholder="Correo institucional"
              className={styles.input}
            />
          </div>
          
          <div className={styles.inputGroup}>
            <input
              type="password"
              placeholder="Contraseña"
              className={styles.input}
            />
          </div>
          
          <button type="submit" className={styles.submitButton}>
            Ingresar al Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;