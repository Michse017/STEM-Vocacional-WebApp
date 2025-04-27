"use client"

import { useState } from "react"
import styles from "./Dashboard.module.css"
import DashboardSidebar from "../../components/Dashboard/DashboardSidebar"
import DashboardHeader from "../../components/Dashboard/DashboardHeader"
import DashboardStatsCard from "../../components/Dashboard/DashboardStatsCard"

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Datos de ejemplo para los cuestionarios
  const questionnaires = [
    {
      id: 1,
      title: "Colegio",
      icon: "🏫",
      progress: 40,
      status: "in-progress",
    },
    {
      id: 2,
      title: "Condiciones Socioeconómicas Generales",
      icon: "📊",
      progress: 0,
      status: "not-started",
    },
    {
      id: 3,
      title: "Estudiante",
      icon: "👨‍🎓",
      progress: 100,
      status: "completed",
    },
    {
      id: 4,
      title: "Factores Educativos Familiares",
      icon: "👪",
      progress: 75,
      status: "in-progress",
    },
    {
      id: 5,
      title: "Factores Socioeconómicos",
      icon: "💰",
      progress: 25,
      status: "in-progress",
    },
    {
      id: 6,
      title: "Rendimiento Académico",
      icon: "📝",
      progress: 60,
      status: "in-progress",
    },
  ]

  // Datos para las tarjetas de estadísticas
  const statsData = [
    {
      title: "Cuestionarios Completados",
      value: "1/6",
      icon: "✅",
      color: "green",
    },
    {
      title: "Progreso General",
      value: "50%",
      icon: "📈",
      color: "blue",
    },
    {
      title: "Tiempo Promedio",
      value: "15 min",
      icon: "⏱️",
      color: "orange",
    },
    {
      title: "Próximo Vencimiento",
      value: "3 días",
      icon: "📅",
      color: "red",
    },
  ]

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className={styles.dashboardContainer}>
      <DashboardSidebar isOpen={sidebarOpen} />
      <div className={`${styles.dashboardMain} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
        <DashboardHeader toggleSidebar={toggleSidebar} />

        <div className={styles.dashboardContent}>
          <h1 className={styles.dashboardTitle}>Dashboard Personal</h1>

          <div className={styles.statsGrid}>
            {statsData.map((stat, index) => (
              <DashboardStatsCard
                key={index}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
              />
            ))}
          </div>

          <div className={styles.dashboardSection}>
            <h2 className={styles.sectionTitle}>Cuestionarios Disponibles</h2>
            <div className={styles.questionnairesGrid}>
              {questionnaires.map((questionnaire) => (
                <div key={questionnaire.id} className={styles.questionnaireCard}>
                  <div className={styles.questionnaireHeader}>
                    <span className={styles.questionnaireIcon}>{questionnaire.icon}</span>
                    <h3 className={styles.questionnaireTitle}>{questionnaire.title}</h3>
                  </div>
                  <div className={styles.progressContainer}>
                    <div className={styles.progressInfo}>
                      <span className={styles.progressStatus}>
                        {questionnaire.status === "not-started"
                          ? "No iniciado"
                          : questionnaire.status === "in-progress"
                            ? `${questionnaire.progress}% completado`
                            : "Completado"}
                      </span>
                      <span className={styles.progressPercentage}>{questionnaire.progress}%</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div className={styles.progressIndicator} style={{ width: `${questionnaire.progress}%` }}></div>
                    </div>
                  </div>
                  <button
                    className={`${styles.questionnaireButton} ${
                      questionnaire.status === "completed" ? styles.buttonCompleted : styles.buttonPrimary
                    }`}
                  >
                    {questionnaire.status === "not-started"
                      ? "Comenzar"
                      : questionnaire.status === "in-progress"
                        ? "Continuar"
                        : "Revisar"}
                    <svg
                      className={styles.buttonIcon}
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
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.dashboardSection}>
            <h2 className={styles.sectionTitle}>Progreso General</h2>
            <div className={styles.radarChartContainer}>
              <div className={styles.radarChartPlaceholder}>
                <svg
                  className={styles.radarIcon}
                  xmlns="http://www.w3.org/2000/svg"
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 2a10 10 0 0 1 10 10"></path>
                  <path d="M12 12 7 4.9"></path>
                  <path d="M12 12l5-1.5"></path>
                  <path d="M12 12l-1 5"></path>
                </svg>
                <p>Gráfico de radar con tu progreso en cada dimensión</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
