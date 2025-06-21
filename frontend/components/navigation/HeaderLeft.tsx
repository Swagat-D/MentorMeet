// components/navigation/HeaderLeft.tsx - Enhanced Header Left Component
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";


type HeaderLeftProps = {
  onMenuPress: () => void;
};

export default function HeaderLeft({ onMenuPress }: HeaderLeftProps) {
  return (
    <TouchableOpacity 
      style={styles.button} 
      onPress={onMenuPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons name="menu" size={24} color="#1F2937" strokeWidth={2} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginRight: 8,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
});

