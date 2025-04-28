import styles from "./PrediccionesCard.module.css"

const PrediccionesCard = ({ prediccion }) => {
  return (
    <div className={styles.prediccionCard}>
      <div className={styles.prediccionHeader}>
        <div className={styles.prediccionIconContainer}>{prediccion.icono}</div>
        <h3 className={styles.prediccionTitulo}>{prediccion.titulo}</h3>
      </div>
      <p className={styles.prediccionDescripcion}>{prediccion.descripcion}</p>
      <button className={styles.prediccionButton}>Ver detalles</button>
    </div>
  )
}

export default PrediccionesCard
