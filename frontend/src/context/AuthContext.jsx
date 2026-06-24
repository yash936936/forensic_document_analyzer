// ASDAS/src/context/AuthContext.jsx
// FIX: replaces the window.location.reload() hack and raw JSON.parse crash.
// Wraps all localStorage access in try/catch.
import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("asdas_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      localStorage.removeItem("asdas_user");
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("asdas_token") || null;
    } catch {
      return null;
    }
  });

  const login = useCallback((userData, authToken) => {
    try {
      localStorage.setItem("asdas_user", JSON.stringify(userData));
      localStorage.setItem("asdas_token", authToken);
    } catch (e) {
      console.error("Failed to persist session:", e);
    }
    setUser(userData);
    setToken(authToken);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem("asdas_user");
      localStorage.removeItem("asdas_token");
    } catch {}
    setUser(null);
    setToken(null);
  }, []);

  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
