// app/_layout.tsx - Fixed Root Layout
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";

export const unstable_settings = {
  initialRouteName: "index",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [loaded]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false,
            gestureEnabled: false,
          }} 
        />
        <Stack.Screen 
          name="(auth)" 
          options={{ 
            headerShown: false,
            gestureEnabled: false,
          }} 
        />
        <Stack.Screen 
          name="(onboarding)" 
          options={{ 
            headerShown: false, 
            gestureEnabled: false,
          }} 
        />
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false, 
            gestureEnabled: false,
          }} 
        />
        <Stack.Screen 
          name="mentor/[id]" 
          options={{ 
            title: "Mentor Profile",
            presentation: "modal",
          }} 
        />
        <Stack.Screen 
          name="booking/[id]" 
          options={{ 
            title: "Book Session",
            presentation: "modal",
          }} 
        />
        <Stack.Screen 
          name="payment/[id]" 
          options={{ 
            title: "Payment",
            presentation: "modal",
          }} 
        />
        <Stack.Screen 
          name="confirmation" 
          options={{ 
            title: "Confirmation",
            presentation: "modal",
          }} 
        />
        <Stack.Screen 
          name="favorites" 
          options={{ 
            title: "Favorites",
            presentation: "modal",
          }} 
        />
        <Stack.Screen 
          name="edit-interests" 
          options={{ 
            title: "Edit Interests",
            presentation: "modal",
          }} 
        />
        <Stack.Screen 
          name="settings/privacy" 
          options={{ 
            title: "Privacy & Security",
            presentation: "modal",
          }} 
        />
        <Stack.Screen 
          name="settings/help" 
          options={{ 
            title: "Help & Support",
            presentation: "modal",
          }} 
        />
        <Stack.Screen 
          name="settings/notifications" 
          options={{ 
            title: "Notifications",
            presentation: "modal",
          }} 
        />
        <Stack.Screen 
          name="settings/payment" 
          options={{ 
            title: "Payment Methods",
            presentation: "modal",
          }} 
        />
      </Stack>
    </>
  );
}