import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isProfessor: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('strikehouse_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('strikehouse_token');
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Escuta evento de sessão expirada / 401
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('strikehouse_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('strikehouse_unauthorized', handleUnauthorized);
  }, []);

  // Validação do token na inicialização
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('strikehouse_token');
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get<{ user: User }>('/api/auth/me');
        if (response && response.user) {
          setUser(response.user);
          localStorage.setItem('strikehouse_user', JSON.stringify(response.user));
        }
      } catch (err) {
        console.error('Falha ao validar sessão atual:', err);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>('/api/auth/login', {
      email,
      password,
    });

    const authToken = res.token;
    const authUser = res.user;

    setToken(authToken);
    setUser(authUser);

    localStorage.setItem('strikehouse_token', authToken);
    localStorage.setItem('strikehouse_user', JSON.stringify(authUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('strikehouse_token');
    localStorage.removeItem('strikehouse_user');
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'ADMIN';
  const isProfessor = user?.role === 'PROFESSOR';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isProfessor,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
