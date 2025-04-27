"use client"

import { useState } from "react"
import styles from "./PerfilSeguridad.module.css"

const PerfilSeguridad = ({ email }) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage({ type: "", text: "" })

    // Validación básica
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({
        type: "error",
        text: "Las contraseñas no coinciden",
      })
      setIsSubmitting(false)
      return
    }

    if (formData.newPassword.length < 8) {
      setMessage({
        type: "error",
        text: "La contraseña debe tener al menos 8 caracteres",
      })
      setIsSubmitting(false)
      return
    }

    // Simulación de envío a API
    setTimeout(() => {
      setIsSubmitting(false)
      setMessage({
        type: "success",
        text: "¡Contraseña actualizada correctamente!",
      })
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        setMessage({ type: "", text: "" })
      }, 3000)
    }, 1000)
  }

  return (
    <div className={styles.seguridadContainer}>
      <h2 className={styles.sectionTitle}>Seguridad de la Cuenta</h2>

      <div className={styles.infoSection}>
        <h3 className={styles.subsectionTitle}>Información de Acceso</h3>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Correo electrónico</span>
          <span className={styles.infoValue}>{email}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Último acceso</span>
          <span className={styles.infoValue}>Hoy, 10:45 AM</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Dispositivo</span>
          <span className={styles.infoValue}>Chrome en Windows</span>
        </div>
      </div>

      <div className={styles.passwordSection}>
        <h3 className={styles.subsectionTitle}>Cambiar Contraseña</h3>

        {message.text && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.type === "success" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.messageIcon}
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            )}
            {message.type === "error" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.messageIcon}
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            )}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.passwordForm}>
          <div className={styles.formGroup}>
            <label htmlFor="currentPassword" className={styles.formLabel}>
              Contraseña actual
            </label>
            <div className={styles.passwordInputContainer}>
              <input
                type={showPassword.current ? "text" : "password"}
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className={styles.formInput}
                required
              />
              <button
                type="button"
                className={styles.togglePasswordButton}
                onClick={() => togglePasswordVisibility("current")}
              >
                {showPassword.current ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="newPassword" className={styles.formLabel}>
              Nueva contraseña
            </label>
            <div className={styles.passwordInputContainer}>
              <input
                type={showPassword.new ? "text" : "password"}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className={styles.formInput}
                required
              />
              <button
                type="button"
                className={styles.togglePasswordButton}
                onClick={() => togglePasswordVisibility("new")}
              >
                {showPassword.new ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
            <p className={styles.passwordHint}>La contraseña debe tener al menos 8 caracteres</p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.formLabel}>
              Confirmar nueva contraseña
            </label>
            <div className={styles.passwordInputContainer}>
              <input
                type={showPassword.confirm ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={styles.formInput}
                required
              />
              <button
                type="button"
                className={styles.togglePasswordButton}
                onClick={() => togglePasswordVisibility("confirm")}
              >
                {showPassword.confirm ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
              {isSubmitting ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </div>
        </form>
      </div>

      <div className={styles.securityOptions}>
        <h3 className={styles.subsectionTitle}>Opciones adicionales de seguridad</h3>
        <div className={styles.optionItem}>
          <div className={styles.optionInfo}>
            <h4 className={styles.optionTitle}>Autenticación de dos factores</h4>
            <p className={styles.optionDescription}>
              Añade una capa extra de seguridad a tu cuenta requiriendo un código además de tu contraseña.
            </p>
          </div>
          <button className={styles.optionButton}>Activar</button>
        </div>
        <div className={styles.optionItem}>
          <div className={styles.optionInfo}>
            <h4 className={styles.optionTitle}>Sesiones activas</h4>
            <p className={styles.optionDescription}>Revisa y cierra sesiones activas en otros dispositivos.</p>
          </div>
          <button className={styles.optionButton}>Ver sesiones</button>
        </div>
      </div>
    </div>
  )
}

export default PerfilSeguridad
