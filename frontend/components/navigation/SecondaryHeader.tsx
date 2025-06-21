// components/navigation/SecondaryHeader.tsx - Reusable Header for Secondary Pages
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
interface SecondaryHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightComponent?: React.ReactNode;
  showMoreOptions?: boolean;
  onMorePress?: () => void;
  backgroundColor?: string;
  textColor?: string;
}

export default function SecondaryHeader({
  title,
  subtitle,
  onBack,
  rightComponent,
  showMoreOptions = false,
  onMorePress,
  backgroundColor = "#fff",
  textColor = "#1F2937",
}: SecondaryHeaderProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={["top"]}>
        <View style={styles.header}>
          <View style={styles.leftSection}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <MaterialIcons name="arrow-back" size={24} color={textColor} strokeWidth={2} />
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
                {title}
              </Text>
              {subtitle && (
                <Text style={[styles.subtitle, { color: `${textColor}80` }]} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.rightSection}>
            {rightComponent}
            {showMoreOptions && (
              <TouchableOpacity 
                style={styles.moreButton} 
                onPress={onMorePress}
                activeOpacity={0.7}
              >
                <MaterialIcons name="more-vert" size={24} color={textColor} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    flex: 1,
    marginLeft: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
    marginTop: 2,
    lineHeight: 16,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  moreButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
});
