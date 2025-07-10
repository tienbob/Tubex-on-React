import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../../services/api';
import { UserInfo } from '../../services/api/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserInfo | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<any>;
  logout: () => void;
  validateToken: () => Promise<boolean>;
  clearCacheAndRefresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  login: async () => ({}),
  logout: () => {},
  validateToken: async () => false,
  clearCacheAndRefresh: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Check authentication status on mount
  useEffect(() => {
    initializeAuth();
  }, []);
  const initializeAuth = async () => {
    setLoading(true);
    try {
      // First check if we have an access token using the auth service method
      const isAuth = authService.isAuthenticated();
      if (!isAuth) {
        setUser(null);
        return;
      }
      
      // Attempt to refresh token if needed (for Remember Me functionality)
      try {
        await authService.autoRefreshToken();
      } catch (error) {
        console.warn('Token auto-refresh failed:', error);
        // Continue anyway, the user might still be authenticated
      }
      
      // Always refresh user data from backend if authenticated to ensure fresh data
      if (authService.isAuthenticated()) {
        try {
          const freshUser = await authService.refreshUserData();
          if (freshUser) {
            setUser(freshUser);
          } else {
            const storedUser = authService.getCurrentUser();
            setUser(storedUser);
          }
        } catch (error) {
          console.warn('Error refreshing user data:', error);
          const storedUser = authService.getCurrentUser();
          setUser(storedUser);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
    const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await authService.login({
        email,
        password,
        rememberMe,
      });
      
      // Fetch fresh user data from backend after successful login
      try {
        const freshUser = await authService.refreshUserData();
        if (freshUser) {
          setUser(freshUser);
        } else {
          // Fallback to stored data if refresh fails
          const userInfo = authService.getCurrentUser();
          setUser(userInfo);
        }
      } catch (error) {
        console.warn('Error refreshing user data after login:', error);
        const userInfo = authService.getCurrentUser();
        setUser(userInfo);
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };
  
  const logout = () => {
    authService.logout();
    setUser(null);
  };
  
  const validateToken = async (): Promise<boolean> => {
    try {
      const valid = await authService.validateToken();
      return valid;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };
  
  // Helper method to clear cache and refresh user data
  const clearCacheAndRefresh = async () => {
    try {
      // Clear localStorage to remove any cached data
      localStorage.removeItem('user_info');
      
      // If still authenticated, refresh user data
      if (authService.isAuthenticated()) {
        const freshUser = await authService.refreshUserData();
        if (freshUser) {
          setUser(freshUser);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error clearing cache and refreshing:', error);
      setUser(null);
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        loading,
        login,
        logout,
        validateToken,
        clearCacheAndRefresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);