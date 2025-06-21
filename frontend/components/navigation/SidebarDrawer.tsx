// components/navigation/SidebarDrawer.tsx - Clean Professional Sidebar
import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores/authStore";
import { router } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";


type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const sidebarWidth = Math.min(screenWidth * 0.82, 300);

export default function SidebarDrawer({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  
  const slideAnim = useRef(new Animated.Value(-sidebarWidth)).current;

  useEffect(() => {
    if (isOpen) {
      StatusBar.setBarStyle('light-content', true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      StatusBar.setBarStyle('dark-content', true);
      Animated.spring(slideAnim, {
        toValue: -sidebarWidth,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [isOpen, slideAnim]);

  const handleClose = () => {
    onClose();
  };

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login");
    onClose();
  };

  const navigateTo = (path: string) => {
    router.push(path);
    onClose();
  };

  const menuItems = [
  {
    icon: () => <MaterialIcons name="person" size={20} color="#4F46E5" />,
    title: "Profile",
    route: "/(tabs)/profile",
  },
  {
    icon: () => <MaterialIcons name="bookmark-border" size={20} color="#4F46E5" />,
    title: "Saved Mentors", 
    route: "/favorites",
  },
  {
    icon: () => <MaterialIcons name="notifications" size={20} color="#4F46E5" />,
    title: "Notifications",
    route: "/settings/notifications", 
  },
  {
    icon: () => <MaterialIcons name="settings" size={20} color="#4F46E5" />,
    title: "Settings",
    route: "/settings/privacy",
  },
  {
    icon: () => <MaterialIcons name="help-outline" size={20} color="#4F46E5" />,
    title: "Help & Support",
    route: "/settings/help",
  },
];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: sidebarWidth,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      {/* Header with Gradient */}
      <LinearGradient
        colors={["#4F46E5", "#7C3AED"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <MaterialIcons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: user?.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200",
              }}
              style={styles.avatar}
            />
            <View style={styles.onlineIndicator} />
          </View>
          
          <Text style={styles.userName}>{user?.name || "Student"}</Text>
          <Text style={styles.userRole}>
            {user?.role === 'mentee' ? 'Learning Journey' : 'Mentor'}
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <MaterialIcons name="schedule" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={styles.statText}>{user?.stats?.totalHoursLearned || 0}h</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialIcons name="star" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={styles.statText}>{user?.stats?.averageRating || 0}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialIcons name="emoji-events" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={styles.statText}>{user?.stats?.sessionsCompleted || 0}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Menu Content */}
      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => navigateTo(item.route)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <item.icon />
                </View>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
<TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
  <MaterialIcons name="logout" size={20} color="#EF4444" />  {/* ✅ FIXED */}
  <Text style={styles.logoutText}>Sign Out</Text>
</TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>MentorMatch</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    height: screenHeight,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 24,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#fff",
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
    textAlign: "center",
  },
  userRole: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: 8,
  },
  menuContainer: {
    flex: 1,
    paddingTop: 8,
  },
  menuSection: {
    paddingVertical: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F0F9FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 20,
    marginHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutText: {
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "600",
    marginLeft: 12,
  },
  appInfo: {
    alignItems: "center",
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    marginTop: 20,
  },
  appName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  appVersion: {
    fontSize: 12,
    color: "#9CA3AF",
  },
});