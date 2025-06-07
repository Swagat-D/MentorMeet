import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Animated, Dimensions } from "react-native";
import { useAuthStore } from "@/stores/auth-store";
import { router } from "expo-router";
import { useRef, useEffect } from "react";
import { 
  User, 
  Settings, 
  Bell, 
  CreditCard, 
  Shield, 
  HelpCircle, 
  LogOut, 
  Bookmark,
  Home,
  Calendar,
  Search,
  X,
  Briefcase,
  BookOpen,
  MessageSquare,
  AlertCircle
} from "lucide-react-native";

type SidebarProps = {
  onClose: () => void;
};

export default function SidebarDrawer({ onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const screenWidth = Dimensions.get('window').width;
  const sidebarWidth = screenWidth * 0.65; // 65% of screen width
  const slideAnim = useRef(new Animated.Value(-sidebarWidth)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim, sidebarWidth]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: -sidebarWidth,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleLogout = () => {
    logout();
    router.replace("/auth");
    onClose();
  };

  const navigateTo = (path: string) => {
    router.push(path);
    onClose();
  };

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
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <X size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: user?.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200" }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{user?.name || "Student"}</Text>
          <Text style={styles.email}>{user?.email || "student@example.com"}</Text>
          
          <View style={styles.profileActions}>
            <TouchableOpacity style={styles.profileAction} onPress={() => navigateTo("/(tabs)/profile")}>
              <View style={styles.actionIconContainer}>
                <Settings size={20} color="#5B8FF9" />
              </View>
              <Text style={styles.actionText}>Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.profileAction} onPress={() => navigateTo("/favorites")}>
              <View style={styles.actionIconContainer}>
                <Bookmark size={20} color="#5B8FF9" />
              </View>
              <Text style={styles.actionText}>Favorites</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.profileAction} onPress={() => navigateTo("/(tabs)/sessions")}>
              <View style={styles.actionIconContainer}>
                <Calendar size={20} color="#5B8FF9" />
              </View>
              <Text style={styles.actionText}>Sessions</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>EXPLORE</Text>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigateTo("/(tabs)/")}
          >
            <Home size={20} color="#666" />
            <Text style={styles.menuItemText}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigateTo("/(tabs)/search")}
          >
            <Search size={20} color="#666" />
            <Text style={styles.menuItemText}>Find Mentors</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigateTo("/(tabs)/sessions")}
          >
            <Calendar size={20} color="#666" />
            <Text style={styles.menuItemText}>My Sessions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigateTo("/favorites")}
          >
            <Bookmark size={20} color="#666" />
            <Text style={styles.menuItemText}>Saved Mentors</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigateTo("/edit-interests")}
          >
            <BookOpen size={20} color="#666" />
            <Text style={styles.menuItemText}>My Interests</Text>
            <View style={styles.tagContainer}>
              <Text style={styles.tagText}>Edit</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigateTo("/settings/notifications")}
          >
            <Bell size={20} color="#666" />
            <Text style={styles.menuItemText}>Notifications</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigateTo("/settings/payment")}
          >
            <CreditCard size={20} color="#666" />
            <Text style={styles.menuItemText}>Payment Methods</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigateTo("/settings/privacy")}
          >
            <Shield size={20} color="#666" />
            <Text style={styles.menuItemText}>Privacy & Security</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>HELP & SUPPORT</Text>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigateTo("/settings/help")}
          >
            <HelpCircle size={20} color="#666" />
            <Text style={styles.menuItemText}>Help Center</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigateTo("/settings/help")}
          >
            <MessageSquare size={20} color="#666" />
            <Text style={styles.menuItemText}>Report a Problem</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigateTo("/settings/help")}
          >
            <AlertCircle size={20} color="#666" />
            <Text style={styles.menuItemText}>About Us</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#FF5A5A" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    height: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  profileActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 20,
  },
  profileAction: {
    alignItems: "center",
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f7ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: "#666",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 8,
  },
  menuSection: {
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#999",
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 16,
    flex: 1,
  },
  tagContainer: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 10,
    color: "#333",
    fontWeight: "bold",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  logoutText: {
    fontSize: 16,
    color: "#FF5A5A",
    fontWeight: "600",
    marginLeft: 16,
  },
});