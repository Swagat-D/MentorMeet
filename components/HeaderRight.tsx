import { View, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Search, Bookmark } from "lucide-react-native";

export default function HeaderRight() {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.iconButton} 
        onPress={() => router.push("/favorites")}
      >
        <Bookmark size={22} color="#333" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.iconButton} 
        onPress={() => router.push("/(tabs)/search")}
      >
        <Search size={22} color="#333" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
});