import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, Text } from "react-native";

import { useColors } from "@/hooks/useColors";

export function PrimaryButton({
  label,
  onPress,
  icon,
  variant = "primary",
  disabled = false,
  fullWidth = false,
  size = "md",
}) {
  const colors = useColors();

  const variants = {
    primary: {
      bg: colors.primary,
      fg: colors.primaryForeground,
      border: "transparent",
    },
    accent: {
      bg: colors.accent,
      fg: colors.accentForeground,
      border: "transparent",
    },
    ghost: {
      bg: "transparent",
      fg: colors.foreground,
      border: colors.border,
    },
    secondary: {
      bg: colors.secondary,
      fg: colors.secondaryForeground,
      border: "transparent",
    },
  };

  const sizes = {
    sm: { padV: 10, padH: 14, font: 13, iconSize: 16, gap: 6 },
    md: { padV: 14, padH: 18, font: 15, iconSize: 18, gap: 8 },
    lg: { padV: 16, padH: 22, font: 16, iconSize: 20, gap: 10 },
  };

  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          borderWidth: variant === "ghost" ? 1 : 0,
          paddingVertical: s.padV,
          paddingHorizontal: s.padH,
          gap: s.gap,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
          alignSelf: fullWidth ? "stretch" : "auto",
        },
      ]}
    >
      {icon ? <Feather name={icon} size={s.iconSize} color={v.fg} /> : null}
      <Text style={[styles.label, { color: v.fg, fontSize: s.font }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
});
