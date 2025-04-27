"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import CuestionarioList from "../../components/Cuestionarios/CuestionarioList"
import styles from "./Cuestionarios.module.css"

// Datos de ejemplo para los cuestionarios
const cuestionariosData = [
  {
    id: 1,
    titulo: "Colegio",
    descripcion: "Información sobre la institución educativa y su entorno",
    fechaLimite: "2025-05-15",
    duracion: "20 minutos",
    preguntas: 12,
    completado: true,
    progreso: 100,
  },
  {
    id: 2,
    titulo: "Condiciones Socioeconómicas Generales",
    descripcion: "Evaluación de factores socioeconómicos generales",
    fechaLimite: "2025-05-20",
    duracion: "25 minutos",
    preguntas: 15,
    completado: false,
    progreso: 60,
  },
  {
    id: 3,
    titulo: "Estudiante",
    descripcion: "Información personal y académica del estudiante",
    fechaLimite: "2025-05-25",
    duracion: "15 minutos",
    preguntas: 10,
    completado: true,
    progreso: 100,
  },
  {
    id: 4,
    titulo: "Factores Educativos Familiares",
    descripcion: "Análisis del entorno educativo familiar",
    fechaLimite: "2025-05-30",
    duracion: "30 minutos",
    preguntas: 18,
    completado: false,
    progreso: 30,
  },
  {
    id: 5,
    titulo: "Factores Socioeconómicos",
    descripcion: "Evaluación detallada de factores socioeconómicos específicos",
    fechaLimite: "2025-06-05",
    duracion: "35 minutos",
    preguntas: 20,
    completado: false,
    progreso: 0,
  },
  {
    id: 6,
    titulo: "Rendimiento Académico",
    descripcion: "Análisis del desempeño académico y factores relacionados",
    fechaLimite: "2025-06-10",
    duracion: "25 minutos",
    preguntas: 15,
    completado: false,
    progreso: 0,
  },
]

const Cuestionarios = () => {
  const [cuestionarios] = useState(cuestionariosData)

  // Calcular el progreso general
  const progresoGeneral = Math.round(cuestionarios.reduce((acc, curr) => acc + curr.progreso, 0) / cuestionarios.length)

  // Cuestionarios completados
  const completados = cuestionarios.filter((c) => c.completado).length

  return (
    <div className="container">
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/dashboard" className={styles.backButton}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-gradient">Cuestionarios</h1>
        </div>
      </div>

      <div className={styles.progresoCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Progreso General</h2>
          <p className={styles.cardDescription}>Tu avance en la completación de todos los cuestionarios</p>
        </div>
        <div className={styles.cardContent}>
          <div className={styles.progresoInfo}>
            <span className={styles.progresoTexto}>{progresoGeneral}% completado</span>
            <span className={styles.progresoContador}>
              {completados} de {cuestionarios.length} cuestionarios
            </span>
          </div>
          <div className={styles.progresoContainer}>
            <div className={styles.progresoBar} style={{ width: `${progresoGeneral}%` }}></div>
          </div>
        </div>
      </div>

      <CuestionarioList cuestionarios={cuestionarios} />
    </div>
  )
}

export default Cuestionarios
