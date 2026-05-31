import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar } from "@/components/Avatar";
import { timeAgo, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { getSongPlatform, getSongThumbnail } from "@/utils/media";

export function SongCard({ song }) {
  const colors = useColors();
  const router = useRouter();
  const { me, getUser, toggleLike } = useApp();

  const author = getUser(song.addedById);
  const isLiked = song.likes.includes(me.id);
  const platform = getSongPlatform(song);
  const thumb = getSongThumbnail(song, "hq");

  const handlePress = () => {
    router.push(`/song/${song.id}`);
  };

  const handleLike = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    toggleLike(song.id);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Avatar user={author} size={40} ring />
        <View style={styles.headerText}>
          <Text style={[styles.author, { color: colors.foreground }]}>
            {author.name}
          </Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {author.handle} · {timeAgo(song.sharedAt)}
          </Text>
        </View>
        <View style={[styles.platformBadge, { backgroundColor: platform.color }]}>
          <Ionicons name={platform.icon} size={12} color="#fff" />
          <Text style={styles.platformBadgeText}>{platform.label}</Text>
        </View>
      </View>

      {song.message ? (
        <Text style={[styles.message, { color: colors.foreground }]}>
          {song.message}
        </Text>
      ) : null}

      <Pressable onPress={handlePress} style={styles.thumbWrap}>
        {thumb ? (
          <Image
            source={{ uri: thumb }}
            style={styles.thumb}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View
            style={[
              styles.thumb,
              styles.platformFallback,
              { backgroundColor: platform.color },
            ]}
          >
            <Ionicons name={platform.icon} size={64} color="#fff" />
            <Text style={styles.platformFallbackText}>{platform.label}</Text>
          </View>
        )}
        <View style={styles.playOverlay}>
          <View style={styles.playButton}>
            <Feather name="play" size={26} color="#fff" />
          </View>
        </View>
        <View style={styles.titleOverlay}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {song.title}
          </Text>
          {song.artist ? (
            <Text style={styles.songArtist} numberOfLines={1}>
              {song.artist}
            </Text>
          ) : null}
        </View>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          onPress={handleLike}
          style={({ pressed }) => [
            styles.actionBtn,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather
            name="heart"
            size={20}
            color={isLiked ? colors.primary : colors.mutedForeground}
            style={isLiked ? styles.likedIcon : null}
          />
          <Text
            style={[
              styles.actionText,
              { color: isLiked ? colors.primary : colors.mutedForeground },
            ]}
          >
            {song.likes.length}
          </Text>
        </Pressable>

        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.actionBtn,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather
            name="message-circle"
            size={20}
            color={colors.mutedForeground}
          />
          <Text style={[styles.actionText, { color: colors.mutedForeground }]}>
            {song.comments.length}
          </Text>
        </Pressable>

        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.actionBtn,
            { marginLeft: "auto", opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather name="share-2" size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  author: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  meta: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
  platformBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  platformBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
  thumbWrap: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#000",
    position: "relative",
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  platformFallback: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  platformFallbackText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    letterSpacing: 1,
    opacity: 0.9,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
  },
  titleOverlay: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
  },
  songTitle: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    ...Platform.select({
      web: { textShadow: "0 0 6px rgba(0,0,0,0.7)" },
      default: {
        textShadowColor: "rgba(0,0,0,0.7)",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
      },
    }),
  },
  songArtist: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    marginTop: 2,
    fontFamily: "Inter_500Medium",
    ...Platform.select({
      web: { textShadow: "0 0 4px rgba(0,0,0,0.6)" },
      default: {
        textShadowColor: "rgba(0,0,0,0.6)",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 4,
      },
    }),
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    paddingTop: 4,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  likedIcon: {
    transform: [{ scale: 1.1 }],
  },
});
