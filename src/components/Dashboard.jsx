import { useWanikani } from '../hooks/useWanikani';
import { StatsCard } from './StatsCard';
import { LevelProgress } from './LevelProgress';
import { SrsBreakdown } from './SrsBreakdown';
import { ProgressChart } from './ProgressChart';
import styles from './Dashboard.module.css';

export function Dashboard({ apiToken, onLogout }) {
  const { data, loading, error, refresh } = useWanikani(apiToken);

  if (loading && !data) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading your WaniKani data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={refresh} className={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { user, categoryTotals, accuracy, avgDaysPerLevel, currentLevelProgress, levelTimeline, reviewsDue, lessonsDue, totalItems, subjectTypeCounts } = data;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>WaniKani Progress</h1>
          <p className={styles.username}>Welcome, {user.username}</p>
        </div>
        <div className={styles.headerActions}>
          <button onClick={refresh} className={styles.refreshButton} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={onLogout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <StatsCard
          title="Current Level"
          value={user.level}
          subtitle="of 60"
          color="#aa00ff"
        />
        <StatsCard
          title="Avg Time per Level"
          value={avgDaysPerLevel ? `${avgDaysPerLevel.toFixed(1)}` : '—'}
          subtitle="days"
          color="#00aaff"
        />
        <StatsCard
          title="Accuracy"
          value={`${accuracy.toFixed(1)}%`}
          subtitle="overall"
          color={accuracy >= 90 ? '#00aa55' : accuracy >= 80 ? '#ff9900' : '#ff4444'}
        />
      </div>

      <ProgressChart levelTimeline={levelTimeline} currentLevel={user.level} />

      <LevelProgress
        level={user.level}
        passed={currentLevelProgress.passed}
        total={currentLevelProgress.total}
      />

      <div className={styles.chartsGrid}>
        <SrsBreakdown categoryTotals={categoryTotals} />
        <div className={styles.itemDistribution}>
          <h3 className={styles.sectionTitle}>Item Distribution</h3>
          <div className={styles.distributionBars}>
            <div className={styles.distributionItem}>
              <div className={styles.distributionHeader}>
                <span>Radicals</span>
                <span>{subjectTypeCounts.radical || 0}</span>
              </div>
              <div className={styles.distributionBar}>
                <div
                  className={styles.distributionFill}
                  style={{
                    width: `${((subjectTypeCounts.radical || 0) / totalItems) * 100}%`,
                    background: '#00aaff',
                  }}
                />
              </div>
            </div>
            <div className={styles.distributionItem}>
              <div className={styles.distributionHeader}>
                <span>Kanji</span>
                <span>{subjectTypeCounts.kanji || 0}</span>
              </div>
              <div className={styles.distributionBar}>
                <div
                  className={styles.distributionFill}
                  style={{
                    width: `${((subjectTypeCounts.kanji || 0) / totalItems) * 100}%`,
                    background: '#ff00aa',
                  }}
                />
              </div>
            </div>
            <div className={styles.distributionItem}>
              <div className={styles.distributionHeader}>
                <span>Vocabulary</span>
                <span>{subjectTypeCounts.vocabulary || 0}</span>
              </div>
              <div className={styles.distributionBar}>
                <div
                  className={styles.distributionFill}
                  style={{
                    width: `${((subjectTypeCounts.vocabulary || 0) / totalItems) * 100}%`,
                    background: '#aa00ff',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <p>
          Data from{' '}
          <a href="https://www.wanikani.com" target="_blank" rel="noopener noreferrer">
            WaniKani
          </a>
        </p>
      </footer>
    </div>
  );
}
