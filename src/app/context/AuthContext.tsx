import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import toast from 'react-hot-toast';
import { User, LoginRequest, RegisterRequest } from '../../types';
import { authService } from '../../lib/services';
import { setTokens, clearTokens, getAccessToken, trySilentRefresh } from '../../lib/api';

// Helper to decode JWT token and check user ID validity
function decodeToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('[auth] Token has invalid structure (not 3 parts)');
      return null;
    }
    const decoded = JSON.parse(atob(parts[1]));
    return decoded;
  } catch (e) {
    console.error('[auth] Failed to decode token:', e);
    return null;
  }
}

// Validate if string is valid MongoDB ObjectId
function isValidObjectId(id: string): boolean {
  return /^[0-9a-f]{24}$/i.test(id);
}

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
  const [hasSession, setHasSession] = useState<boolean>(Boolean(getAccessToken()));
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        let accessToken = getAccessToken();
        
        if (!accessToken) {
          const refreshed = await trySilentRefresh();
          if (!refreshed) {
            console.log('No active session found on startup');
            setUser(null);
            setHasSession(false);
            setIsLoading(false);
            return;
          }
          accessToken = getAccessToken();
        }

        console.log('Access token found, attempting to fetch user...');
        let retries = 0;
        const maxRetries = 2;

        const tryGetUser = async (): Promise<boolean> => {
          try {
            const user = await authService.getMe();
            setUser(user);
            setHasSession(true);
            console.log('User fetched successfully:', user.email);
            return true; 
          } catch (error: any) {
            const status = error?.response?.status;
            const errorData = error?.response?.data;
            const isNetworkError = !error?.response || error?.message?.includes('timeout') || error?.code === 'ECONNABORTED';
            
            // Decode token to check user ID validity
            const token = localStorage.getItem('accessToken');
            const decodedToken = token ? decodeToken(token as string) : null;
            const tokenUserId = decodedToken?.userId || decodedToken?.sub || decodedToken?.id;
            const isValidId = tokenUserId ? isValidObjectId(tokenUserId) : false;
            
            if (status === 401 || status === 403) {
              // Refresh flow (interceptor) decides whether to clear tokens.
              setUser(null);
              setHasSession(Boolean(getAccessToken()));
              return true;
            } else if (status === 400) {
              // Bad request - could be invalid ObjectId in token
              const errorMessage = errorData?.message || '';
              const isInvalidObjectId = errorMessage.toLowerCase().includes('objectid');
              
              console.warn('Failed to fetch user details (400):', {
                message: errorMessage,
                tokenUserId,
                isValidObjectId: isValidId,
                isInvalidObjectId,
                fullError: errorData,
              });
              
              if (isInvalidObjectId && tokenUserId && !isValidId) {
                console.error('[auth] Token contains invalid ObjectId:', tokenUserId);
                console.error('[auth] This is a backend token generation issue - user ID was created with invalid format');
                // Clear tokens since the token is corrupted
                clearTokens();
                setUser(null);
                setHasSession(false);
                return true;
              }
              
              if (retries < maxRetries) {
                retries++;
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 400));
                return tryGetUser();
              }

              setUser(null);
              setHasSession(Boolean(getAccessToken()));
              return true;
            } else if (status === 500 && errorData?.message?.includes('Cast to ObjectId failed')) {
              // Backend token data mismatch
              setUser(null);
              clearTokens();
              setHasSession(false);
              toast.error('Session error. Please log in again.');
              return true;
            } else if (isNetworkError && retries < maxRetries) {
              // Network error - retry with exponential backoff
              retries++;
              console.log(`Retrying user fetch (${retries}/${maxRetries}) after network error...`);
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 500));
              return tryGetUser();
            } else if (isNetworkError) {
              // Keep session and let app retry on subsequent requests
              console.warn('Network issue loading user; session preserved');
              setUser(null);
              setHasSession(Boolean(getAccessToken()));
              return true;
            } else {
              console.error('Failed to load user:', status || error?.message);
              setUser(null);
              setHasSession(Boolean(getAccessToken()));
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

  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      setHasSession(false);
    };

    const handleTokenUpdated = () => {
      setHasSession(Boolean(getAccessToken()));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'accessToken') {
        setHasSession(Boolean(event.newValue));
      }
    };

    window.addEventListener('auth:logout', handleLogout);
    window.addEventListener('auth:token-updated', handleTokenUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      window.removeEventListener('auth:token-updated', handleTokenUpdated);
      window.removeEventListener('storage', handleStorage);
    };
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
      
      const loginAccessToken = response.token || response.accessToken;
      if (!loginAccessToken) {
        throw new Error('Login succeeded but no access token was returned');
      }

      // Validate token before storing
      const decodedToken = decodeToken(loginAccessToken);
      const tokenUserId = decodedToken?.userId || decodedToken?.sub || decodedToken?.id;
      
      console.log('[auth] Login token info:', {
        tokenUserId,
        isValidObjectId: tokenUserId ? isValidObjectId(tokenUserId) : false,
        userId: response.user.id,
      });
      
      setTokens(loginAccessToken, response.refreshToken);
      setUser(response.user);
      setHasSession(true);
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
      setHasSession(false);
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
      const status = error?.response?.status;
      const errorData = error?.response?.data;
      
      if (status === 400 && errorData?.message?.toLowerCase().includes('objectid')) {
        // Invalid ObjectId in token
        console.error('[auth] Invalid ObjectId in token during refreshUser');
        clearTokens();
        setUser(null);
        setHasSession(false);
      }
      
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
        isAuthenticated: hasSession,
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
