import styles from "./DashboardStatsCard.module.css"

const DashboardStatsCard = ({ title, value, icon, color }) => {
  const getColorClass = () => {
    switch (color) {
      case "blue":
        return styles.statsCardBlue
      case "green":
        return styles.statsCardGreen
      case "orange":
        return styles.statsCardOrange
      case "red":
        return styles.statsCardRed
      default:
        return styles.statsCardBlue
    }
  }

  return (
    <div className={`${styles.statsCard} ${getColorClass()}`}>
      <div className={styles.statsCardContent}>
        <div className={styles.statsCardInfo}>
          <h3 className={styles.statsCardTitle}>{title}</h3>
          <div className={styles.statsCardValue}>{value}</div>
        </div>
        <div className={styles.statsCardIcon}>
          <span>{icon}</span>
        </div>
      </div>
    </div>
  )
}

export default DashboardStatsCard
