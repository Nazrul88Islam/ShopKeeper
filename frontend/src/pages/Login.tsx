
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useSearchParams } from 'react-router-dom';
import { login } from '../store/slices/authSlice';
import type { AppDispatch, RootState } from '../store';
import type { LoginFormData } from '../types';

const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  
  const [searchParams] = useSearchParams();
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });

  // Debug: Check initial state
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('📊 Login Page Mounted - Initial State:', {
      isAuthenticated,
      isLoading,
      error,
      hasTokenInStorage: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : null
    });
  }, [isAuthenticated, isLoading, error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔐 Login Form Submission Started');
    console.log('📝 Form Data:', formData);
    console.log('🌐 Current URL:', window.location.href);
    console.log('🏪 Auth State Before Login:', { isAuthenticated, isLoading, error });
    
    try {
      console.log('🚀 Dispatching login action...');
      const result = await dispatch(login(formData));
      console.log('✅ Login Dispatch Result:', result);
      
      if (result.type === 'auth/login/fulfilled') {
        console.log('🎉 Login Success - should redirect to dashboard');
      } else if (result.type === 'auth/login/rejected') {
        console.log('❌ Login Rejected:', result.payload);
      }
    } catch (error) {
      console.error('💥 Login Error Caught:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value.trim(), // Trim whitespace
    });
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ShopKeeper
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="input-field"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input-field"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">🔑 Default Admin Credentials</h3>
            <div className="space-y-1 text-sm text-blue-700">
              <p><strong>Username:</strong> admin</p>
              <p><strong>Password:</strong> admin123 (not "admin")</p>
              <p className="text-xs text-blue-600 mt-2">Use these exact credentials to access the admin panel</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({username: 'admin', password: 'admin123'})}
              className="mt-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded transition-colors"
            >
              ⚙️ Auto-fill credentials
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;