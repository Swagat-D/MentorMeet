import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import { subjects } from "@/constants/subjects";
import { LogOut, ChevronRight, Bell, CreditCard, HelpCircle, Shield, Moon } from "lucide-react-native";

export default function ProfileScreen() {
  const { user, logout, toggleDarkMode, isDarkMode } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace("/auth");
  };

  const renderSettingItem = (
    icon: React.ReactNode,
    title: string,
    onPress: () => void
  ) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        {icon}
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      <ChevronRight size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["right", "left"]}>
      <ScrollView>
        <View style={styles.header}>
          <Image
            source={{ uri: user?.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200" }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{user?.name || "Student"}</Text>
          <Text style={styles.email}>{user?.email || "student@example.com"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Interests</Text>
          <View style={styles.interestsContainer}>
            {user?.interests?.map((interest) => (
              <View key={interest} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            )) || 
            subjects.slice(0, 3).map((subject) => (
              <View key={subject} style={styles.interestTag}>
                <Text style={styles.interestText}>{subject}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => router.push("/edit-interests")}
          >
            <Text style={styles.editButtonText}>Edit Interests</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Moon size={20} color="#666" />
              <Text style={styles.settingTitle}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: "#ddd", true: "#5B8FF9" }}
              thumbColor="#fff"
            />
          </View>
          
          {renderSettingItem(
            <Bell size={20} color="#666" />,
            "Notifications",
            () => router.push("/settings/notifications")
          )}
          
          {renderSettingItem(
            <CreditCard size={20} color="#666" />,
            "Payment Methods",
            () => router.push("/settings/payment")
          )}
          
          {renderSettingItem(
            <Shield size={20} color="#666" />,
            "Privacy & Security",
            () => router.push("/settings/privacy")
          )}
          
          {renderSettingItem(
            <HelpCircle size={20} color="#666" />,
            "Help & Support",
            () => router.push("/settings/help")
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#FF5A5A" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    alignItems: "center",
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: "#666",
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  interestTag: {
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    marginBottom: 12,
  },
  interestText: {
    fontSize: 14,
    color: "#666",
  },
  editButton: {
    alignSelf: "flex-start",
  },
  editButtonText: {
    fontSize: 16,
    color: "#5B8FF9",
    fontWeight: "600",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingTitle: {
    fontSize: 16,
    color: "#333",
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    marginVertical: 20,
  },
  logoutText: {
    fontSize: 16,
    color: "#FF5A5A",
    fontWeight: "600",
    marginLeft: 8,
  },
});