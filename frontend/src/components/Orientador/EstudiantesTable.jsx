"use client"

import React, { useState } from "react"
import styles from "./EstudiantesTable.module.css"
import { ChevronDown, ChevronUp, Search, Filter, MoreHorizontal, Eye, FileText, Edit, Trash2 } from "lucide-react"

const EstudiantesTable = ({ estudiantes }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" })
  const [searchTerm, setSearchTerm] = useState("")
  const [activeDropdown, setActiveDropdown] = useState(null)

  const handleSort = (key) => {
    let direction = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null
    return sortConfig.direction === "ascending" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
  }

  const sortedEstudiantes = React.useMemo(() => {
    const sortableItems = [...estudiantes]
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      })
    }
    return sortableItems
  }, [estudiantes, sortConfig])

  const filteredEstudiantes = sortedEstudiantes.filter((estudiante) =>
    estudiante.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const toggleDropdown = (id) => {
    setActiveDropdown(activeDropdown === id ? null : id)
  }

  const getStatusClass = (estado) => {
    switch (estado) {
      case "Completado":
        return styles.statusCompleted
      case "En progreso":
        return styles.statusInProgress
      case "No iniciado":
        return styles.statusNotStarted
      default:
        return ""
    }
  }

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableControls}>
        <div className={styles.searchContainer}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar estudiante..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className={styles.filterButton}>
          <Filter size={16} />
          <span>Filtrar</span>
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.sortableHeader} onClick={() => handleSort("nombre")}>
                <span>Nombre</span>
                {getSortIcon("nombre")}
              </th>
              <th className={styles.sortableHeader} onClick={() => handleSort("edad")}>
                <span>Edad</span>
                {getSortIcon("edad")}
              </th>
              <th className={styles.sortableHeader} onClick={() => handleSort("grado")}>
                <span>Grado</span>
                {getSortIcon("grado")}
              </th>
              <th className={styles.sortableHeader} onClick={() => handleSort("fechaRegistro")}>
                <span>Fecha Registro</span>
                {getSortIcon("fechaRegistro")}
              </th>
              <th className={styles.sortableHeader} onClick={() => handleSort("estado")}>
                <span>Estado</span>
                {getSortIcon("estado")}
              </th>
              <th className={styles.actionsHeader}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredEstudiantes.map((estudiante) => (
              <tr key={estudiante.id}>
                <td className={styles.nameCell}>{estudiante.nombre}</td>
                <td>{estudiante.edad}</td>
                <td>{estudiante.grado}</td>
                <td>{estudiante.fechaRegistro}</td>
                <td>
                  <span className={`${styles.statusBadge} ${getStatusClass(estudiante.estado)}`}>
                    {estudiante.estado}
                  </span>
                </td>
                <td className={styles.actionsCell}>
                  <div className={styles.actionsWrapper}>
                    <button className={styles.actionsButton} onClick={() => toggleDropdown(estudiante.id)}>
                      <MoreHorizontal size={16} />
                    </button>
                    {activeDropdown === estudiante.id && (
                      <div className={styles.actionsDropdown}>
                        <button className={styles.actionItem}>
                          <Eye size={14} />
                          <span>Ver perfil</span>
                        </button>
                        <button className={styles.actionItem}>
                          <FileText size={14} />
                          <span>Ver reporte</span>
                        </button>
                        <button className={styles.actionItem}>
                          <Edit size={14} />
                          <span>Editar</span>
                        </button>
                        <button className={`${styles.actionItem} ${styles.deleteAction}`}>
                          <Trash2 size={14} />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredEstudiantes.length === 0 && (
        <div className={styles.noResults}>No se encontraron estudiantes que coincidan con la búsqueda.</div>
      )}
    </div>
  )
}

export default EstudiantesTable
