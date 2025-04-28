import styles from "./ResumenActividad.module.css"
import { FileCheck, UserPlus, FileText, Clock } from "lucide-react"

const ResumenActividad = ({ actividades }) => {
  const getIconoActividad = (tipo) => {
    switch (tipo) {
      case "Cuestionario completado":
        return <FileCheck className={styles.actividadIcon} />
      case "Nuevo estudiante":
        return <UserPlus className={styles.actividadIcon} />
      case "Reporte generado":
      case "Reporte actualizado":
        return <FileText className={styles.actividadIcon} />
      case "Cuestionario iniciado":
        return <Clock className={styles.actividadIcon} />
      default:
        return <FileCheck className={styles.actividadIcon} />
    }
  }

  const getColorClase = (tipo) => {
    switch (tipo) {
      case "Cuestionario completado":
        return styles.colorSuccess
      case "Nuevo estudiante":
        return styles.colorPrimary
      case "Reporte generado":
      case "Reporte actualizado":
        return styles.colorSecondary
      case "Cuestionario iniciado":
        return styles.colorWarning
      default:
        return styles.colorPrimary
    }
  }

  return (
    <div className={styles.actividadContainer}>
      {actividades.map((actividad) => (
        <div key={actividad.id} className={styles.actividadItem}>
          <div className={`${styles.actividadIconContainer} ${getColorClase(actividad.tipo)}`}>
            {getIconoActividad(actividad.tipo)}
          </div>
          <div className={styles.actividadInfo}>
            <p className={styles.actividadTipo}>{actividad.tipo}</p>
            <p className={styles.actividadEstudiante}>{actividad.estudiante}</p>
          </div>
          <div className={styles.actividadFecha}>{actividad.fecha}</div>
        </div>
      ))}
    </div>
  )
}

export default ResumenActividad
