import { useWanikani } from '../hooks/useWanikani';
import { StatsCard } from './StatsCard';
import { ProgressChart } from './ProgressChart';
import { MotivationalQuote } from './MotivationalQuote';
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

  const { user, accuracy, avgDaysPerLevel, fastestLevel, slowestLevel, estimatedCompletion, levelTimeline } = data;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.branding}>
          <img src="/wanikani-logo.png" alt="WaniKani" className={styles.logo} />
          <h1 className={styles.title}>My Progress Dashboard</h1>
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
          color="#9B59B6"
        />
        <StatsCard
          title="Avg Time per Level"
          value={avgDaysPerLevel ? `${avgDaysPerLevel.toFixed(1)}` : '—'}
          subtitle="days"
          color="#00AAFF"
          sideStats={fastestLevel && slowestLevel ? [
            { label: 'Fastest', value: `Lvl ${fastestLevel.level} · ${fastestLevel.days.toFixed(1)}d` },
            { label: 'Slowest', value: `Lvl ${slowestLevel.level} · ${slowestLevel.days.toFixed(1)}d` },
          ] : null}
        />
        <StatsCard
          title="Accuracy"
          value={`${accuracy.toFixed(1)}%`}
          subtitle="overall"
          color={accuracy >= 90 ? '#00D68F' : accuracy >= 80 ? '#FF9500' : '#FF0080'}
        />
        <StatsCard
          title="Est. Completion"
          value={estimatedCompletion ? estimatedCompletion.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
          subtitle={estimatedCompletion ? `${Math.ceil((estimatedCompletion - new Date()) / (1000 * 60 * 60 * 24))} days` : ''}
          color="#00D68F"
        />
      </div>

      <ProgressChart levelTimeline={levelTimeline} currentLevel={user.level} />

      <MotivationalQuote />

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
