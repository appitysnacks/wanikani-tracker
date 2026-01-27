import styles from './LevelProgress.module.css';

export function LevelProgress({ level, passed, started, total }) {
  const passedPct = total > 0 ? (passed / total) * 100 : 0;
  const startedPct = total > 0 ? (started / total) * 100 : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.label}>Level {level} Progress</span>
        <span className={styles.count}>
          {started} / {total} started · {passed} passed
        </span>
      </div>
      <div className={styles.barContainer}>
        <div
          className={styles.barStarted}
          style={{ width: `${startedPct}%` }}
        />
        <div
          className={styles.barPassed}
          style={{ width: `${passedPct}%` }}
        />
      </div>
      <p className={styles.percentage}>{startedPct.toFixed(1)}% started · {passedPct.toFixed(1)}% at Guru+</p>
    </div>
  );
}
