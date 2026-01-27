import styles from './RecentMistakes.module.css';

const TYPE_COLORS = {
  radical: '#00AAFF',
  kanji: '#FF0080',
  vocabulary: '#9B59B6',
};

export function RecentMistakes({ mistakes }) {
  if (!mistakes || mistakes.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Recent Mistakes</h3>
        <p className={styles.empty}>No recent mistakes - nice work!</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Recent Mistakes</h3>
      <div className={styles.list}>
        {mistakes.map((mistake) => (
          <div key={mistake.id} className={styles.item}>
            <span
              className={styles.character}
              style={{ background: TYPE_COLORS[mistake.type] || '#666' }}
            >
              {mistake.characters}
            </span>
            <div className={styles.details}>
              <span className={styles.meaning}>
                {mistake.meanings.join(', ') || '—'}
              </span>
              {mistake.readings.length > 0 && (
                <span className={styles.reading}>
                  {mistake.readings.join(', ')}
                </span>
              )}
            </div>
            <div className={styles.errors}>
              {mistake.incorrectMeaning > 0 && (
                <span className={styles.errorBadge} title="Meaning errors">
                  M: {mistake.incorrectMeaning}
                </span>
              )}
              {mistake.incorrectReading > 0 && (
                <span className={styles.errorBadge} title="Reading errors">
                  R: {mistake.incorrectReading}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
