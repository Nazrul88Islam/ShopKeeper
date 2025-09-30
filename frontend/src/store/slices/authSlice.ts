import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '../../api/authApi';
import type { User, LoginRequest, AuthResponse } from '../../api/authApi';

interface AuthState {
  user: User | null;
  token: string | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionWarning: boolean;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  expiresAt: localStorage.getItem('expiresAt'),
  isAuthenticated: false, // Always start as false until validated
  isLoading: false,
  error: null,
  sessionWarning: false,
};

// Async thunks
export const login = createAsyncThunk<AuthResponse, LoginRequest>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('Attempting login with:', credentials);
      const response = await authApi.login(credentials);
      console.log('Login API response:', response);
      // Extract user and token from the nested data structure
      const result = {
        user: response.data.user,
        token: response.data.token,
        expiresAt: response.data.expiresAt,
        expiresIn: response.data.expiresIn
      };
      console.log('Processed login result:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Login API error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        },
        networkError: error.code,
        isAxiosError: error.isAxiosError
      });
      
      // Return more specific error message
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          `Network error: ${error.code || 'Connection failed'}`;
      return rejectWithValue(errorMessage);
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authApi.logout();
});

export const getCurrentUser = createAsyncThunk<User>(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.getProfile();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get user');
    }
  }
);

export const refreshAuthToken = createAsyncThunk<AuthResponse>(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.refreshToken();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to refresh token');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.expiresAt = null;
      state.isAuthenticated = false;
      state.sessionWarning = false;
      localStorage.removeItem('token');
      localStorage.removeItem('expiresAt');
    },
    setSessionWarning: (state, action: PayloadAction<boolean>) => {
      state.sessionWarning = action.payload;
    },
    checkSessionExpiry: (state) => {
      if (state.expiresAt) {
        const now = new Date().getTime();
        const expiresAt = new Date(state.expiresAt).getTime();
        
        if (now >= expiresAt) {
          // Session expired
          state.user = null;
          state.token = null;
          state.expiresAt = null;
          state.isAuthenticated = false;
          state.sessionWarning = false;
          localStorage.removeItem('token');
          localStorage.removeItem('expiresAt');
        } else if (expiresAt - now <= 5 * 60 * 1000) {
          // Show warning 5 minutes before expiry
          state.sessionWarning = true;
        }
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        console.log('🔄 Login Pending - Setting loading state');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        console.log('✅ Login Fulfilled:', action.payload);
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.expiresAt = action.payload.expiresAt;
        state.isAuthenticated = true;
        state.sessionWarning = false;
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('expiresAt', action.payload.expiresAt);
        console.log('💾 Token and expiration saved to localStorage');
      })
      .addCase(login.rejected, (state, action) => {
        console.log('❌ Login Rejected:', action.payload);
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        console.log('🗮 Auth state after rejection:', { isAuthenticated: state.isAuthenticated, error: state.error });
      });

    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.expiresAt = null;
        state.isAuthenticated = false;
        state.sessionWarning = false;
        localStorage.removeItem('token');
        localStorage.removeItem('expiresAt');
      });

    // Get current user
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.expiresAt = null;
        state.isAuthenticated = false;
        state.sessionWarning = false;
        localStorage.removeItem('token');
        localStorage.removeItem('expiresAt');
      });

    // Refresh token
    builder
      .addCase(refreshAuthToken.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(refreshAuthToken.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.expiresAt = action.payload.expiresAt;
        state.isAuthenticated = true;
        state.sessionWarning = false;
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('expiresAt', action.payload.expiresAt);
      })
      .addCase(refreshAuthToken.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.expiresAt = null;
        state.isAuthenticated = false;
        state.sessionWarning = false;
        localStorage.removeItem('token');
        localStorage.removeItem('expiresAt');
      });
  },
});

export const { clearError, clearAuth, setSessionWarning, checkSessionExpiry } = authSlice.actions;
export default authSlice.reducer;