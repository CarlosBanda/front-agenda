import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Role } from '../types';
import {
  getCurrentUser,
  login as apiLogin,
  register as apiRegister,
} from '../api/auth';

export type UserRole = Role;

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (dto: { name: string; email: string; password: string; phone: string; role: UserRole }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        setToken(storedToken);
        setUser(currentUser);
      } catch {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void restoreSession();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const response = await apiLogin({ email, password });
    const { access_token, user: loggedUser } = response;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(loggedUser);
  };

  const register = async (dto: { name: string; email: string; password: string; phone: string; role: UserRole }): Promise<void> => {
    const response = await apiRegister(dto);
    const { access_token, user: registeredUser } = response;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(registeredUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
