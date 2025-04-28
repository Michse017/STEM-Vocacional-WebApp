"use client"

import { useState } from "react"
import styles from "./OrientadorDashboard.module.css"
import EstadisticasPanel from "../../components/Orientador/EstadisticasPanel"
import EstudiantesTable from "../../components/Orientador/EstudiantesTable"
import PrediccionesCard from "../../components/Orientador/PrediccionesCard"
import ResumenActividad from "../../components/Orientador/ResumenActividad"
import { BarChart, PieChart, Activity, Users, BookOpen, Brain } from "lucide-react"

const OrientadorDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard")

  // Datos de ejemplo para el dashboard
  const estadisticasData = {
    totalEstudiantes: 248,
    nuevosEstudiantes: 32,
    cuestionariosCompletados: 187,
    promedioTiempoRespuesta: "18 min",
  }

  const estudiantesRecientes = [
    { id: 1, nombre: "Ana García", edad: 17, grado: "11°", fechaRegistro: "2023-04-15", estado: "Completado" },
    { id: 2, nombre: "Carlos Rodríguez", edad: 16, grado: "10°", fechaRegistro: "2023-04-14", estado: "En progreso" },
    { id: 3, nombre: "Sofía Martínez", edad: 17, grado: "11°", fechaRegistro: "2023-04-13", estado: "Completado" },
    { id: 4, nombre: "Diego López", edad: 16, grado: "10°", fechaRegistro: "2023-04-12", estado: "No iniciado" },
    { id: 5, nombre: "Valentina Torres", edad: 17, grado: "11°", fechaRegistro: "2023-04-11", estado: "Completado" },
  ]

  const prediccionesData = [
    {
      id: 1,
      titulo: "Tendencias de Carreras",
      descripcion:
        "Basado en los últimos 50 cuestionarios, se observa un incremento del 15% en interés por carreras STEM.",
      icono: <BarChart className={styles.prediccionIcon} />,
    },
    {
      id: 2,
      titulo: "Distribución de Intereses",
      descripcion:
        "El 40% de estudiantes muestra preferencia por áreas creativas, 35% por ciencias y 25% por humanidades.",
      icono: <PieChart className={styles.prediccionIcon} />,
    },
    {
      id: 3,
      titulo: "Patrones de Respuesta",
      descripcion: "Se detecta correlación entre tiempo de respuesta y consistencia en elecciones vocacionales.",
      icono: <Activity className={styles.prediccionIcon} />,
    },
  ]

  const actividadReciente = [
    { id: 1, tipo: "Cuestionario completado", estudiante: "Ana García", fecha: "15 Abr, 14:30" },
    { id: 2, tipo: "Nuevo estudiante", estudiante: "Miguel Sánchez", fecha: "15 Abr, 11:20" },
    { id: 3, tipo: "Reporte generado", estudiante: "Sofía Martínez", fecha: "14 Abr, 16:45" },
    { id: 4, tipo: "Cuestionario iniciado", estudiante: "Carlos Rodríguez", fecha: "14 Abr, 10:15" },
    { id: 5, tipo: "Reporte actualizado", estudiante: "Valentina Torres", fecha: "13 Abr, 09:30" },
  ]

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard del Orientador</h1>
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Perfil" />
          </div>
          <div className={styles.userName}>
            <p>Dra. Laura Mendoza</p>
            <span>Orientadora Principal</span>
          </div>
        </div>
      </header>

      <nav className={styles.navigation}>
        <ul className={styles.navList}>
          <li
            className={`${styles.navItem} ${activeTab === "dashboard" ? styles.active : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <Activity size={20} />
            <span>Dashboard</span>
          </li>
          <li
            className={`${styles.navItem} ${activeTab === "estudiantes" ? styles.active : ""}`}
            onClick={() => setActiveTab("estudiantes")}
          >
            <Users size={20} />
            <span>Estudiantes</span>
          </li>
          <li
            className={`${styles.navItem} ${activeTab === "cuestionarios" ? styles.active : ""}`}
            onClick={() => setActiveTab("cuestionarios")}
          >
            <BookOpen size={20} />
            <span>Cuestionarios</span>
          </li>
          <li
            className={`${styles.navItem} ${activeTab === "reportes" ? styles.active : ""}`}
            onClick={() => setActiveTab("reportes")}
          >
            <Brain size={20} />
            <span>Reportes IA</span>
          </li>
        </ul>
      </nav>

      <main className={styles.mainContent}>
        <section className={styles.welcomeSection}>
          <h2>Bienvenida, Dra. Mendoza</h2>
          <p>Aquí encontrará un resumen de la actividad reciente y estadísticas de los estudiantes.</p>
        </section>

        <section className={styles.estadisticasSection}>
          <h3 className={styles.sectionTitle}>Estadísticas Generales</h3>
          <EstadisticasPanel data={estadisticasData} />
        </section>

        <div className={styles.twoColumnLayout}>
          <section className={styles.estudiantesSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Estudiantes Recientes</h3>
              <button className={styles.viewAllButton}>Ver todos</button>
            </div>
            <EstudiantesTable estudiantes={estudiantesRecientes} />
          </section>

          <section className={styles.actividadSection}>
            <h3 className={styles.sectionTitle}>Actividad Reciente</h3>
            <ResumenActividad actividades={actividadReciente} />
          </section>
        </div>

        <section className={styles.prediccionesSection}>
          <h3 className={styles.sectionTitle}>Predicciones y Análisis IA</h3>
          <div className={styles.prediccionesGrid}>
            {prediccionesData.map((prediccion) => (
              <PrediccionesCard key={prediccion.id} prediccion={prediccion} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default OrientadorDashboard
