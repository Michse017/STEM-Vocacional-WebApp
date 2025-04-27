"use client"

import { useState } from "react"
import styles from "./PerfilForm.module.css"

const PerfilForm = ({ userData, onUpdate }) => {
  const [formData, setFormData] = useState({
    nombre: userData.nombre || "",
    email: userData.email || "",
    telefono: userData.telefono || "",
    fechaNacimiento: userData.fechaNacimiento || "",
    institucion: userData.institucion || "",
    carrera: userData.carrera || "",
    semestre: userData.semestre || "",
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

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage({ type: "", text: "" })

    // Simulación de envío a API
    setTimeout(() => {
      onUpdate(formData)
      setIsSubmitting(false)
      setMessage({
        type: "success",
        text: "¡Perfil actualizado correctamente!",
      })

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        setMessage({ type: "", text: "" })
      }, 3000)
    }, 1000)
  }

  return (
    <div className={styles.perfilForm}>
      <h2 className={styles.sectionTitle}>Editar Perfil</h2>

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
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={styles.formSection}>
          <h3 className={styles.formTitle}>Datos Personales</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="nombre" className={styles.formLabel}>
                Nombre completo
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={styles.formInput}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.formLabel}>
                Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={styles.formInput}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="telefono" className={styles.formLabel}>
                Teléfono
              </label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="fechaNacimiento" className={styles.formLabel}>
                Fecha de nacimiento
              </label>
              <input
                type="date"
                id="fechaNacimiento"
                name="fechaNacimiento"
                value={formData.fechaNacimiento}
                onChange={handleChange}
                className={styles.formInput}
              />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h3 className={styles.formTitle}>Información Académica</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="institucion" className={styles.formLabel}>
                Institución
              </label>
              <input
                type="text"
                id="institucion"
                name="institucion"
                value={formData.institucion}
                onChange={handleChange}
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="carrera" className={styles.formLabel}>
                Carrera
              </label>
              <input
                type="text"
                id="carrera"
                name="carrera"
                value={formData.carrera}
                onChange={handleChange}
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="semestre" className={styles.formLabel}>
                Semestre actual
              </label>
              <input
                type="text"
                id="semestre"
                name="semestre"
                value={formData.semestre}
                onChange={handleChange}
                className={styles.formInput}
              />
            </div>
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PerfilForm
