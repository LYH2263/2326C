import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PublicConfig } from '../types/config';
import api from '../api';

interface AppConfigContextType {
  config: PublicConfig | null;
  loading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);

const defaultConfig: PublicConfig = {
  appTitle: import.meta.env.VITE_APP_TITLE || '实验室动物信息管理系统',
  featureFlags: {
    enableRegistration: false,
    enableExperiments: true,
    enableHealthRecords: true,
    enableFeedingRecords: true,
  },
  maintenanceMode: false,
  announcement: '',
  env: 'development',
};

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get('/config/public') as PublicConfig;
      setConfig(data);
      if (data.appTitle) {
        document.title = data.appTitle;
      }
    } catch (err) {
      console.warn('Failed to fetch public config, using defaults:', err);
      setConfig(defaultConfig);
      setError(err instanceof Error ? err.message : 'Unknown error');
      document.title = defaultConfig.appTitle;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <AppConfigContext.Provider value={{ config, loading, error, refreshConfig: fetchConfig }}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  const context = useContext(AppConfigContext);
  if (context === undefined) {
    throw new Error('useAppConfig must be used within an AppConfigProvider');
  }
  return context;
}
