"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import PerfilCard from "../../components/Perfil/PerfilCard"
import PerfilForm from "../../components/Perfil/PerfilForm"
import PerfilEstadisticas from "../../components/Perfil/PerfilEstadisticas"
import PerfilSeguridad from "../../components/Perfil/PerfilSeguridad"
import styles from "./Perfil.module.css"

const Perfil = () => {
  // Estado para manejar la pestaña activa
  const [activeTab, setActiveTab] = useState("informacion")

  // Datos de ejemplo del usuario
  const [userData, setUserData] = useState({
    nombre: "Ana María Rodríguez",
    email: "ana.rodriguez@ejemplo.com",
    telefono: "+34 612 345 678",
    fechaNacimiento: "1998-05-12",
    institucion: "Universidad Autónoma de Madrid",
    carrera: "Psicología",
    semestre: "6to semestre",
    fotoPerfil: "https://i.pravatar.cc/300?img=25",
  })

  // Función para actualizar los datos del usuario
  const handleUpdateUserData = (newData) => {
    setUserData({ ...userData, ...newData })
  }

  // Renderizar contenido según la pestaña activa
  const renderContent = () => {
    switch (activeTab) {
      case "informacion":
        return <PerfilCard userData={userData} />
      case "editar":
        return <PerfilForm userData={userData} onUpdate={handleUpdateUserData} />
      case "estadisticas":
        return <PerfilEstadisticas userId={1} />
      case "seguridad":
        return <PerfilSeguridad email={userData.email} />
      default:
        return <PerfilCard userData={userData} />
    }
  }

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
          <h1 className="text-gradient">Perfil de Usuario</h1>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.sidebar}>
          <div className={styles.userInfo}>
            <div className={styles.avatarContainer}>
              <img src={userData.fotoPerfil || "/placeholder.svg"} alt="Foto de perfil" className={styles.avatar} />
            </div>
            <h2 className={styles.userName}>{userData.nombre}</h2>
            <p className={styles.userRole}>{userData.carrera}</p>
          </div>

          <nav className={styles.navigation}>
            <button
              className={`${styles.navButton} ${activeTab === "informacion" ? styles.active : ""}`}
              onClick={() => setActiveTab("informacion")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.navIcon}
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              Información Personal
            </button>
            <button
              className={`${styles.navButton} ${activeTab === "editar" ? styles.active : ""}`}
              onClick={() => setActiveTab("editar")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.navIcon}
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Editar Perfil
            </button>
            <button
              className={`${styles.navButton} ${activeTab === "estadisticas" ? styles.active : ""}`}
              onClick={() => setActiveTab("estadisticas")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.navIcon}
              >
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              Estadísticas
            </button>
            <button
              className={`${styles.navButton} ${activeTab === "seguridad" ? styles.active : ""}`}
              onClick={() => setActiveTab("seguridad")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.navIcon}
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Seguridad
            </button>
          </nav>
        </div>

        <div className={styles.mainContent}>{renderContent()}</div>
      </div>
    </div>
  )
}

export default Perfil
