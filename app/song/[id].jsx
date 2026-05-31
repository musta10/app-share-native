import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/Avatar";
import { timeAgo, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import {
  getSongPlatform,
  getSongThumbnail,
  getSongUrl,
} from "@/utils/media";

export default function SongScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const { songById, getUser, me, toggleLike, addComment } = useApp();
  const song = songById(id);

  const [comment, setComment] = useState("");

  if (!song) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text style={{ color: colors.foreground, fontSize: 16 }}>
          Canción no encontrada
        </Text>
      </View>
    );
  }

  const author = getUser(song.addedById);
  const isLiked = song.likes.includes(me.id);
  const platform = getSongPlatform(song);
  const mediaUrl = getSongUrl(song);
  const thumb = getSongThumbnail(song, "max");

  const handleLike = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    toggleLike(song.id);
  };

  const handleOpenLink = async () => {
    if (!mediaUrl) return;
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        window.open(mediaUrl, "_blank", "noopener,noreferrer");
      }
      return;
    }
    try {
      await WebBrowser.openBrowserAsync(mediaUrl);
    } catch (e) {
      Linking.openURL(mediaUrl).catch(() => {});
    }
  };

  const handleShare = async () => {
    try {
      const artistText = song.artist ? ` de ${song.artist}` : "";
      await Share.share({
        message: `🎵 Mira "${song.title}"${artistText} en ${platform.label}\n${mediaUrl || ""}\n\n— compartido vía Share`,
      });
    } catch (e) {
      // ignore
    }
  };

  const handleSendComment = () => {
    if (!comment.trim()) return;
    addComment(song.id, comment);
    setComment("");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header con botón cerrar */}
      <View
        style={[
          styles.topBar,
          { paddingTop: Math.max(insets.top, 16) + 8 },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: colors.card,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Feather name="chevron-down" size={22} color={colors.foreground} />
        </Pressable>
        <Pressable
          onPress={handleShare}
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: colors.card,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Feather name="share-2" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={{
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 20,
            gap: 16,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Thumbnail grande */}
          <Pressable onPress={handleOpenLink} style={styles.heroWrap}>
            {thumb ? (
              <Image
                source={{ uri: thumb }}
                style={styles.hero}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View
                style={[
                  styles.hero,
                  styles.heroFallback,
                  { backgroundColor: platform.color },
                ]}
              >
                <Ionicons name={platform.icon} size={96} color="#fff" />
                <Text style={styles.heroFallbackLabel}>{platform.label}</Text>
              </View>
            )}
            <View style={styles.heroOverlay}>
              <View style={styles.heroPlay}>
                <Feather name="play" size={32} color="#fff" />
              </View>
            </View>
            <View style={[styles.heroBadge, { backgroundColor: platform.color }]}>
              <Ionicons name={platform.icon} size={14} color="#fff" />
              <Text style={styles.heroBadgeText}>{platform.label}</Text>
            </View>
          </Pressable>

          {/* Título y artista */}
          <View style={{ gap: 4 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {song.title}
            </Text>
            {song.artist ? (
              <Text style={[styles.artist, { color: colors.mutedForeground }]}>
                {song.artist}
              </Text>
            ) : null}
          </View>

          {/* Acciones rápidas */}
          <View style={styles.actionsRow}>
            <Pressable
              onPress={handleLike}
              style={({ pressed }) => [
                styles.actionPill,
                {
                  backgroundColor: isLiked ? colors.primary : colors.card,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Feather
                name="heart"
                size={18}
                color={isLiked ? "#fff" : colors.foreground}
              />
              <Text
                style={[
                  styles.actionPillText,
                  { color: isLiked ? "#fff" : colors.foreground },
                ]}
              >
                {song.likes.length} {isLiked ? "Te gusta" : "Me gusta"}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleOpenLink}
              disabled={!mediaUrl}
              style={({ pressed }) => [
                styles.actionPill,
                {
                  backgroundColor: colors.card,
                  opacity: pressed ? 0.85 : mediaUrl ? 1 : 0.5,
                },
              ]}
            >
              <Ionicons name={platform.icon} size={18} color={platform.color} />
              <Text
                style={[styles.actionPillText, { color: colors.foreground }]}
              >
                Abrir en {platform.label}
              </Text>
            </Pressable>
          </View>

          {/* Compartido por */}
          <View style={[styles.sharedCard, { backgroundColor: colors.card }]}>
            <Avatar user={author} size={44} ring />
            <View style={{ flex: 1 }}>
              <Text style={[styles.sharedBy, { color: colors.foreground }]}>
                Compartido por {author.name}
              </Text>
              <Text
                style={[
                  styles.sharedTime,
                  { color: colors.mutedForeground },
                ]}
              >
                {author.handle} · {timeAgo(song.sharedAt)}
              </Text>
            </View>
          </View>

          {song.message ? (
            <View
              style={[styles.messageCard, { backgroundColor: colors.card }]}
            >
              <Feather
                name="message-square"
                size={16}
                color={colors.primary}
              />
              <Text style={[styles.messageText, { color: colors.foreground }]}>
                {song.message}
              </Text>
            </View>
          ) : null}

          {/* Comentarios */}
          <View style={styles.commentsHeader}>
            <Text style={[styles.commentsTitle, { color: colors.foreground }]}>
              Comentarios
            </Text>
            <View
              style={[styles.commentsBadge, { backgroundColor: colors.muted }]}
            >
              <Text
                style={[
                  styles.commentsCount,
                  { color: colors.mutedForeground },
                ]}
              >
                {song.comments.length}
              </Text>
            </View>
          </View>

          {song.comments.length === 0 ? (
            <View style={styles.noComments}>
              <Text
                style={[
                  styles.noCommentsText,
                  { color: colors.mutedForeground },
                ]}
              >
                Sé el primero en comentar
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {song.comments.map((c) => {
                const u = getUser(c.userId);
                return (
                  <View key={c.id} style={styles.commentRow}>
                    <Avatar user={u} size={36} />
                    <View
                      style={[
                        styles.commentBubble,
                        { backgroundColor: colors.card },
                      ]}
                    >
                      <View style={styles.commentHeader}>
                        <Text
                          style={[
                            styles.commentUser,
                            { color: colors.foreground },
                          ]}
                        >
                          {u.name}
                        </Text>
                        <Text
                          style={[
                            styles.commentTime,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          {timeAgo(c.at)}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.commentText,
                          { color: colors.foreground },
                        ]}
                      >
                        {c.text}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Input de comentario */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + 8,
            },
          ]}
        >
          <Avatar user={me} size={36} />
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Añade un comentario..."
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.commentInput,
              {
                backgroundColor: colors.background,
                color: colors.foreground,
              },
            ]}
            returnKeyType="send"
            onSubmitEditing={handleSendComment}
            multiline
          />
          <Pressable
            onPress={handleSendComment}
            disabled={!comment.trim()}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: comment.trim()
                  ? colors.primary
                  : colors.muted,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Feather
              name="send"
              size={18}
              color={comment.trim() ? "#fff" : colors.mutedForeground}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  heroWrap: {
    aspectRatio: 16 / 9,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#000",
    position: "relative",
  },
  hero: { width: "100%", height: "100%" },
  heroFallback: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  heroFallbackLabel: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    letterSpacing: 1.5,
    opacity: 0.9,
  },
  heroBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  heroPlay: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    lineHeight: 30,
  },
  artist: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  actionPillText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  sharedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
  },
  sharedBy: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  sharedTime: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  messageCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 16,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
  commentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 6,
  },
  commentsTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  commentsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  commentsCount: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  noComments: {
    padding: 24,
    alignItems: "center",
  },
  noCommentsText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  commentRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  commentBubble: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderTopLeftRadius: 4,
    gap: 4,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  commentUser: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  commentTime: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  commentText: {
    fontSize: 14,
    lineHeight: 19,
    fontFamily: "Inter_400Regular",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    maxHeight: 80,
    minHeight: 40,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
