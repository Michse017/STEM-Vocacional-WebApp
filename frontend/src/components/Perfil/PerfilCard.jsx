import styles from "./PerfilCard.module.css"

const PerfilCard = ({ userData }) => {
  // Formatear la fecha de nacimiento
  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr)
    return fecha.toLocaleDateString()
  }

  // Calcular la edad
  const calcularEdad = (fechaStr) => {
    const fechaNacimiento = new Date(fechaStr)
    const hoy = new Date()
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear()
    const mes = hoy.getMonth() - fechaNacimiento.getMonth()
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--
    }
    return edad
  }

  return (
    <div className={styles.perfilCard}>
      <h2 className={styles.sectionTitle}>Información Personal</h2>

      <div className={styles.infoSection}>
        <h3 className={styles.infoTitle}>Datos Personales</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Nombre completo</span>
            <span className={styles.infoValue}>{userData.nombre}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Correo electrónico</span>
            <span className={styles.infoValue}>{userData.email}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Teléfono</span>
            <span className={styles.infoValue}>{userData.telefono}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Fecha de nacimiento</span>
            <span className={styles.infoValue}>{formatearFecha(userData.fechaNacimiento)}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Edad</span>
            <span className={styles.infoValue}>{calcularEdad(userData.fechaNacimiento)} años</span>
          </div>
        </div>
      </div>

      <div className={styles.infoSection}>
        <h3 className={styles.infoTitle}>Información Académica</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Institución</span>
            <span className={styles.infoValue}>{userData.institucion}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Carrera</span>
            <span className={styles.infoValue}>{userData.carrera}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Semestre actual</span>
            <span className={styles.infoValue}>{userData.semestre}</span>
          </div>
        </div>
      </div>

      <div className={styles.actionsContainer}>
        <button className={styles.actionButton}>
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
            className={styles.actionIcon}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Descargar información
        </button>
        <button className={styles.actionButton}>
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
            className={styles.actionIcon}
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          Compartir perfil
        </button>
      </div>
    </div>
  )
}

export default PerfilCard
