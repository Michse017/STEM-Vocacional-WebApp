import styles from "./EstadisticasPanel.module.css"
import { Users, Clock, FileCheck, UserPlus } from "lucide-react"

const EstadisticasPanel = ({ data }) => {
  const estadisticas = [
    {
      id: 1,
      titulo: "Total Estudiantes",
      valor: data.totalEstudiantes,
      icono: <Users className={styles.estadisticaIcon} />,
      color: "primary",
    },
    {
      id: 2,
      titulo: "Nuevos Estudiantes",
      valor: data.nuevosEstudiantes,
      icono: <UserPlus className={styles.estadisticaIcon} />,
      color: "secondary",
    },
    {
      id: 3,
      titulo: "Cuestionarios Completados",
      valor: data.cuestionariosCompletados,
      icono: <FileCheck className={styles.estadisticaIcon} />,
      color: "success",
    },
    {
      id: 4,
      titulo: "Tiempo Promedio",
      valor: data.promedioTiempoRespuesta,
      icono: <Clock className={styles.estadisticaIcon} />,
      color: "warning",
    },
  ]

  return (
    <div className={styles.estadisticasGrid}>
      {estadisticas.map((estadistica) => (
        <div
          key={estadistica.id}
          className={`${styles.estadisticaCard} ${styles[`color${estadistica.color.charAt(0).toUpperCase() + estadistica.color.slice(1)}`]}`}
        >
          <div className={styles.estadisticaContent}>
            <div className={styles.estadisticaInfo}>
              <h4 className={styles.estadisticaTitulo}>{estadistica.titulo}</h4>
              <p className={styles.estadisticaValor}>{estadistica.valor}</p>
            </div>
            <div className={styles.estadisticaIconContainer}>{estadistica.icono}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default EstadisticasPanel
