import { useState, useEffect } from 'react';
import { ApiKeyForm } from './components/ApiKeyForm';
import { Dashboard } from './components/Dashboard';
import './App.module.css';

const TOKEN_KEY = 'wanikani_api_token';

function App() {
  const [apiToken, setApiToken] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) {
      setApiToken(savedToken);
    }
  }, []);

  const handleTokenSubmit = (token) => {
    localStorage.setItem(TOKEN_KEY, token);
    setApiToken(token);
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setApiToken(null);
  };

  if (!apiToken) {
    return <ApiKeyForm onTokenSubmit={handleTokenSubmit} />;
  }

  return <Dashboard apiToken={apiToken} onLogout={handleLogout} />;
}

export default App;
