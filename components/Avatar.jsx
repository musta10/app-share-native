import React from "react";
import { StyleSheet, Text, View } from "react-native";

function getInitials(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] || "";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
  return (first + second).toUpperCase() || "?";
}

function looksLikeEmoji(str) {
  if (!str) return false;
  // Quick heuristic: has any character outside basic ASCII range
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 127) return true;
  }
  return false;
}

export function Avatar({ user, size = 44, ring = false }) {
  if (!user) return null;
  const bg = user.color || "#FFBA00";
  const hasEmoji = looksLikeEmoji(user.avatar);
  const initials = getInitials(user.name);
  const fontSize = hasEmoji
    ? Math.round(size * 0.5)
    : Math.round(size * 0.42);

  return (
    <View
      style={[
        styles.wrapper,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          padding: ring ? 2 : 0,
          backgroundColor: ring ? bg : "transparent",
        },
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            backgroundColor: bg,
            borderRadius: (size - (ring ? 4 : 0)) / 2,
          },
        ]}
      >
        {hasEmoji ? (
          <Text style={[styles.emoji, { fontSize }]} allowFontScaling={false}>
            {user.avatar}
          </Text>
        ) : (
          <Text
            style={[styles.initials, { fontSize, color: "#1a1206" }]}
            allowFontScaling={false}
            numberOfLines={1}
          >
            {initials}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    flex: 1,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  emoji: {
    textAlign: "center",
    lineHeight: undefined,
  },
  initials: {
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.5,
  },
});
