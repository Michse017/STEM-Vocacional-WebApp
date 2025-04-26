import { Link } from "react-router-dom";
import styles from "./LandingPage.module.css";

const LandingPage = () => {
  const features = [
    {
      icon: "📝",
      title: "Cuestionarios en Línea",
      description: "Responde encuestas sobre factores cognitivos, familiares, socioeconómicos y de autoeficacia.",
    },
    {
      icon: "☁️",
      title: "Almacenamiento Seguro",
      description: "Tus datos se almacenan de forma segura en la nube con encriptación y respaldos automáticos.",
    },
    {
      icon: "🧠",
      title: "Modelo Predictivo",
      description: "Recibe recomendaciones personalizadas de carreras STEM/no STEM basadas en tus respuestas.",
    },
    {
      icon: "📊",
      title: "Reportes Automatizados",
      description: "Accede a informes detallados con filtros por año, programa, género y más.",
    },
    {
      icon: "👥",
      title: "Gestión de Usuarios",
      description: "Diferentes niveles de acceso para estudiantes y administradores.",
    },
    {
      icon: "📈",
      title: "Visualización de Resultados",
      description: "Consulta tu historial de respuestas y recomendaciones vocacionales con gráficas interactivas.",
    },
  ];

  return (
    <div className={styles.landingPage}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>
            Descubre tu futuro en <span className={styles.highlight}>STEM</span>
          </h1>
          <p>
            Una plataforma inteligente que te ayuda a encontrar tu camino profesional ideal basado en tus habilidades y
            preferencias.
          </p>
          <div className={styles.heroCta}>
            <Link to="/login" className={styles.primaryButton}>
              Iniciar Ahora
            </Link>
            <Link to="/about" className={styles.secondaryButton}>
              Conocer Más
            </Link>
          </div>
        </div>
        <div className={styles.heroImage}>
          <div className={styles.imageContainer}>
            <div className={styles.floatingElement} style={{ animationDelay: "0s" }}>
              🧪
            </div>
            <div className={styles.floatingElement} style={{ animationDelay: "1s" }}>
              💻
            </div>
            <div className={styles.floatingElement} style={{ animationDelay: "2s" }}>
              🔬
            </div>
            <div className={styles.floatingElement} style={{ animationDelay: "3s" }}>
              🔧
            </div>
            <div className={styles.floatingElement} style={{ animationDelay: "4s" }}>
              📊
            </div>
          </div>
        </div>
      </section>

      <section className={styles.about}>
        <div className={styles.sectionHeader}>
          <h2>
            ¿Qué es <span className={styles.highlight}>STEM Vocational</span>?
          </h2>
          <div className={styles.underline}></div>
        </div>
        <p>
          STEM Vocational es una plataforma innovadora diseñada para ayudar a los estudiantes a descubrir su potencial
          en carreras STEM (Ciencia, Tecnología, Ingeniería y Matemáticas) a través de un análisis personalizado de sus
          habilidades, intereses y factores socioeconómicos.
        </p>
        <p>
          Utilizando modelos predictivos avanzados, ofrecemos recomendaciones vocacionales precisas que son validadas
          por orientadores profesionales para garantizar su exactitud y relevancia.
        </p>
      </section>

      <section className={styles.features}>
        <div className={styles.sectionHeader}>
          <h2>Características Principales</h2>
          <div className={styles.underline}></div>
        </div>
        <div className={styles.featureGrid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureCard}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.process}>
        <div className={styles.sectionHeader}>
          <h2>Cómo Funciona</h2>
          <div className={styles.underline}></div>
        </div>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <h3>Responde Cuestionarios</h3>
            <p>Completa encuestas sobre tus habilidades, intereses y entorno.</p>
          </div>
          <div className={styles.stepArrow}>→</div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <h3>Análisis Predictivo</h3>
            <p>Nuestro modelo analiza tus respuestas y genera recomendaciones.</p>
          </div>
          <div className={styles.stepArrow}>→</div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <h3>Validación Profesional</h3>
            <p>Orientadores revisan y ajustan las sugerencias para mayor precisión.</p>
          </div>
          <div className={styles.stepArrow}>→</div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>4</div>
            <h3>Resultados Personalizados</h3>
            <p>Recibe informes detallados con recomendaciones vocacionales.</p>
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <h2>¿Listo para descubrir tu camino profesional?</h2>
        <p>Únete a STEM Vocational hoy y comienza tu viaje hacia una carrera que realmente se adapte a ti.</p>
        <Link to="/login" className={styles.primaryButton}>
          Iniciar Ahora
        </Link>
      </section>
    </div>
  );
};

export default LandingPage;
