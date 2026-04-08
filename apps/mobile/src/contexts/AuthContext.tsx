import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Network from 'expo-network';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { Storage } from '../utils/storage';
import { apiClient } from '../api/client';

WebBrowser.maybeCompleteAuthSession();

// ============================================
// Types
// ============================================
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  nationality?: string;
  preferences?: {
    language: string;
    currency: string;
    timezone?: string;
    visaExpiry?: boolean;
    policyChanges?: boolean;
    tripReminders?: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOffline: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// Storage Keys
// ============================================
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// ============================================
// Provider
// ============================================
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Check network status (polling every 10s)
  useEffect(() => {
    let mounted = true;

    const checkNetwork = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        if (mounted) setIsOffline(!(state.isConnected ?? true));
      } catch {
        // assume online if check fails
      }
    };

    checkNetwork();
    const interval = setInterval(checkNetwork, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Load stored auth on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const storedUser = await Storage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Verify token is still valid
        try {
          const profile = await apiClient.getProfile(storedToken);
          setUser(profile.user);
          await Storage.setItem(USER_KEY, JSON.stringify(profile.user));
        } catch {
          await doRefreshToken(storedToken);
        }
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const storeAuth = async (newToken: string, newUser: User) => {
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    await Storage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const login = async (email: string, password: string) => {
    const response = await apiClient.login(email, password);
    await storeAuth(response.token, response.user);
  };

  const register = async (email: string, password: string, name?: string) => {
    const response = await apiClient.register(email, password, name);
    await storeAuth(response.token, response.user);
  };

  // Google Sign-In via expo-auth-session (Expo Go compatible)
  const loginWithGoogle = async () => {
    const redirectUri = AuthSession.makeRedirectUri();

    const request = new AuthSession.AuthRequest({
      clientId: 'YOUR_GOOGLE_WEB_CLIENT_ID',
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
    });

    const result = await request.promptAsync({
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    });

    if (result.type === 'success') {
      const { access_token } = result.params;
      const response = await apiClient.googleAuth(access_token);
      await storeAuth(response.token, response.user);
    } else if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new Error('用戶取消登錄');
    } else {
      throw new Error('Google 登錄失敗');
    }
  };

  // Apple Sign-In via expo-apple-authentication (Expo Go compatible on iOS)
  const loginWithApple = async () => {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple 登錄僅支持 iOS');
    }

    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Apple 登錄不可用（需要 iOS 13+）');
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('No identity token received');
    }

    const response = await apiClient.appleAuth(credential.identityToken, {
      email: credential.email,
      name: credential.fullName
        ? {
            firstName: credential.fullName.givenName,
            lastName: credential.fullName.familyName,
          }
        : undefined,
    });

    await storeAuth(response.token, response.user);
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await Storage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!token) return;

    const response = await apiClient.updateSettings(token, data);
    const updatedUser = { ...user, ...data, preferences: response.preferences } as User;
    setUser(updatedUser);
    await Storage.setItem(USER_KEY, JSON.stringify(updatedUser));
  };

  const doRefreshToken = async (currentToken: string) => {
    try {
      const response = await apiClient.refreshToken(currentToken);
      await SecureStore.setItemAsync(TOKEN_KEY, response.token);
      setToken(response.token);
    } catch {
      await logout();
    }
  };

  const refreshToken = useCallback(async () => {
    if (!token) return;
    await doRefreshToken(token);
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        isOffline,
        login,
        register,
        loginWithGoogle,
        loginWithApple,
        logout,
        updateProfile,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// Hook
// ============================================
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
