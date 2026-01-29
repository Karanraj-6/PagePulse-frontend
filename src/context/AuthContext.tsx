import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../services/api';
import { mockUser } from '../services/mockData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth token
    const token = localStorage.getItem('authToken');
    if (token) {
      // In production, validate token with backend
      // For now, use mock user
      setUser(mockUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // In production, call authApi.login(email, password)
      // For demo, simulate login
      console.log('Login:', email, password);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      localStorage.setItem('authToken', 'mock-token');
      setUser(mockUser);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // In production, call authApi.signup({ username, email, password })
      console.log('Signup:', username, email, password);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      localStorage.setItem('authToken', 'mock-token');
      setUser({ ...mockUser, username, email });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
