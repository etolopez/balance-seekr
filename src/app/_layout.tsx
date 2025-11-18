import '../polyfills';
import { Stack } from "expo-router";
import { useHydrateStore } from '../state/persist';
import { View, Text } from 'react-native';
import Constants from 'expo-constants';
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
  // Check feature flag directly from Constants
  const enableMasterminds = Constants.expoConfig?.extra?.enableMasterminds !== false;
  const showMasterminds = enableMasterminds && ENABLE_MASTERMINDS;
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="journal/[id]" options={{ headerShown: false }} />
      {showMasterminds && (
        <Stack.Screen name="masterminds/[id]" options={{ headerShown: false }} />
      )}
    </Stack>
  );
}
