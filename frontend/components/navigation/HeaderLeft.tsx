// components/navigation/HeaderLeft.tsx - Enhanced Header Left Component with Warm Theme
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
        <MaterialIcons name="menu" size={24} color="#5d4e37" strokeWidth={2} />
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
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.2)",
  },
});