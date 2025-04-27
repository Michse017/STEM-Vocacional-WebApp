"use client"

import { useState, useEffect } from "react"
import styles from "./PerfilEstadisticas.module.css"

const PerfilEstadisticas = ({ userId }) => {
  const [estadisticas, setEstadisticas] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulación de carga de datos
    const fetchEstadisticas = async () => {
      setIsLoading(true)
      try {
        // Simulación de llamada a API
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Datos de ejemplo
        const data = {
          cuestionariosCompletados: 4,
          cuestionariosPendientes: 2,
          progresoGeneral: 67,
          ultimaActividad: "2023-06-15T14:30:00",
          tiempoPromedio: 18, // minutos
          categorias: [
            { nombre: "Colegio", completado: true, puntuacion: 85 },
            { nombre: "Condiciones Socioeconómicas", completado: true, puntuacion: 72 },
            { nombre: "Estudiante", completado: true, puntuacion: 90 },
            { nombre: "Factores Educativos", completado: true, puntuacion: 78 },
            { nombre: "Factores Socioeconómicos", completado: false, puntuacion: 78 },
            { nombre: "Factores Socioeconómicos", completado: false, puntuacion: 45 },
            { nombre: "Rendimiento Académico", completado: false, puntuacion: 0 },
          ],
        }

        setEstadisticas(data)
      } catch (error) {
        console.error("Error al cargar estadísticas:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEstadisticas()
  }, [userId])

  // Formatear fecha
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return ""
    const fecha = new Date(fechaStr)
    return fecha.toLocaleDateString() + " " + fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando estadísticas...</p>
      </div>
    )
  }

  return (
    <div className={styles.estadisticas}>
      <h2 className={styles.sectionTitle}>Estadísticas Académicas</h2>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{estadisticas.cuestionariosCompletados}</div>
          <div className={styles.statLabel}>Cuestionarios completados</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{estadisticas.cuestionariosPendientes}</div>
          <div className={styles.statLabel}>Cuestionarios pendientes</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{estadisticas.progresoGeneral}%</div>
          <div className={styles.statLabel}>Progreso general</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{estadisticas.tiempoPromedio} min</div>
          <div className={styles.statLabel}>Tiempo promedio</div>
        </div>
      </div>

      <div className={styles.activitySection}>
        <h3 className={styles.subsectionTitle}>Última actividad</h3>
        <p className={styles.activityDate}>{formatearFecha(estadisticas.ultimaActividad)}</p>
      </div>

      <div className={styles.categoriesSection}>
        <h3 className={styles.subsectionTitle}>Rendimiento por categoría</h3>
        <div className={styles.categoriesList}>
          {estadisticas.categorias.map((categoria, index) => (
            <div key={index} className={styles.categoryItem}>
              <div className={styles.categoryHeader}>
                <span className={styles.categoryName}>{categoria.nombre}</span>
                {categoria.completado ? (
                  <span className={styles.categoryBadge}>Completado</span>
                ) : (
                  <span className={`${styles.categoryBadge} ${styles.pendiente}`}>Pendiente</span>
                )}
              </div>
              <div className={styles.categoryProgress}>
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar} style={{ width: `${categoria.puntuacion}%` }}></div>
                </div>
                <span className={styles.progressValue}>{categoria.puntuacion}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PerfilEstadisticas
