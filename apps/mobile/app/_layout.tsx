import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Travel Helper' }} />
      <Stack.Screen name="trip" options={{ title: 'Plan Trip' }} />
      <Stack.Screen name="visa" options={{ title: 'Visa Info' }} />
      <Stack.Screen name="legal" options={{ title: 'Legal Info' }} />
    </Stack>
  );
}