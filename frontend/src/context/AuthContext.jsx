import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, makeBasic, setAuthToken, setUnauthorizedHandler } from '../lib/api';
import { useToast } from '../components/Toast';

const AuthContext = createContext(null);
const KEY = 'econnect.auth';

function readStored() {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

// Restore the API credentials before the first request is made.
const initial = readStored();
if (initial?.token) setAuthToken(initial.token);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [session, setSession] = useState(initial);

  const persist = useCallback((next) => {
    setSession(next);
    try {
      if (next) localStorage.setItem(KEY, JSON.stringify(next));
      else localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    persist(null);
  }, [persist]);

  // Any 401 from an authenticated request logs the user out.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      toast.error('Your session has expired. Please sign in again.');
    });
  }, [logout, toast]);

  const login = useCallback(
    async (email, password) => {
      const user = await api.post('/auth/login', { body: { email, password }, auth: false });
      const token = makeBasic(user.email, password);
      setAuthToken(token);
      persist({ token, user });
      return user;
    },
    [persist],
  );

  const register = useCallback(
    async (payload) => {
      await api.post('/auth/register', { body: payload, auth: false });
      return login(payload.email, payload.password);
    },
    [login],
  );

  /** Re-reads the profile (points, level) after actions that change it. */
  const refreshUser = useCallback(async () => {
    if (!session) return null;
    const user = await api.get(`/users/${session.user.id}`);
    persist({ token: session.token, user });
    return user;
  }, [session, persist]);

  const value = useMemo(
    () => ({ user: session?.user ?? null, isAuthenticated: !!session, login, register, logout, refreshUser }),
    [session, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
