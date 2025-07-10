import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';
import { authService } from '../../services/api';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const auth = useAuth();
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  // Log auth state for debugging
  useEffect(() => {
  }, [auth, location]);

  // Validate auth on mount and when auth state changes
  useEffect(() => {
    const checkAuth = async () => {
      setIsValidating(true);
      try {
        // Basic checks first
        const hasToken = !!localStorage.getItem('access_token');
        
        if (!hasToken) {
          setIsValid(false);
          return;
        }
        
        // Use auth context if available, fall back to service
        const valid = auth.validateToken 
          ? await auth.validateToken()
          : await authService.validateToken();
          
        setIsValid(valid);
      } catch (error) {
        console.error('AuthGuard - Token validation error:', error);
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    if (!auth.loading) {
      checkAuth();
    }
  }, [auth.loading, auth.isAuthenticated, auth.validateToken]);

  // Handle auth:required events from apiClient
  useEffect(() => {
    const handleAuthRequired = (event: Event) => {
      setIsValid(false);
    };

    window.addEventListener('auth:required', handleAuthRequired);
    return () => {
      window.removeEventListener('auth:required', handleAuthRequired);
    };
  }, []);

  // Show loading state while checking auth
  if (auth.loading || isValidating) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Verifying authentication...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!auth.isAuthenticated || !isValid) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // User is authenticated, render children
  return <>{children}</>;
};

export default AuthGuard;
