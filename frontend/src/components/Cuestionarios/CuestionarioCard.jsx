import { Link } from "react-router-dom"
import styles from "./CuestionarioCard.module.css"

const CuestionarioCard = ({ cuestionario }) => {
  const { id, titulo, descripcion, fechaLimite, duracion, preguntas, completado, progreso } = cuestionario

  // Formatear la fecha
  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr)
    return fecha.toLocaleDateString()
  }

  // Determinar el texto del botón
  const textoBoton = completado ? "Ver resultados" : progreso > 0 ? "Continuar" : "Iniciar cuestionario"

  return (
    <div className={`${styles.card} ${completado ? styles.completado : ""}`}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleContainer}>
          <h3 className={styles.cardTitle}>{titulo}</h3>
          {completado && <span className={styles.badge}>Completado</span>}
        </div>
        <p className={styles.cardDescription}>{descripcion}</p>
      </div>

      <div className={styles.cardContent}>
        <div className={styles.infoContainer}>
          <div className={styles.infoItem}>
            <svg
              className={styles.icon}
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
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
              <path d="M8 14h.01"></path>
              <path d="M12 14h.01"></path>
              <path d="M16 14h.01"></path>
              <path d="M8 18h.01"></path>
              <path d="M12 18h.01"></path>
              <path d="M16 18h.01"></path>
            </svg>
            <span>Fecha límite: {formatearFecha(fechaLimite)}</span>
          </div>

          <div className={styles.infoItem}>
            <svg
              className={styles.icon}
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
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Duración: {duracion}</span>
          </div>

          <div className={styles.infoItem}>
            <svg
              className={styles.icon}
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span>Preguntas: {preguntas}</span>
          </div>
        </div>

        {!completado && progreso > 0 && (
          <div className={styles.progresoWrapper}>
            <div className={styles.progresoInfo}>
              <span>Progreso</span>
              <span className={styles.progresoTexto}>{progreso}%</span>
            </div>
            <div className={styles.progresoContainer}>
              <div className={styles.progresoBar} style={{ width: `${progreso}%` }}></div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        <Link to={`/cuestionarios/${id}`} className={styles.button}>
          {textoBoton}
        </Link>
      </div>
    </div>
  )
}

export default CuestionarioCard
