import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { getCurrentUser, clearAuth } from '../store/slices/authSlice';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import SessionWarning from './SessionWarning';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, token, isLoading } = useSelector((state: RootState) => state.auth);
  
  // Session timeout management
  const { sessionWarning, refreshSession, dismissWarning, timeUntilExpiry } = useSessionTimeout();

  // Validate token on app startup
  useEffect(() => {
    if (token && !isAuthenticated) {
      // Try to get current user to validate token
      dispatch(getCurrentUser()).catch(() => {
        // If token is invalid, clear auth
        dispatch(clearAuth());
      });
    }
  }, [dispatch, token, isAuthenticated]);

  // Show loading screen while validating token
  if (token && !isAuthenticated && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <SessionWarning
        isVisible={sessionWarning}
        timeUntilExpiry={timeUntilExpiry}
        onRefresh={refreshSession}
        onDismiss={dismissWarning}
      />
    </>
  );
};

export default AuthWrapper;