// app/(tabs)/_layout.tsx - Enhanced Professional Tab Layout
import { useState } from "react";
import { Tabs } from "expo-router";
import { View, StyleSheet, Modal, Dimensions, Platform, StatusBar } from "react-native";
import { Home, Calendar, User, Search, MessageSquare } from "lucide-react-native";
import { BlurView } from 'expo-blur';
import HeaderLeft from "@/components/navigation/HeaderLeft";
import HeaderRight from "@/components/navigation/HeaderRight";
import SidebarDrawer from "@/components/navigation/SidebarDrawer";
import { useAuthStore } from "@/stores/authStore";

const { width } = Dimensions.get('window');

export default function TabLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuthStore();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const tabBarHeight = Platform.OS === 'ios' ? 85 : 65;

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#4F46E5",
          tabBarInactiveTintColor: "#9CA3AF",
          tabBarStyle: {
  bottom: 10,
  left: 10,
  right: 10,
  height: Platform.OS === 'ios' ? 80 : 70,
  paddingBottom: Platform.OS === 'ios' ? 25 : 15,
  paddingTop: 10,
  borderRadius: 20,
  backgroundColor: '#ffffff',
  borderTopWidth: 0,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 10,
  elevation: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            marginTop: 4,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
          headerStyle: {
            backgroundColor: "#ffffff",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 5,
            borderBottomWidth: 0,
          },
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 20,
            color: "#1F2937",
          },
          headerTitleAlign: "left",
          headerLeft: () => <HeaderLeft onMenuPress={toggleSidebar} />,
          headerRight: () => <HeaderRight />,
          headerLeftContainerStyle: {
            paddingLeft: 16,
          },
          headerRightContainerStyle: {
            paddingRight: 16,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            headerTitle: `Welcome back, ${user?.name?.split(' ')[0] || 'Student'}!`,
            tabBarIcon: ({ color, focused }) => (
              <View style={[
                styles.tabIconContainer,
                focused && styles.tabIconContainerActive
              ]}>
                <Home 
                  size={focused ? 26 : 24} 
                  color={color} 
                  strokeWidth={focused ? 2.5 : 2}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Explore",
            headerTitle: "Find Your Mentor",
            tabBarIcon: ({ color, focused }) => (
              <View style={[
                styles.tabIconContainer,
                focused && styles.tabIconContainerActive
              ]}>
                <Search 
                  size={focused ? 26 : 24} 
                  color={color}
                  strokeWidth={focused ? 2.5 : 2}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="sessions"
          options={{
            title: "Sessions",
            headerTitle: "My Learning Sessions",
            tabBarIcon: ({ color, focused }) => (
              <View style={[
                styles.tabIconContainer,
                focused && styles.tabIconContainerActive
              ]}>
                <Calendar 
                  size={focused ? 26 : 24} 
                  color={color}
                  strokeWidth={focused ? 2.5 : 2}
                />
              </View>
            ),
            tabBarBadge: undefined, // You can add session count here
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: "Messages",
            headerTitle: "Conversations",
            tabBarIcon: ({ color, focused }) => (
              <View style={[
                styles.tabIconContainer,
                focused && styles.tabIconContainerActive
              ]}>
                <MessageSquare 
                  size={focused ? 26 : 24} 
                  color={color}
                  strokeWidth={focused ? 2.5 : 2}
                />
              </View>
            ),
            tabBarBadge: undefined, // You can add unread count here
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerTitle: "My Profile",
            tabBarIcon: ({ color, focused }) => (
              <View style={[
                styles.tabIconContainer,
                focused && styles.tabIconContainerActive
              ]}>
                <User 
                  size={focused ? 26 : 24} 
                  color={color}
                  strokeWidth={focused ? 2.5 : 2}
                />
              </View>
            ),
          }}
        />
      </Tabs>

      {/* Enhanced Sidebar Modal */}
      <Modal
        visible={isSidebarOpen}
        transparent={true}
        animationType="none"
        onRequestClose={() => setIsSidebarOpen(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalContainer}>
          <SidebarDrawer 
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)} 
          />
          
          {/* Blur Overlay */}
          {Platform.OS === 'ios' ? (
            <BlurView
              style={styles.overlay}
              intensity={20}
              tint="dark"
              onTouchEnd={() => setIsSidebarOpen(false)}
            />
          ) : (
            <View 
              style={[styles.overlay, styles.overlayAndroid]}
              onTouchEnd={() => setIsSidebarOpen(false)}
            />
          )}
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
  },
  overlayAndroid: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 32,
    borderRadius: 16,
    marginBottom: 2,
  },
  tabIconContainerActive: {
    backgroundColor: '#EEF2FF',
    transform: [{ scale: 1.1 }],
  },
});