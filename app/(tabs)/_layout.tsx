import { useState } from "react";
import { Tabs } from "expo-router";
import { Home, Calendar, User, Search } from "lucide-react-native";
import { TouchableOpacity, View, StyleSheet, Modal, Dimensions } from "react-native";
import HeaderLeft from "@/components/HeaderLeft";
import HeaderRight from "@/components/HeaderRight"
import SidebarDrawer from "@/components/SidebarDrawer";

export default function TabLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#5B8FF9",
          tabBarInactiveTintColor: "#999",
          tabBarStyle: {
            elevation: 0,
            borderTopWidth: 1,
            borderTopColor: "#f0f0f0",
            height: 60,
            paddingBottom: 10,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
          },
          headerStyle: {
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: "#f0f0f0",
          },
          headerTitleStyle: {
            fontWeight: "600",
            fontSize: 18,
          },
          headerLeft: () => <HeaderLeft onMenuPress={toggleSidebar} />,
          headerRight: () => <HeaderRight />,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Explore",
            tabBarIcon: ({ color }) => <Search size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="sessions"
          options={{
            title: "Sessions",
            tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => <User size={24} color={color} />,
          }}
        />
      </Tabs>

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