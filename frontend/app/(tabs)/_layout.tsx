// app/(tabs)/_layout.tsx - Updated Professional Tab Layout with Warm Theme
import { useState } from "react";
import { Tabs } from "expo-router";
import { View, StyleSheet, Modal, Dimensions, Platform, StatusBar } from "react-native";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
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

  const tabBarHeight = Platform.OS === 'ios' ? 90 : 75;

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fefbf3" />
        <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#5d4e37",
          tabBarInactiveTintColor: "#a0916d",
          tabBarStyle: {
            position: 'absolute',
            height: tabBarHeight,
            borderTopWidth: 0.5,
            borderTopColor: '#d5c7b2',
            backgroundColor: '#fefbf3',
            elevation: 10,
            shadowColor: '#a7936c',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.08,
            shadowRadius: 6,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
            marginBottom: -4, 
          },
          tabBarItemStyle: {
            paddingTop: 2,
            paddingBottom: 6,
            borderRadius: 10,
          },
          headerStyle: {
            backgroundColor: "#fefbf3",
            elevation: 4,
            shadowColor: "#8b7355",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 6,
            borderBottomWidth: 0.5,
            borderBottomColor: "rgba(184, 134, 100, 0.1)",
          },
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 20,
            color: "#4a3728",
          },
          headerTitleAlign: "left",
          headerLeft: () => <HeaderLeft onMenuPress={toggleSidebar} />,
          headerRight: () => <HeaderRight />,
          headerLeftContainerStyle: {
            paddingLeft: 14,
          },
          headerRightContainerStyle: {
            paddingRight: 14,
          },
        }}
      >

        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            headerTitle: `Welcome back, ${user?.name?.split(' ')[0] || 'Student'}!`,
            tabBarIcon: ({ color, focused }) => (
              <View style={[
                styles.tabIconContainer,
                focused && styles.tabIconContainerActive
              ]}>
                <MaterialIcons 
                  name="home" 
                  size={focused ? 24 : 22} 
                  color={color} 
                />
                {focused && <View style={styles.activeIndicator} />}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Explore",
            headerTitle: "Find Your Perfect Mentor",
            tabBarIcon: ({ color, focused }) => (
              <View style={[
                styles.tabIconContainer,
                focused && styles.tabIconContainerActive
              ]}>
                <MaterialIcons 
                  name="search" 
                  size={focused ? 24 : 22} 
                  color={color}
                />
                {focused && <View style={styles.activeIndicator} />}
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
                <MaterialIcons 
                  name="event" 
                  size={focused ? 24 : 22} 
                  color={color}
                />
                {focused && <View style={styles.activeIndicator} />}
              </View>
            ),
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
                <MaterialIcons 
                  name="person" 
                  size={focused ? 24 : 22} 
                  color={color}
                />
                {focused && <View style={styles.activeIndicator} />}
              </View>
            ),
          }}
        />
      </Tabs>

      {/* Enhanced Sidebar Modal with Warm Background */}
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
          
          {/* Warm Blur Overlay */}
          {Platform.OS === 'ios' ? (
            <BlurView
              style={styles.overlay}
              intensity={20}
              tint="light"
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
    backgroundColor: "rgba(139, 115, 85, 0.3)",
  },
  tabIconContainer: {
  alignItems: 'center',
  justifyContent: 'center',
  width: 38,
  height: 30,
  borderRadius: 12,
  backgroundColor: 'transparent',
},
  tabIconContainerActive: {
    backgroundColor: 'rgba(93, 78, 55, 0.08)',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -5,
    width: 6,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#5d4e37',
  },
});