// components/navigation/SidebarDrawer.tsx - Updated Professional Sidebar with Warm Theme
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
      icon: () => <MaterialIcons name="person" size={20} color="#8b5a3c" />,
      title: "Profile",
      route: "/(tabs)/profile",
    },
    {
      icon: () => <MaterialIcons name="bookmark-border" size={20} color="#8b5a3c" />,
      title: "Saved Mentors", 
      route: "/favorites",
    },
    {
      icon: () => <MaterialIcons name="notifications" size={20} color="#8b5a3c" />,
      title: "Notifications",
      route: "/settings/notifications", 
    },
    {
      icon: () => <MaterialIcons name="settings" size={20} color="#8b5a3c" />,
      title: "Settings",
      route: "/settings/privacy",
    },
    {
      icon: () => <MaterialIcons name="help-outline" size={20} color="#8b5a3c" />,
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
      {/* Header with Creative Warm Gradient */}
      <LinearGradient
        colors={["#fefbf3", "#f8f6f0", "#f1f0ec"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Creative overlay with subtle pattern */}
        <LinearGradient
          colors={["rgba(139, 90, 60, 0.1)", "rgba(217, 119, 6, 0.05)", "rgba(245, 158, 11, 0.08)"]}
          style={styles.headerOverlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <MaterialIcons name="close" size={22} color="#5d4e37" />
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

        {/* Creative Stats Container */}
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={["rgba(139, 90, 60, 0.15)", "rgba(217, 119, 6, 0.1)"]}
            style={styles.statsGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.statItem}>
              <MaterialIcons name="schedule" size={14} color="#8b5a3c" />
              <Text style={styles.statText}>
                {user?.stats?.totalHoursLearned?.toString() || '0'}h
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialIcons name="star" size={14} color="#d97706" />
              <Text style={styles.statText}>
                {user?.stats?.averageRating?.toString() || '0'}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialIcons name="emoji-events" size={14} color="#f59e0b" />
              <Text style={styles.statText}>
                {user?.stats?.sessionsCompleted?.toString() || '0'}
              </Text>
            </View>
          </LinearGradient>
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
              <MaterialIcons name="chevron-right" size={16} color="#a0916d" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="#d97706" />
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
    backgroundColor: "#fefbf3",
    height: screenHeight,
    shadowColor: "#8b7355",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 24,
    paddingHorizontal: 20,
    position: 'relative',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 24,
    zIndex: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(93, 78, 55, 0.1)",
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 24,
    zIndex: 1,
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
    borderColor: "rgba(139, 90, 60, 0.3)",
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
    color: "#4a3728",
    marginBottom: 4,
    textAlign: "center",
  },
  userRole: {
    fontSize: 14,
    color: "#8b7355",
    textAlign: "center",
  },
  statsContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    zIndex: 1,
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsGradient: {
    flexDirection: "row",
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
    color: "#4a3728",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(139, 90, 60, 0.2)",
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
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4a3728",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 20,
    marginHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "rgba(217, 119, 6, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.2)",
  },
  logoutText: {
    fontSize: 16,
    color: "#d97706",
    fontWeight: "600",
    marginLeft: 12,
  },
  appInfo: {
    alignItems: "center",
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(184, 134, 100, 0.2)",
    marginTop: 20,
  },
  appName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4a3728",
    marginBottom: 2,
  },
  appVersion: {
    fontSize: 12,
    color: "#a0916d",
  },
});