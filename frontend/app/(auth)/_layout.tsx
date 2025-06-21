// app/(auth)/_layout.tsx - Fixed Authentication Layout with No Headers
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function AuthLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen 
          name="login" 
          options={{ 
            headerShown: false,
            gestureEnabled: true,
          }} 
        />
        <Stack.Screen 
          name="register" 
          options={{ 
            headerShown: false,
            gestureEnabled: true,
          }} 
        />
        <Stack.Screen 
          name="forgot-password" 
          options={{ 
            headerShown: false,
            gestureEnabled: true,
          }} 
        />
        <Stack.Screen 
          name="reset-password" 
          options={{ 
            headerShown: false,
            gestureEnabled: true,
          }} 
        />
      </Stack>
    </>
  );
}