"use client"

import { useState } from "react"
import styles from "./ReporteIA.module.css"
import { ArrowLeft, Download, Share2, Filter, BarChart2, PieChart, LineChart } from "lucide-react"
import { Link } from "react-router-dom"

const ReporteIA = () => {
  const [filtroActivo, setFiltroActivo] = useState("todos")
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("trimestre")

  // Datos de ejemplo para el reporte
  const estudianteSeleccionado = {
    id: 1,
    nombre: "Ana García",
    edad: 17,
    grado: "11°",
    fechaEvaluacion: "15 de abril, 2023",
    perfilResumen:
      "Estudiante con fuerte inclinación hacia las ciencias y tecnología, con habilidades analíticas destacadas y preferencia por el trabajo independiente.",
  }

  const areasInteres = [
    { nombre: "Ciencias", porcentaje: 85 },
    { nombre: "Tecnología", porcentaje: 78 },
    { nombre: "Ingeniería", porcentaje: 72 },
    { nombre: "Matemáticas", porcentaje: 68 },
    { nombre: "Artes", porcentaje: 45 },
    { nombre: "Humanidades", porcentaje: 40 },
    { nombre: "Ciencias Sociales", porcentaje: 35 },
    { nombre: "Deportes", porcentaje: 30 },
  ]

  const habilidades = [
    { nombre: "Pensamiento analítico", nivel: 90 },
    { nombre: "Resolución de problemas", nivel: 85 },
    { nombre: "Investigación", nivel: 80 },
    { nombre: "Trabajo en equipo", nivel: 65 },
    { nombre: "Comunicación", nivel: 60 },
    { nombre: "Liderazgo", nivel: 55 },
  ]

  const carrerasRecomendadas = [
    {
      nombre: "Ingeniería en Sistemas",
      compatibilidad: 95,
      descripcion: "Diseño y desarrollo de sistemas informáticos y software.",
    },
    {
      nombre: "Ciencias de la Computación",
      compatibilidad: 92,
      descripcion: "Estudio de algoritmos, programación y teoría computacional.",
    },
    {
      nombre: "Ingeniería Biomédica",
      compatibilidad: 88,
      descripcion: "Aplicación de principios de ingeniería a la medicina y biología.",
    },
    { nombre: "Física", compatibilidad: 85, descripcion: "Estudio de la materia, energía y sus interacciones." },
    {
      nombre: "Matemáticas Aplicadas",
      compatibilidad: 82,
      descripcion: "Aplicación de métodos matemáticos a problemas prácticos.",
    },
  ]

  const recomendaciones = [
    "Participar en olimpiadas de matemáticas y ciencias para fortalecer habilidades analíticas.",
    "Explorar cursos introductorios de programación para confirmar interés en el área.",
    "Visitar facultades de ingeniería y ciencias durante jornadas de puertas abiertas.",
    "Contactar con profesionales en las áreas de interés para conocer experiencias reales.",
    "Desarrollar proyectos personales relacionados con tecnología para construir portafolio.",
  ]

  return (
    <div className={styles.reporteContainer}>
      <header className={styles.reporteHeader}>
        <Link to="/orientador/dashboard" className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Volver al Dashboard</span>
        </Link>
        <div className={styles.reporteActions}>
          <button className={styles.actionButton}>
            <Download size={18} />
            <span>Descargar PDF</span>
          </button>
          <button className={styles.actionButton}>
            <Share2 size={18} />
            <span>Compartir</span>
          </button>
        </div>
      </header>

      <main className={styles.reporteContent}>
        <section className={styles.estudianteInfo}>
          <div className={styles.estudianteHeader}>
            <h1 className={styles.estudianteNombre}>{estudianteSeleccionado.nombre}</h1>
            <div className={styles.estudianteMeta}>
              <span>{estudianteSeleccionado.edad} años</span>
              <span>•</span>
              <span>Grado: {estudianteSeleccionado.grado}</span>
              <span>•</span>
              <span>Evaluación: {estudianteSeleccionado.fechaEvaluacion}</span>
            </div>
          </div>
          <div className={styles.perfilResumen}>
            <h2 className={styles.sectionTitle}>Perfil del Estudiante</h2>
            <p>{estudianteSeleccionado.perfilResumen}</p>
          </div>
        </section>

        <div className={styles.reporteFilters}>
          <div className={styles.filterGroup}>
            <Filter size={16} />
            <span>Filtrar por:</span>
            <select
              value={filtroActivo}
              onChange={(e) => setFiltroActivo(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="todos">Todos los resultados</option>
              <option value="intereses">Áreas de interés</option>
              <option value="habilidades">Habilidades</option>
              <option value="carreras">Carreras recomendadas</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <span>Periodo:</span>
            <select
              value={periodoSeleccionado}
              onChange={(e) => setPeriodoSeleccionado(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="mes">Último mes</option>
              <option value="trimestre">Último trimestre</option>
              <option value="semestre">Último semestre</option>
              <option value="anio">Último año</option>
            </select>
          </div>
        </div>

        <div className={styles.reporteGrid}>
          <section className={styles.areasInteres}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Áreas de Interés</h2>
              <div className={styles.chartIcons}>
                <BarChart2 size={18} className={styles.activeChart} />
                <PieChart size={18} />
              </div>
            </div>
            <div className={styles.barChartContainer}>
              {areasInteres.map((area, index) => (
                <div key={index} className={styles.barChartItem}>
                  <div className={styles.barLabel}>{area.nombre}</div>
                  <div className={styles.barContainer}>
                    <div className={styles.bar} style={{ width: `${area.porcentaje}%` }}></div>
                    <span className={styles.barValue}>{area.porcentaje}%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.habilidades}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Habilidades Destacadas</h2>
              <div className={styles.chartIcons}>
                <LineChart size={18} className={styles.activeChart} />
                <BarChart2 size={18} />
              </div>
            </div>
            <div className={styles.skillsContainer}>
              {habilidades.map((habilidad, index) => (
                <div key={index} className={styles.skillItem}>
                  <div className={styles.skillInfo}>
                    <span className={styles.skillName}>{habilidad.nombre}</span>
                    <span className={styles.skillValue}>{habilidad.nivel}%</span>
                  </div>
                  <div className={styles.skillBar}>
                    <div className={styles.skillProgress} style={{ width: `${habilidad.nivel}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.carrerasRecomendadas}>
            <h2 className={styles.sectionTitle}>Carreras Recomendadas</h2>
            <div className={styles.carrerasList}>
              {carrerasRecomendadas.map((carrera, index) => (
                <div key={index} className={styles.carreraItem}>
                  <div className={styles.carreraHeader}>
                    <h3 className={styles.carreraNombre}>{carrera.nombre}</h3>
                    <div className={styles.compatibilidadBadge}>{carrera.compatibilidad}% compatible</div>
                  </div>
                  <p className={styles.carreraDescripcion}>{carrera.descripcion}</p>
                  <div className={styles.carreraBar}>
                    <div className={styles.carreraProgress} style={{ width: `${carrera.compatibilidad}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.recomendaciones}>
            <h2 className={styles.sectionTitle}>Recomendaciones Personalizadas</h2>
            <ul className={styles.recomendacionesList}>
              {recomendaciones.map((recomendacion, index) => (
                <li key={index} className={styles.recomendacionItem}>
                  {recomendacion}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className={styles.conclusiones}>
          <h2 className={styles.sectionTitle}>Conclusiones del Análisis</h2>
          <div className={styles.conclusionesContent}>
            <p>
              El análisis de los resultados de Ana García muestra una clara orientación hacia las áreas STEM (Ciencia,
              Tecnología, Ingeniería y Matemáticas), con particular énfasis en ciencias computacionales e ingeniería.
              Sus habilidades analíticas y de resolución de problemas son notablemente altas, lo que refuerza su
              compatibilidad con estas áreas.
            </p>
            <p>
              La estudiante muestra un perfil coherente a lo largo del tiempo, manteniendo intereses consistentes en las
              evaluaciones realizadas durante el último trimestre. Se recomienda explorar carreras en el ámbito
              tecnológico y científico, con especial atención a aquellas que permitan el desarrollo de soluciones
              innovadoras y trabajo analítico.
            </p>
            <p>
              Es importante notar que, aunque sus habilidades de comunicación y trabajo en equipo no son tan destacadas
              como las analíticas, estas pueden desarrollarse a través de actividades específicas. Se sugiere un
              seguimiento personalizado para fortalecer estas áreas complementarias que serán valiosas
              independientemente de la carrera elegida.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default ReporteIA
