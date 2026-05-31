import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export function GradientBg({ children, colors: customColors, style }) {
  const colors = useColors();
  const gradColors = customColors || [
    colors.gradientStart,
    colors.gradientEnd,
  ];

  return (
    <View style={[styles.wrap, style]}>
      <LinearGradient
        colors={gradColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
  },
});
