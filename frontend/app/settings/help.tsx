import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
export default function HelpSupportScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ title: "Help & Support" }} />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="help-outline" size={20} color="#5B8FF9" />
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          </View>
          
          <TouchableOpacity style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How do I book a session?</Text>
            <MaterialIcons name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How do payments work?</Text>
            <MaterialIcons name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I reschedule a session?</Text>
            <MaterialIcons name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How do I become a mentor?</Text>
            <MaterialIcons name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.faqItem}>
            <Text style={styles.faqQuestion}>What if I'm not satisfied with a session?</Text>
            <MaterialIcons name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="message" size={20} color="#5B8FF9" />
            <Text style={styles.sectionTitle}>Contact Us</Text>
          </View>
          
          <TouchableOpacity style={styles.contactItem}>
            <View style={styles.contactLeft}>
              <MaterialIcons name="email" size={20} color="#666" />
              <Text style={styles.contactText}>support@mentormatch.com</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.contactItem}>
            <View style={styles.contactLeft}>
              <MaterialIcons name="phone" size={20} color="#666" />
              <Text style={styles.contactText}>+91 1234567890</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="description" size={20} color="#5B8FF9" />
            <Text style={styles.sectionTitle}>Resources</Text>
          </View>
          
          <TouchableOpacity style={styles.resourceItem}>
            <Text style={styles.resourceTitle}>User Guide</Text>
            <MaterialIcons name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.resourceItem}>
            <Text style={styles.resourceTitle}>Community Guidelines</Text>
            <MaterialIcons name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.resourceItem}>
            <Text style={styles.resourceTitle}>Privacy Policy</Text>
            <MaterialIcons name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.resourceItem}>
            <Text style={styles.resourceTitle}>Terms of Service</Text>
            <MaterialIcons name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 12,
  },
  faqItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  faqQuestion: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    marginRight: 16,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  contactLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 16,
  },
  resourceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  resourceTitle: {
    fontSize: 16,
    color: "#333",
  },
});