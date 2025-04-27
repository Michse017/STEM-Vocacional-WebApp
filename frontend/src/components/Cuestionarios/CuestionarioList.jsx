import CuestionarioCard from "./CuestionarioCard"
import styles from "./CuestionarioList.module.css"

const CuestionarioList = ({ cuestionarios }) => {
  return (
    <div className={styles.grid}>
      {cuestionarios.map((cuestionario) => (
        <CuestionarioCard key={cuestionario.id} cuestionario={cuestionario} />
      ))}
    </div>
  )
}

export default CuestionarioList
