import { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { mentors } from "@/mocks/mentors";
import { formatDate } from "@/utils/date-utils";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
export default function PaymentScreen() {
  const { id, sessionType, date, time } = useLocalSearchParams<{
    id: string;
    sessionType: string;
    date: string;
    time: string;
  }>();
  
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const mentor = mentors.find((m) => m.id === id);
  const sessionTypeIndex = parseInt(sessionType || "0");
  const selectedDate = date ? new Date(date) : new Date();
  
  if (!mentor) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Mentor not found</Text>
      </SafeAreaView>
    );
  }

  const selectedSessionType = mentor.sessionTypes[sessionTypeIndex];
  
  const handlePayment = () => {
    if (!cardNumber || !cardName || !expiryDate || !cvv) {
      Alert.alert("Missing Information", "Please fill in all payment details");
      return;
    }
    
    setIsLoading(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsLoading(false);
      router.push({
        pathname: "/confirmation",
        params: {
          mentorName: mentor.name,
          sessionTitle: selectedSessionType.title,
          date: selectedDate.toISOString(),
          time,
          price: selectedSessionType.price.toString(),
        },
      });
    }, 1500);
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const chunks = [];
    
    for (let i = 0; i < cleaned.length; i += 4) {
      chunks.push(cleaned.substr(i, 4));
    }
    
    return chunks.join(" ").substr(0, 19);
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/[^0-9]/gi, "");
    
    if (cleaned.length <= 2) {
      return cleaned;
    }
    
    return `${cleaned.substr(0, 2)}/${cleaned.substr(2, 2)}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={["right", "left"]}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Payment Details</Text>
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemLabel}>Mentor</Text>
            <Text style={styles.summaryItemValue}>{mentor.name}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemLabel}>Session</Text>
            <Text style={styles.summaryItemValue}>{selectedSessionType.title}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <View style={styles.summaryItemLeft}>
              <MaterialIcons name="event" size={16} color="#666" />
              <Text style={styles.summaryItemLabelWithIcon}>Date</Text>
            </View>
            <Text style={styles.summaryItemValue}>{formatDate(selectedDate)}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <View style={styles.summaryItemLeft}>
              <MaterialIcons name="schedule" size={16} color="#666" />
              <Text style={styles.summaryItemLabelWithIcon}>Time</Text>
            </View>
            <Text style={styles.summaryItemValue}>{time}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${selectedSessionType.price}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Card Information</Text>
          
          <View style={styles.secureNotice}>
            <MaterialIcons name="lock" size={16} color="#5B8FF9" />
            <Text style={styles.secureText}>Your payment information is secure</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Card Number</Text>
            <View style={styles.cardNumberContainer}>
              <MaterialIcons name="credit-card" size={20} color="#999" />
              <TextInput
                style={styles.cardNumberInput}
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                keyboardType="number-pad"
                maxLength={19}
              />
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Cardholder Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              value={cardName}
              onChangeText={setCardName}
              autoCapitalize="words"
            />
          </View>
          
          <View style={styles.rowInputs}>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Text style={styles.inputLabel}>Expiry Date</Text>
              <TextInput
                style={styles.input}
                placeholder="MM/YY"
                value={expiryDate}
                onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>
            
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Text style={styles.inputLabel}>CVV</Text>
              <TextInput
                style={styles.input}
                placeholder="123"
                value={cvv}
                onChangeText={setCvv}
                keyboardType="number-pad"
                maxLength={3}
                secureTextEntry
              />
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.payButton, isLoading && styles.loadingButton]}
            onPress={handlePayment}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.payButtonText}>Processing...</Text>
            ) : (
              <>
                <Text style={styles.payButtonText}>Pay ${selectedSessionType.price}</Text>
                <MaterialIcons name="lock" size={20} color="#fff" />
              </>
            )}
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
  errorText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginTop: 40,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  summarySection: {
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItemLabel: {
    fontSize: 16,
    color: "#666",
  },
  summaryItemLabelWithIcon: {
    fontSize: 16,
    color: "#666",
    marginLeft: 8,
  },
  summaryItemValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 12,
  },
  totalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#5B8FF9",
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  secureNotice: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  secureText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  cardNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardNumberInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  rowInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    width: "48%",
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  payButton: {
    backgroundColor: "#5B8FF9",
    borderRadius: 12,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingButton: {
    backgroundColor: "#999",
  },
  payButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
});