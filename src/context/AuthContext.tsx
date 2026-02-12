import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../services/api';
import { authApi, setAuthToken } from '../services/api';

import defaultAvatar from '@/assets/defaultAvatar.png';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  defaultAvatar: string;
  handleAvatarError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Centralized Error Handler for Avatars
  const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = defaultAvatar;
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const userData = await authApi.getCurrentUser();
        setUser(userData);
      } catch (error: any) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  // Prefetch avatar when user logs in or is restored
  useEffect(() => {
    if (user?.avatar) {
      // 1. user.avatar contains the S3 URL (e.g. https://bucket.s3.amazonaws.com/...)
      // 2. Creating a new Image() and setting src forces the browser to download (fetch) the asset
      const img = new Image();
      img.src = user.avatar;
    }
  }, [user?.avatar]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(email, password);


      // Double-check token was set (already done in authApi.login)
      if (response.token) {
        // Token confirmed
      }

      setUser(response.user);
    } catch (error) {
      console.error('LOGIN FAILED');
      console.error('Error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      await authApi.register({ username, email, password });

      // Fetch user data
      const userData = await authApi.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('===  SIGNUP FAILED ===');
      console.error('Error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    window.location.href = '/auth'; // Use href to ensure full reload/redirect
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
        defaultAvatar,
        handleAvatarError
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