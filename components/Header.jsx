import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export function Header({ title, subtitle, right }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 24) : insets.top;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: topPad + 14, backgroundColor: colors.background },
      ]}
    >
      {/* Glow decorativo arriba */}
      <View style={[styles.glowWrap, { top: -topPad }]} pointerEvents="none">
        <LinearGradient
          colors={["rgba(255,186,0,0.18)", "rgba(255,186,0,0)"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.glow}
        />
      </View>

      <View style={styles.row}>
        <View style={styles.textBlock}>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.primary }]}>
              {subtitle}
            </Text>
          ) : null}
          <Text style={[styles.title, { color: colors.foreground }]}>
            {title}
          </Text>
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    position: "relative",
    overflow: "hidden",
  },
  glowWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 220,
  },
  glow: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  textBlock: {
    flex: 1,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    opacity: 0.9,
  },
  title: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  right: {
    marginLeft: 12,
  },
});
