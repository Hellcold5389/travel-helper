import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../src/theme/colors';
import { AuthProvider } from '../src/contexts/AuthContext';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: colors.background,
              },
              headerTintColor: colors.textPrimary,
              headerTitleStyle: {
                fontWeight: '600',
              },
              headerShadowVisible: false,
              contentStyle: {
                backgroundColor: colors.background,
              },
            }}
          >
            <Stack.Screen 
              name="index" 
              options={{ 
                title: 'Travel Helper',
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="login" 
              options={{ 
                title: '登錄',
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="trip" 
              options={{ 
                title: 'AI 行程規劃',
                headerBackTitle: '返回',
              }} 
            />
            <Stack.Screen 
              name="visa" 
              options={{ 
                title: '簽證查詢',
                headerBackTitle: '返回',
              }} 
            />
            <Stack.Screen 
              name="legal" 
              options={{ 
                title: '法律禁忌',
                headerBackTitle: '返回',
              }} 
            />
            <Stack.Screen 
              name="funfacts" 
              options={{ 
                title: '趣聞探索',
                headerBackTitle: '返回',
              }} 
            />
            <Stack.Screen 
              name="settings" 
              options={{ 
                title: '設定',
                headerBackTitle: '返回',
              }} 
            />
          </Stack>
        </SafeAreaProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
