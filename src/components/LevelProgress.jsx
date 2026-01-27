import styles from './LevelProgress.module.css';

export function LevelProgress({ level, passed, total }) {
  const percentage = total > 0 ? (passed / total) * 100 : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.label}>Level {level} Progress</span>
        <span className={styles.count}>
          {passed} / {total} items passed
        </span>
      </div>
      <div className={styles.barContainer}>
        <div
          className={styles.bar}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className={styles.percentage}>{percentage.toFixed(1)}% complete</p>
    </div>
  );
}
