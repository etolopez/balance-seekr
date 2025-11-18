import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Platform } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { colors, typography } from '../../config/theme';
import { ENABLE_MASTERMINDS } from '../../config/features';

/**
 * Tabs Layout - Main navigation with mindfulness-themed styling
 * Features soft colors, icons, and gentle design that promotes calm navigation
 * Increased height to avoid interference with Android navigation buttons
 */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  
  // Calculate safe bottom padding for Android navigation buttons
  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 16) : insets.bottom;
  
  // HARDCODE: Hide groups tab in Lite version - check multiple ways
  const appName = Constants.expoConfig?.name || Constants.expoConfig?.manifest?.name || '';
  const mastermindsConfig = Constants.expoConfig?.extra?.enableMasterminds;
  const slug = Constants.expoConfig?.slug || '';
  
  // Hide if: app name contains "lite", slug contains "lite", OR enableMasterminds is explicitly false
  const isLiteVersion = 
    appName.toLowerCase().includes('lite') || 
    slug.toLowerCase().includes('lite') ||
    mastermindsConfig === false;
  
  const showMasterminds = !isLiteVersion;
  
  // FORCE HIDE if any lite indicator found
  if (isLiteVersion) {
    console.log('[TabsLayout] 🚫 LITE VERSION DETECTED - HIDING GROUPS TAB');
    console.log('[TabsLayout]   App Name:', appName);
    console.log('[TabsLayout]   Slug:', slug);
    console.log('[TabsLayout]   enableMasterminds:', mastermindsConfig);
  }
  
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#1A2F3E', // Dark teal-blue background matching the reference
            borderTopWidth: 0,
            paddingTop: 6,
            paddingBottom: bottomPadding,
            height: 70 + bottomPadding,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
          },
          tabBarActiveTintColor: '#7BA3D4', // Light teal/blue for active tabs
          tabBarInactiveTintColor: '#6B8A9B', // Muted teal-gray for inactive tabs
          tabBarShowLabel: true, // Show text labels
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
            marginTop: 2,
          },
          tabBarIconStyle: {
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size || 24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="habits"
          options={{
            title: "Habits & Goals",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="repeat" size={size || 24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="breath"
          options={{
            title: "Breath",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="leaf" size={size || 24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="journal"
          options={{
            title: "Journal",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="book" size={size || 24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: "Tasks",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="checkbox" size={size || 24} color={color} />
            ),
          }}
        />
        {/* Masterminds tab - COMPLETELY HIDDEN in lite version */}
        {/* DO NOT RENDER if isLiteVersion is true - check multiple conditions */}
        {(() => {
          // TRIPLE CHECK: app name, slug, config, AND manifest
          const name1 = Constants.expoConfig?.name || '';
          const name2 = Constants.expoConfig?.manifest?.name || '';
          const name3 = Constants.manifest?.name || '';
          const slug = Constants.expoConfig?.slug || '';
          const config = Constants.expoConfig?.extra?.enableMasterminds;
          
          const nameCheck = name1.toLowerCase().includes('lite') || 
                           name2.toLowerCase().includes('lite') || 
                           name3.toLowerCase().includes('lite');
          const slugCheck = slug.toLowerCase().includes('lite');
          const configCheck = config === false;
          const shouldHide = nameCheck || slugCheck || configCheck;
          
          console.log('[TabsLayout] 🔍 Tab Visibility Check:');
          console.log('[TabsLayout]   name1:', name1);
          console.log('[TabsLayout]   name2:', name2);
          console.log('[TabsLayout]   name3:', name3);
          console.log('[TabsLayout]   slug:', slug);
          console.log('[TabsLayout]   config:', config);
          console.log('[TabsLayout]   shouldHide:', shouldHide);
          
          if (shouldHide) {
            console.log('[TabsLayout] 🚫 HIDING GROUPS TAB - Lite version detected');
            return null; // DO NOT RENDER
          }
          
          return (
            <Tabs.Screen
              name="groups"
              options={{
                title: "Masterminds", // Title shown in tab bar
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="chatbubbles" size={size || 24} color={color} />
                ),
              }}
            />
          );
        })()}
      </Tabs>
    </View>
  );
}
