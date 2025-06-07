import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Modal, View, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import SidebarDrawer from "@/components/SidebarDrawer";
import HeaderLeft from "@/components/HeaderLeft";
import HeaderRight from "@/components/HeaderRight";
import BackButton from "@/components/BackButton";

export const unstable_settings = {
  initialRouteName: "index",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false, 
            gestureEnabled: false 
          }} 
        />
        <Stack.Screen 
          name="mentor/[id]" 
          options={{ 
            title: "Mentor Profile",
            headerLeft: () => <BackButton />,
            headerRight: () => <HeaderRight />
          }} 
        />
        <Stack.Screen 
          name="booking/[id]" 
          options={{ 
            title: "Book Session",
            headerLeft: () => <BackButton />,
            headerRight: () => <HeaderRight />
          }} 
        />
        <Stack.Screen 
          name="payment/[id]" 
          options={{ 
            title: "Payment",
            headerLeft: () => <BackButton />,
            headerRight: () => <HeaderRight />
          }} 
        />
        <Stack.Screen 
          name="confirmation" 
          options={{ 
            title: "Confirmation",
            headerLeft: () => <BackButton />,
            headerRight: () => <HeaderRight />
          }} 
        />
        <Stack.Screen 
          name="favorites" 
          options={{ 
            title: "Favorites",
            headerLeft: () => <BackButton />,
            headerRight: () => <HeaderRight />
          }} 
        />
        <Stack.Screen 
          name="edit-interests" 
          options={{ 
            title: "Edit Interests",
            headerLeft: () => <BackButton />,
            headerRight: () => <HeaderRight />
          }} 
        />
        <Stack.Screen 
          name="settings/privacy" 
          options={{ 
            title: "Privacy & Security",
            headerLeft: () => <BackButton />,
            headerRight: () => <HeaderRight />
          }} 
        />
        <Stack.Screen 
          name="settings/help" 
          options={{ 
            title: "Help & Support",
            headerLeft: () => <BackButton />,
            headerRight: () => <HeaderRight />
          }} 
        />
        <Stack.Screen 
          name="settings/notifications" 
          options={{ 
            title: "Notifications",
            headerLeft: () => <BackButton />,
            headerRight: () => <HeaderRight />
          }} 
        />
        <Stack.Screen 
          name="settings/payment" 
          options={{ 
            title: "Payment Methods",
            headerLeft: () => <BackButton />,
            headerRight: () => <HeaderRight />
          }} 
        />
      </Stack>

      <Modal
        visible={isSidebarOpen}
        transparent={true}
        animationType="none"
        onRequestClose={() => setIsSidebarOpen(false)}
      >
        <View style={styles.modalContainer}>
          <SidebarDrawer onClose={() => setIsSidebarOpen(false)} />
          <TouchableOpacity 
            style={styles.overlay} 
            activeOpacity={1} 
            onPress={() => setIsSidebarOpen(false)}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    flexDirection: "row",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
});