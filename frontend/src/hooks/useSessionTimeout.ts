import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { checkSessionExpiry, clearAuth, setSessionWarning, refreshAuthToken } from '../store/slices/authSlice';

interface UseSessionTimeoutOptions {
  checkInterval?: number; // in milliseconds
  warningTime?: number; // in milliseconds before expiry to show warning
}

export const useSessionTimeout = (options: UseSessionTimeoutOptions = {}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, expiresAt, sessionWarning } = useSelector((state: RootState) => state.auth);
  
  const {
    checkInterval = 30000, // Check every 30 seconds
    warningTime = 5 * 60 * 1000 // Show warning 5 minutes before expiry
  } = options;

  const checkExpiry = useCallback(() => {
    if (!isAuthenticated || !expiresAt) return;

    const now = new Date().getTime();
    const expiresAtTime = new Date(expiresAt).getTime();
    
    if (now >= expiresAtTime) {
      // Session expired
      console.log('🕐 Session expired - auto logout');
      dispatch(clearAuth());
      window.location.href = '/login?reason=session_expired';
    } else if (expiresAtTime - now <= warningTime && !sessionWarning) {
      // Show warning
      console.log('⚠️ Session expiring soon - showing warning');
      dispatch(setSessionWarning(true));
    }
  }, [dispatch, isAuthenticated, expiresAt, warningTime, sessionWarning]);

  const refreshSession = useCallback(async () => {
    try {
      console.log('🔄 Refreshing session token');
      await dispatch(refreshAuthToken()).unwrap();
      dispatch(setSessionWarning(false));
      console.log('✅ Session refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh session:', error);
      dispatch(clearAuth());
      window.location.href = '/login?reason=refresh_failed';
    }
  }, [dispatch]);

  const dismissWarning = useCallback(() => {
    dispatch(setSessionWarning(false));
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial check
    checkExpiry();

    // Set up interval
    const interval = setInterval(checkExpiry, checkInterval);

    return () => clearInterval(interval);
  }, [isAuthenticated, checkExpiry, checkInterval]);

  return {
    sessionWarning,
    refreshSession,
    dismissWarning,
    timeUntilExpiry: expiresAt ? new Date(expiresAt).getTime() - new Date().getTime() : null
  };
};