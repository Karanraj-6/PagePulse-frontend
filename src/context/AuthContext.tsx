import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../services/api';
import { authApi, setAuthToken } from '../services/api';

import defaultAvatar from '../assets/defaultAvatar.png';

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
      console.log("=== 🔐 AUTH CHECK START ===");
      try {
        const userData = await authApi.getCurrentUser();
        console.log("✅ Auth check SUCCESS - User:", userData.username);
        setUser(userData);
      } catch (error: any) {
        console.log("❌ Auth check FAILED");
        console.log("Error details:", error?.message || error);
        setUser(null);
      } finally {
        setIsLoading(false);
        console.log("=== 🔐 AUTH CHECK END ===");
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
      console.log('🖼️ [S3 PREFETCH] Downloading avatar from:', user.avatar);
    }
  }, [user?.avatar]);

  const login = async (email: string, password: string) => {
    console.log("LOGIN START");
    setIsLoading(true);
    try {
      const response = await authApi.login(email, password);


      // Double-check token was set (already done in authApi.login)
      if (response.token) {
        console.log("Token confirmed in response");
      }

      setUser(response.user);
      console.log("LOGIN SUCCESS");
    } catch (error) {
      console.error('LOGIN FAILED');
      console.error('Error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    console.log("=== 📝 SIGNUP START ===");
    setIsLoading(true);
    try {
      await authApi.register({ username, email, password });
      console.log("✅ Registration successful");

      // Fetch user data
      const userData = await authApi.getCurrentUser();
      console.log("✅ User session confirmed:", userData.username);
      setUser(userData);
      console.log("=== 📝 SIGNUP SUCCESS ===");
    } catch (error) {
      console.error('=== ❌ SIGNUP FAILED ===');
      console.error('Error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    window.location.reload();
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