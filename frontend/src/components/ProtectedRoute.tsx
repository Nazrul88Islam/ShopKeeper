import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';
import type { RootState, AppDispatch } from '../store';
import { getCurrentUser, clearAuth } from '../store/slices/authSlice';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, token, user, isLoading } = useSelector((state: RootState) => state.auth);

  // Validate token if we have one but no user data
  useEffect(() => {
    if (token && !user && !isLoading) {
      dispatch(getCurrentUser()).catch(() => {
        // If token is invalid, clear auth and redirect to login
        dispatch(clearAuth());
      });
    }
  }, [dispatch, token, user, isLoading]);

  // Show loading while validating token
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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;