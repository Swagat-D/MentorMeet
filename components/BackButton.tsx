import { StyleSheet, TouchableOpacity } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { router } from "expo-router";

export default function BackButton() {
  return (
    <TouchableOpacity style={styles.button} onPress={() => router.back()}>
      <ChevronLeft size={24} color="#333" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    marginRight: 8,
  },
});