// app/(auth)/_layout.tsx - Updated Auth Layout with OTP Support
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function AuthLayout() {
  return (
    <>
      <StatusBar style="dark" backgroundColor="#fefbf3" translucent />
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#fefbf3' },
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
          name="verify-otp" 
          options={{ 
            headerShown: false,
            gestureEnabled: false, // Prevent going back during OTP verification
          }} 
        />
        <Stack.Screen 
          name="reset-password" 
          options={{ 
            headerShown: false,
            gestureEnabled: false, // Prevent going back during password reset
          }} 
        />
      </Stack>
    </>
  );
}