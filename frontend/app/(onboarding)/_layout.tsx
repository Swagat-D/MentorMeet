// app/(onboarding)/_layout.tsx - Updated Onboarding Layout with Warm Theme
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function OnboardingLayout() {
  return (
    <>
      <StatusBar style="dark" backgroundColor="#fefbf3" translucent />
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#fefbf3' },
        }}
      >
        <Stack.Screen 
          name="welcome" 
          options={{ 
            headerShown: false,
            gestureEnabled: false,
            title: "Welcome",
          }} 
        />
        <Stack.Screen 
          name="goals" 
          options={{ 
            headerShown: false,
            gestureEnabled: true,
            title: "Learning Goals",
          }} 
        />
        <Stack.Screen 
          name="complete" 
          options={{ 
            headerShown: false,
            gestureEnabled: false,
            title: "Setup Complete",
          }} 
        />
      </Stack>
    </>
  );
}