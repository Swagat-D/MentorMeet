import { View, StyleSheet, Animated, Easing } from "react-native";
import { useEffect, useRef } from "react";

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

export default function SkeletonLoader({ 
  width = "100%", 
  height = 20, 
  borderRadius = 4,
  style = {}
}: SkeletonProps) {
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.6,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
}

export function MentorCardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonLoader width={60} height={60} borderRadius={30} />
      
      <View style={styles.content}>
        <SkeletonLoader width={120} height={16} style={styles.mb8} />
        <SkeletonLoader width={180} height={14} style={styles.mb8} />
        <SkeletonLoader width={100} height={12} style={styles.mb8} />
        <View style={styles.row}>
          <SkeletonLoader width={60} height={24} borderRadius={12} style={styles.mr8} />
          <SkeletonLoader width={60} height={24} borderRadius={12} />
        </View>
      </View>
      
      <View style={styles.rightContent}>
        <SkeletonLoader width={24} height={24} borderRadius={12} />
        <SkeletonLoader width={50} height={30} style={styles.mt8} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#E1E9EE",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  content: {
    flex: 1,
    marginLeft: 16,
  },
  rightContent: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  row: {
    flexDirection: "row",
  },
  mb8: {
    marginBottom: 8,
  },
  mr8: {
    marginRight: 8,
  },
  mt8: {
    marginTop: 8,
  },
});