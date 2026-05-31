import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar } from "@/components/Avatar";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { getSongPlatform, getSongThumbnail } from "@/utils/media";

/**
 * Tarjeta vertical estilo "Discover" para grid 2 columnas.
 * - Imagen full bleed con degradados arriba/abajo
 * - Animación de press sutil (scale spring)
 * - Glassmorphism en el botón play y badge de likes
 */
export function SongTile({ song, onPress }) {
  const colors = useColors();
  const router = useRouter();
  const { getUser } = useApp();
  const scale = useRef(new Animated.Value(1)).current;

  const author = getUser(song.addedById);
  const platform = getSongPlatform(song);
  const thumb = getSongThumbnail(song, "hq");

  const handlePress = () => {
    if (onPress) return onPress();
    router.push(`/song/${song.id}`);
  };

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 30,
      bounciness: 0,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 24,
      bounciness: 8,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`${song.title}${song.artist ? ` de ${song.artist}` : ""}, compartido por ${author?.name || "alguien"} en ${platform.label}`}
        style={[styles.tile, { backgroundColor: colors.card }]}
      >
        {thumb ? (
          <Image
            source={{ uri: thumb }}
            style={styles.image}
            contentFit="cover"
            transition={250}
          />
        ) : (
          <LinearGradient
            colors={[platform.color, "#000"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.image}
          >
            <View style={styles.fallbackIconWrap}>
              <Ionicons name={platform.icon} size={56} color="rgba(255,255,255,0.95)" />
            </View>
          </LinearGradient>
        )}

        {/* Degradado superior */}
        <LinearGradient
          colors={["rgba(0,0,0,0.55)", "rgba(0,0,0,0)"]}
          style={[styles.gradientTop, { pointerEvents: "none" }]}
        />

        {/* Degradado inferior */}
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.92)"]}
          locations={[0, 1]}
          style={[styles.gradientBottom, { pointerEvents: "none" }]}
        />

        {/* Header: avatar + handle */}
        <View style={styles.headerOverlay}>
          <Avatar user={author} size={26} />
          <Text style={styles.handle} numberOfLines={1}>
            {author?.handle || "@?"}
          </Text>
        </View>

        {/* Badge de plataforma */}
        <View style={[styles.platformBadge, { backgroundColor: platform.color }]}>
          <Ionicons name={platform.icon} size={12} color="#fff" />
        </View>

        {/* Botón play centrado con glass */}
        <View style={[styles.playWrap, { pointerEvents: "none" }]}>
          <View style={styles.playCircle}>
            <Feather name="play" size={20} color="#fff" style={{ marginLeft: 2 }} />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.title} numberOfLines={2}>
            {song.title}
          </Text>
          <View style={styles.footerRow}>
            <Text style={styles.artist} numberOfLines={1}>
              {song.artist || platform.label}
            </Text>
            {song.likes && song.likes.length > 0 ? (
              <View style={styles.likeBadge}>
                <Feather name="heart" size={10} color="#FF4FCB" />
                <Text style={styles.likeText}>{song.likes.length}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: { elevation: 6 },
      web: { boxShadow: "0 6px 18px rgba(0,0,0,0.35)" },
    }),
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackIconWrap: {
    opacity: 0.9,
  },
  gradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "30%",
  },
  gradientBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "55%",
  },
  headerOverlay: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  handle: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    flex: 1,
    ...Platform.select({
      web: { textShadow: "0 1px 3px rgba(0,0,0,0.6)" },
      default: {
        textShadowColor: "rgba(0,0,0,0.6)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
    }),
  },
  platformBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
  },
  playWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  playCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.55)",
    ...Platform.select({
      web: { backdropFilter: "blur(8px)" },
      default: {},
    }),
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 18,
    gap: 5,
  },
  title: {
    color: "#fff",
    fontSize: 13.5,
    lineHeight: 16.5,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    letterSpacing: -0.1,
    ...Platform.select({
      web: { textShadow: "0 1px 4px rgba(0,0,0,0.7)" },
      default: {
        textShadowColor: "rgba(0,0,0,0.7)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
      },
    }),
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  artist: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    flex: 1,
  },
  likeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.15)",
  },
  likeText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
});
