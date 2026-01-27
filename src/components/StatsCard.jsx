import styles from './StatsCard.module.css';

export function StatsCard({ title, value, subtitle, color, sideStats }) {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.content}>
        <div className={styles.main}>
          <p className={styles.value} style={{ color: color || '#1a1a2e' }}>
            {value}
          </p>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {sideStats && (
          <div className={styles.sideStats}>
            {sideStats.map((stat, i) => (
              <div key={i} className={styles.sideStat}>
                <span className={styles.sideLabel}>{stat.label}</span>
                <span className={styles.sideValue}>{stat.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
