import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import toast from 'react-hot-toast';
import { User, LoginRequest, RegisterRequest } from '../../types';
import { authService } from '../../lib/services';
import { setTokens, clearTokens } from '../../lib/api';

interface AuthContextType {
  user: User | null;
  login: (data: LoginRequest) => Promise<User | null>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (token: string, email: string) => Promise<{ email: string }>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
          try {
            const user = await authService.getMe();
            setUser(user);
          } catch (error: any) {
            // If getMe fails with 401, clear auth
            if (error?.response?.status === 401) {
              clearTokens();
              setUser(null);
            }
            // For other errors (network, etc), preserve tokens
            // The token refresh interceptor will handle token refresh automatically
            // on the next API call if tokens are expired
          }
        }
      } catch (error) {
        // Unexpected error - clear tokens to be safe
        clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    try {
      const response = await authService.login(data);
      
      // Check if email is verified
      if (response.user.emailVerified === false) {
        // Return user data but don't set tokens/user
        toast.error('Please verify your email before logging in');
        return response.user;
      }
      
      setTokens(response.token, response.refreshToken);
      setUser(response.user);
      toast.success('Login successful!');
      return response.user;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      // Don't set tokens or user - they must verify email first
      await authService.register(data);
      toast.success('Registration successful! Please verify your email to activate your account.');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Ignore errors on logout
    } finally {
      clearTokens();
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  const verifyEmail = async (token: string, email: string) => {
    try {
      const result = await authService.verifyEmail(token, email);
      toast.success(`Email verified successfully! You can now log in.`);
      return result;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Email verification failed';
      toast.error(message);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const updatedUser = await authService.getMe();
      setUser(updatedUser);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to refresh user data';
      toast.error(message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        verifyEmail,
        refreshUser,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
