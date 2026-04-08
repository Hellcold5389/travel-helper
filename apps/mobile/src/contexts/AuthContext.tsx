import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';

// Google Sign-In - only on native platforms
let GoogleSignin: any = null;
let statusCodes: any = null;
if (Platform.OS !== 'web') {
  try {
    const googleSigninModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = googleSigninModule.GoogleSignin;
    statusCodes = googleSigninModule.statusCodes;
    GoogleSignin.configure({
      webClientId: 'YOUR_WEB_CLIENT_ID',
      offlineAccess: false,
    });
  } catch (e) {
    console.log('Google Sign-In not available on this platform');
  }
}

// Apple Authentication - only on iOS
let appleAuth: any = null;
let AppleAuthRequestScope: any = null;
let AppleAuthRequestOperation: any = null;
if (Platform.OS === 'ios') {
  try {
    const appleAuthModule = require('@invertase/react-native-apple-authentication');
    appleAuth = appleAuthModule.default;
    AppleAuthRequestScope = appleAuthModule.AppleAuthRequestScope;
    AppleAuthRequestOperation = appleAuthModule.AppleAuthRequestOperation;
  } catch (e) {
    console.log('Apple Authentication not available');
  }
}

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

  // Check offline status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  // Load stored auth on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Verify token is still valid
        try {
          const profile = await apiClient.getProfile(storedToken);
          setUser(profile.user);
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile.user));
        } catch (error) {
          await refreshToken();
        }
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiClient.login(email, password);
    await storeAuth(response.token, response.user);
  };

  const register = async (email: string, password: string, name?: string) => {
    const response = await apiClient.register(email, password, name);
    await storeAuth(response.token, response.user);
  };

  const loginWithGoogle = async () => {
    if (Platform.OS === 'web' || !GoogleSignin) {
      throw new Error('Google 登錄僅支持手機端');
    }

    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();
      
      if (!idToken) {
        throw new Error('No ID token received');
      }
      
      const response = await apiClient.googleAuth(idToken);
      await storeAuth(response.token, response.user);
    } catch (error: any) {
      console.error('Google sign in error:', error);
      
      if (error.code === statusCodes?.SIGN_IN_CANCELLED) {
        throw new Error('用戶取消登錄');
      } else if (error.code === statusCodes?.IN_PROGRESS) {
        throw new Error('登錄進行中');
      } else if (error.code === statusCodes?.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services 不可用');
      } else {
        throw error;
      }
    }
  };

  const loginWithApple = async () => {
    if (Platform.OS !== 'ios' || !appleAuth) {
      throw new Error('Apple 登錄僅支持 iOS');
    }

    try {
      const isAvailable = await appleAuth.isSupported();
      if (!isAvailable) {
        throw new Error('Apple 登錄不可用');
      }
      
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: AppleAuthRequestOperation.LOGIN,
        requestedScopes: [
          AppleAuthRequestScope.EMAIL,
          AppleAuthRequestScope.FULL_NAME,
        ],
      });
      
      const { identityToken, email, fullName } = appleAuthRequestResponse;
      
      if (!identityToken) {
        throw new Error('No identity token received');
      }
      
      const response = await apiClient.appleAuth(identityToken, {
        email,
        name: fullName ? {
          firstName: fullName.givenName,
          lastName: fullName.familyName,
        } : undefined,
      });
      
      await storeAuth(response.token, response.user);
    } catch (error: any) {
      console.error('Apple sign in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (GoogleSignin) {
        try {
          await GoogleSignin.signOut();
        } catch (e) {
          // Ignore
        }
      }
      
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!token) return;
    
    const response = await apiClient.updateSettings(token, data);
    const updatedUser = { ...user, ...data, preferences: response.preferences };
    setUser(updatedUser);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  };

  const refreshToken = async () => {
    if (!token) return;
    
    try {
      const response = await apiClient.refreshToken(token);
      await SecureStore.setItemAsync(TOKEN_KEY, response.token);
      setToken(response.token);
    } catch (error) {
      await logout();
    }
  };

  const storeAuth = async (newToken: string, newUser: User) => {
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

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
