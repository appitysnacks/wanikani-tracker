import styles from './TopMistakes.module.css';

const TYPE_COLORS = {
  radical: '#00AAFF',
  kanji: '#FF0080',
  vocabulary: '#9B59B6',
};

function MistakeList({ items, countKey }) {
  if (!items || items.length === 0) {
    return <p className={styles.empty}>No mistakes yet!</p>;
  }

  return (
    <div className={styles.list}>
      {items.map((item, index) => (
        <div key={item.subjectId} className={styles.item}>
          <span className={styles.rank}>#{index + 1}</span>
          <span
            className={styles.character}
            style={{ background: TYPE_COLORS[item.type] || '#666' }}
          >
            {item.characters}
          </span>
          <div className={styles.details}>
            <span className={styles.meaning}>
              {item.meanings.join(', ') || '—'}
            </span>
            {item.readings.length > 0 && (
              <span className={styles.reading}>
                {item.readings.join(', ')}
              </span>
            )}
          </div>
          <span className={styles.count}>
            {item[countKey]}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TopMistakes({ meanings, readings, radicals }) {
  return (
    <div className={styles.columns}>
      <div className={styles.container}>
        <h3 className={styles.title}>Most Missed Meanings</h3>
        <MistakeList items={meanings} countKey="incorrectMeaning" />
      </div>
      <div className={styles.container}>
        <h3 className={styles.title}>Most Missed Readings</h3>
        <MistakeList items={readings} countKey="incorrectReading" />
      </div>
      <div className={styles.container}>
        <h3 className={styles.title}>Most Missed Radicals</h3>
        <MistakeList items={radicals} countKey="incorrectMeaning" />
      </div>
    </div>
  );
}
