import { useState } from 'react';
import { validateToken } from '../api/wanikani';
import styles from './ApiKeyForm.module.css';

export function ApiKeyForm({ onTokenSubmit }) {
  const [token, setToken] = useState('');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Please enter an API token');
      return;
    }

    setValidating(true);
    setError('');

    const isValid = await validateToken(token.trim());

    if (isValid) {
      onTokenSubmit(token.trim());
    } else {
      setError('Invalid API token. Please check and try again.');
    }

    setValidating(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>WaniKani Progress Tracker</h1>
        <p className={styles.description}>
          Enter your WaniKani API token to view your learning progress.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="apiToken" className={styles.label}>
            API Token
          </label>
          <input
            id="apiToken"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter your API token"
            className={styles.input}
            disabled={validating}
          />

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.button}
            disabled={validating}
          >
            {validating ? 'Validating...' : 'Connect'}
          </button>
        </form>

        <p className={styles.help}>
          Find your API token in{' '}
          <a
            href="https://www.wanikani.com/settings/personal_access_tokens"
            target="_blank"
            rel="noopener noreferrer"
          >
            WaniKani Settings
          </a>
        </p>
      </div>
    </div>
  );
}
