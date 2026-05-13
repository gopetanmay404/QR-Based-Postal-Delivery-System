import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      authService.getMe()
        .then(({ data }) => setUser(data.user))
        .catch(() => {
          sessionStorage.removeItem('accessToken');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authService.login({ email, password });
    sessionStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await authService.register(formData);
    sessionStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
    return data;
  }, []);

  const postmanLogin = useCallback(async (employeeId, password) => {
    const { data } = await authService.postmanLogin({ employeeId, password });
    sessionStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (e) { /* ignore */ }
    sessionStorage.removeItem('accessToken');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, postmanLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
