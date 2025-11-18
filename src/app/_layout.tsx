import '../polyfills';
import { Stack } from "expo-router";
import { useHydrateStore } from '../state/persist';
import { View, Text } from 'react-native';
import { ENABLE_MASTERMINDS } from '../config/features';

export default function RootLayout() {
  const ready = useHydrateStore();
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Loading…</Text>
      </View>
    );
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="journal/[id]" options={{ headerShown: false }} />
      {ENABLE_MASTERMINDS && (
        <Stack.Screen name="masterminds/[id]" options={{ headerShown: false }} />
      )}
    </Stack>
  );
}
