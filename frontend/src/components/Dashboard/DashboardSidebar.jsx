import { Link, useLocation } from "react-router-dom";
import styles from "./DashboardSidebar.module.css";

const DashboardSidebar = ({ isOpen }) => {
  const location = useLocation();
  const menuItems = [
    { icon: "📊", label: "Dashboard", to: "/dashboard" },
    { icon: "📝", label: "Cuestionarios", to: "/cuestionarios" },
    { icon: "📈", label: "Resultados", to: "/resultados" },
    { icon: "📚", label: "Recursos", to: "/recursos" },
    { icon: "⚙️", label: "Configuración", to: "/configuracion" },
  ];

  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
      <div className={styles.sidebarHeader}>
        <div className={styles.logo}>
          <span className={styles.logoText}>STEM</span>
        </div>
      </div>

      <div className={styles.sidebarContent}>
        <nav className={styles.sidebarMenu}>
          <ul>
            {menuItems.map((item, index) => (
              <li
                key={index}
                className={location.pathname.toLowerCase() === item.to ? styles.active : ""}
              >
                <Link to={item.to}>
                  <span className={styles.menuIcon}>{item.icon}</span>
                  <span className={styles.menuText}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className={styles.sidebarFooter}>
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            <span>US</span>
          </div>
          <div className={styles.userDetails}>
            <div className={styles.userName}>Usuario STEM</div>
            <div className={styles.userRole}>Estudiante</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;
