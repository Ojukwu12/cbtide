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
        
        if (!accessToken) {
          // No token, user is not authenticated
          console.log('No access token found, user not authenticated');
          setIsLoading(false);
          return;
        }

        console.log('Access token found, attempting to fetch user...');
        let retries = 0;
        const maxRetries = 3;

        const tryGetUser = async (): Promise<boolean> => {
          try {
            const user = await authService.getMe();
            setUser(user);
            console.log('User fetched successfully:', user.email);
            return true;
          } catch (error: any) {
            const status = error?.response?.status;
            const errorData = error?.response?.data;
            const isNetworkError = !error?.response || error?.message?.includes('timeout') || error?.code === 'ECONNABORTED';
            
            if (status === 401) {
              // Token is invalid (401), clear auth
              console.warn('User session expired (401)');
              clearTokens();
              setUser(null);
              return true; // Don't retry
            } else if (status === 400) {
              // Bad request - log the error details for debugging
              console.error('Bad request loading user (400):', {
                message: errorData?.message,
                error: errorData?.error,
                details: errorData,
              });
              clearTokens();
              setUser(null);
              return true;
            } else if (isNetworkError && retries < maxRetries) {
              // Network error - retry with exponential backoff
              retries++;
              console.log(`Retrying user fetch (${retries}/${maxRetries}) after network error...`);
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 500));
              return tryGetUser();
            } else if (isNetworkError) {
              // Network error and max retries exceeded - clear auth state
              console.error('Network error loading user after max retries, logging out');
              clearTokens();
              setUser(null);
              return true;
            } else {
              // Server error or other issue - clear auth state
              console.error('Failed to load user:', status || error?.message, 'Logging out');
              clearTokens();
              setUser(null);
              return true;
            }
          }
        };

        await tryGetUser();
      } catch (error) {
        console.error('Auth initialization error:', error);
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
