import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService, socketService } from '../services';

import { toast } from '../utils/toast';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOGOUT: 'LOGOUT',
  LOAD_USER_START: 'LOAD_USER_START',
  LOAD_USER_SUCCESS: 'LOAD_USER_SUCCESS',
  LOAD_USER_FAILURE: 'LOAD_USER_FAILURE',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.LOAD_USER_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOAD_USER_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
    case AUTH_ACTIONS.LOAD_USER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user from localStorage on app start
  useEffect(() => {
    const loadUserFromStorage = async () => {
      const user = localStorage.getItem('user');

      if (user) {
        try {
          dispatch({ type: AUTH_ACTIONS.LOAD_USER_START });
          const response = await authService.getMe();
          dispatch({
            type: AUTH_ACTIONS.LOAD_USER_SUCCESS,
            payload: response.data.data,
          });
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('user');
          dispatch({
            type: AUTH_ACTIONS.LOAD_USER_FAILURE,
            payload: error.response?.data?.message || 'Failed to load user',
          });
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.LOAD_USER_FAILURE, payload: null });
      }
    };

    loadUserFromStorage();
  }, []);

  // Handle Socket.IO connection based on authentication state
  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      console.log(`🔌 Initializing socket connection for ${state.user.name} (${state.user.role})`);
      socketService.connect(state.user._id, state.user.role);
    } else if (!state.isAuthenticated && !state.isLoading) {
      socketService.disconnect();
    }

    return () => {
      // Don't disconnect on every re-render, only when auth state actually changes to false
      // or component unmounts (though AuthProvider usually persists)
    };
  }, [state.isAuthenticated, state.user, state.isLoading]);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      const response = await authService.login(credentials);
      const { user } = response.data.data;

      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user },
      });

      toast.success(`Welcome back, ${user.name || 'User'}!`);

      return { success: true, user };
    } catch (error) {
      let errorMessage;

      if (!error.response) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else if (error.response.status === 401) {
        errorMessage = error.response.data?.message || 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.response.status === 403) {
        errorMessage = 'Access denied. Please contact support if you believe this is an error.';
      } else {
        errorMessage = error.response.data?.message || 'Login failed. Please try again later.';
      }

      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage,
      });

      toast.error(errorMessage, {
        autoClose: 5000,
        position: 'top-right'
      });

      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.REGISTER_START });

      // If userData is FormData (driver registration with file upload), 
      // we need to use multipart/form-data content type
      const isFormData = userData instanceof FormData;
      const response = await authService.register(userData, isFormData);
      const { user } = response.data.data;

      // Note: We don't log the user in immediately anymore because they need to verify their email
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      toast.success(response.data.message || 'Registration successful! Please check your email to verify your account.', { autoClose: 6000 });

      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: errorMessage,
      });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout API to clear cookie
      await authService.logout();
    } catch (error) {
      // Even if API fails, still clear local storage and state
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('user');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Update user function
  const updateUser = (userData) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: userData,
    });
    
    // Also update localStorage
    const storedUserStr = localStorage.getItem('user');
    if (storedUserStr) {
      try {
        const storedUser = JSON.parse(storedUserStr);
        localStorage.setItem('user', JSON.stringify({ ...storedUser, ...userData }));
      } catch (e) {
        console.error('Failed to parse stored user for update', e);
      }
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return state.user?.role === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(state.user?.role);
  };

  // Check if user is admin
  const isAdmin = () => {
    return state.user?.role === 'admin';
  };

  // Check if user is driver
  const isDriver = () => {
    return state.user?.role === 'driver';
  };

  // Check if user is student
  const isStudent = () => {
    return state.user?.role === 'student';
  };

  // Check if driver is approved
  const isDriverApproved = () => {
    return state.user?.role === 'driver' && state.user?.status === 'active';
  };

  // Check if user is pending approval
  const isPendingApproval = () => {
    return state.user?.status === 'pending';
  };

  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    login,
    register,
    logout,
    updateUser,
    clearError,

    // Role checks
    hasRole,
    hasAnyRole,
    isAdmin,
    isDriver,
    isStudent,
    isDriverApproved,
    isPendingApproval,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};