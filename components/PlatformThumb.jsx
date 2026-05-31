import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View } from "react-native";

import { getSongPlatform, getSongThumbnail } from "@/utils/media";

export function PlatformThumb({ song, style, quality = "mq", iconSize }) {
  const platform = getSongPlatform(song);
  const uri = getSongThumbnail(song, quality);
  const finalIconSize = iconSize || 28;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[defaultStyles.base, style]}
        contentFit="cover"
      />
    );
  }
  return (
    <View
      style={[
        defaultStyles.base,
        defaultStyles.fallback,
        { backgroundColor: platform.color },
        style,
      ]}
    >
      <Ionicons name={platform.icon} size={finalIconSize} color="#fff" />
    </View>
  );
}

const defaultStyles = StyleSheet.create({
  base: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
});
