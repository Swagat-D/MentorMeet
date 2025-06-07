import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { CreditCard, Plus, ChevronRight } from "lucide-react-native";

export default function PaymentMethodsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ title: "Payment Methods" }} />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CreditCard size={20} color="#5B8FF9" />
            <Text style={styles.sectionTitle}>Your Payment Methods</Text>
          </View>
          
          <View style={styles.cardItem}>
            <View style={styles.cardLeft}>
              <Image 
                source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" }} 
                style={styles.cardLogo} 
              />
              <View>
                <Text style={styles.cardName}>Mastercard</Text>
                <Text style={styles.cardNumber}>**** **** **** 5678</Text>
              </View>
            </View>
            <Text style={styles.defaultBadge}>Default</Text>
          </View>
          
          <View style={styles.cardItem}>
            <View style={styles.cardLeft}>
              <Image 
                source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/1280px-Visa_Inc._logo.svg.png" }} 
                style={styles.cardLogo} 
              />
              <View>
                <Text style={styles.cardName}>Visa</Text>
                <Text style={styles.cardNumber}>**** **** **** 1234</Text>
              </View>
            </View>
            <TouchableOpacity>
              <Text style={styles.makeDefaultText}>Make Default</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.addCardButton}>
            <Plus size={20} color="#5B8FF9" />
            <Text style={styles.addCardText}>Add New Payment Method</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingTitle}>Currency</Text>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>INR (₹)</Text>
              <ChevronRight size={20} color="#999" />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingTitle}>Billing Address</Text>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingTitle}>Payment History</Text>
            <ChevronRight size={20} color="#999" />
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
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  cardItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardLogo: {
    width: 40,
    height: 30,
    marginRight: 16,
    resizeMode: "contain",
  },
  cardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  cardNumber: {
    fontSize: 14,
    color: "#666",
  },
  defaultBadge: {
    fontSize: 12,
    color: "#fff",
    backgroundColor: "#5B8FF9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  makeDefaultText: {
    fontSize: 14,
    color: "#5B8FF9",
  },
  addCardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginTop: 8,
  },
  addCardText: {
    fontSize: 16,
    color: "#5B8FF9",
    fontWeight: "600",
    marginLeft: 8,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingTitle: {
    fontSize: 16,
    color: "#333",
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingValue: {
    fontSize: 16,
    color: "#666",
    marginRight: 8,
  },
});