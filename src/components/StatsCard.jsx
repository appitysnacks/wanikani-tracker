import styles from './StatsCard.module.css';

export function StatsCard({ title, value, subtitle, color }) {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.value} style={{ color: color || '#1a1a2e' }}>
        {value}
      </p>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}
