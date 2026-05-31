import { Feather, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useRef, useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Header } from "@/components/Header";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useApp } from "@/context/AppContext";
import { useUI } from "@/context/UIContext";
import { useColors } from "@/hooks/useColors";
import {
  fetchVideoMetadata,
  getMediaDefaults,
  getPreviewThumbnail,
  PLATFORMS,
  PLATFORM_ORDER,
  parseMediaLink,
} from "@/utils/media";

export default function AddScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addSong } = useApp();
  const { toast } = useUI();
  const { sharedUrl, _ts } = useLocalSearchParams();

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [message, setMessage] = useState("");
  const [media, setMedia] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [error, setError] = useState(null);

  // Cuando llegamos desde el "Compartir" nativo (Android/iOS), prellenamos
  // la URL automáticamente. Deduplicamos por timestamp (_ts) en lugar de URL
  // — así si el usuario comparte el mismo enlace dos veces, ambas veces se
  // procesa correctamente (cada navegación trae un _ts distinto).
  const lastTsRef = useRef(null);
  useEffect(() => {
    const incomingUrl = Array.isArray(sharedUrl) ? sharedUrl[0] : sharedUrl;
    const incomingTs = Array.isArray(_ts) ? _ts[0] : _ts;
    if (!incomingUrl) return;
    const dedupKey = incomingTs || incomingUrl;
    if (lastTsRef.current === dedupKey) return;
    lastTsRef.current = dedupKey;
    setUrl(incomingUrl);
    setTitle("");
    setArtist("");
    setMessage("");
    setError(null);
  }, [sharedUrl, _ts]);

  useEffect(() => {
    setError(null);
    const parsed = parseMediaLink(url);
    setMedia(parsed);
    if (!parsed) {
      setLoadingMeta(false);
      return;
    }

    // Para Instagram, TikTok y Facebook no podemos consultar metadatos
    // sin un servidor — auto-rellenamos un título y autor por defecto
    // para que el usuario pueda compartir enseguida (y editar si quiere).
    if (parsed.platform !== "youtube") {
      setLoadingMeta(false);
      const defaults = getMediaDefaults(parsed);
      if (!title && defaults.title) setTitle(defaults.title);
      if (!artist && defaults.author) setArtist(defaults.author);
      return;
    }

    let cancelled = false;
    setLoadingMeta(true);
    (async () => {
      const meta = await fetchVideoMetadata(parsed.videoId);
      if (cancelled) return;
      if (meta) {
        if (!title) setTitle(meta.title);
        if (!artist) setArtist(meta.author);
      }
      setLoadingMeta(false);
    })();
    return () => {
      cancelled = true;
      setLoadingMeta(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const handleShare = () => {
    if (!media) {
      setError(
        "Pega un enlace válido de YouTube, Instagram, TikTok o Facebook"
      );
      return;
    }
    if (!title.trim()) {
      setError("El título es obligatorio");
      return;
    }
    addSong({
      platform: media.platform,
      url: media.url,
      videoId: media.videoId,
      title: title.trim(),
      artist: artist.trim(),
      message: message.trim(),
    });
    setUrl("");
    setTitle("");
    setArtist("");
    setMessage("");
    setMedia(null);
    toast({
      type: "success",
      title: "¡Compartido!",
      message: "Tu publicación ya está en el feed",
    });
    router.push("/(tabs)/");
  };

  const handleOpenPlatform = async (platformId) => {
    const target = PLATFORMS[platformId]?.homeUrl;
    if (!target) return;
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        window.open(target, "_blank", "noopener,noreferrer");
      }
      return;
    }
    try {
      await WebBrowser.openBrowserAsync(target);
    } catch (e) {
      Linking.openURL(target).catch(() => {
        toast({
          type: "error",
          title: "No se pudo abrir",
          message: target,
        });
      });
    }
  };

  const previewThumb = media ? getPreviewThumbnail(media) : null;
  const platform = media ? PLATFORMS[media.platform] : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Compartir" subtitle="Música o videos" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 120 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* URL input — pieza principal de la pantalla */}
        <View
          style={[
            styles.urlBox,
            {
              backgroundColor: colors.card,
              borderColor: platform
                ? platform.color
                : url
                  ? colors.destructive + "55"
                  : colors.border,
            },
          ]}
        >
          <View style={styles.urlRow}>
            <View
              style={[
                styles.urlIconWrap,
                {
                  backgroundColor: platform
                    ? platform.color
                    : colors.primary + "22",
                },
              ]}
            >
              {platform ? (
                <Ionicons name={platform.icon} size={18} color="#fff" />
              ) : (
                <Feather name="link-2" size={16} color={colors.primary} />
              )}
            </View>
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="Pega un enlace aquí"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.urlInput, { color: colors.foreground }]}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="done"
            />
            {url ? (
              <Pressable
                onPress={() => setUrl("")}
                hitSlop={10}
                style={styles.clearBtn}
              >
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </Pressable>
            ) : null}
          </View>
          {url && !media ? (
            <View style={styles.helperRow}>
              <Feather
                name="alert-circle"
                size={12}
                color={colors.destructive}
              />
              <Text
                style={[styles.helperText, { color: colors.destructive }]}
              >
                Enlace no reconocido
              </Text>
            </View>
          ) : null}
          {media ? (
            <View style={styles.helperRow}>
              <Feather name="check-circle" size={12} color={platform.color} />
              <Text style={[styles.helperText, { color: platform.color }]}>
                {platform.label} detectado
              </Text>
            </View>
          ) : null}
        </View>

        {/* Vista previa: solo cuando hay un media válido */}
        {previewThumb ? (
          <View style={[styles.previewCard, { backgroundColor: colors.card }]}>
            <Image
              source={{ uri: previewThumb }}
              style={styles.previewThumb}
              contentFit="cover"
              transition={200}
            />
            <View
              style={[
                styles.previewBadge,
                { backgroundColor: platform.color },
              ]}
            >
              <Ionicons name={platform.icon} size={12} color="#fff" />
              <Text style={styles.previewBadgeText}>{platform.label}</Text>
            </View>
          </View>
        ) : media ? (
          <View
            style={[
              styles.platformPreview,
              { backgroundColor: platform.color },
            ]}
          >
            <View style={styles.platformPreviewIcon}>
              <Ionicons name={platform.icon} size={28} color="#fff" />
            </View>
            <View style={styles.platformPreviewText}>
              <Text style={styles.platformPreviewLabel}>{platform.label}</Text>
              <Text style={styles.platformPreviewSub} numberOfLines={1}>
                {media.url.replace(/^https?:\/\/(www\.)?/, "")}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Accesos rápidos a las apps — fila compacta */}
        {!media ? (
          <View style={styles.shortcutsBlock}>
            <Text
              style={[
                styles.sectionLabel,
                { color: colors.mutedForeground },
              ]}
            >
              ABRIR APP PARA COPIAR ENLACE
            </Text>
            <View style={styles.shortcutsRow}>
              {PLATFORM_ORDER.map((pid) => {
                const p = PLATFORMS[pid];
                return (
                  <Pressable
                    key={pid}
                    onPress={() => handleOpenPlatform(pid)}
                    style={({ pressed }) => [
                      styles.shortcutChip,
                      {
                        backgroundColor: p.color,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Ionicons name={p.icon} size={18} color="#fff" />
                    <Text style={styles.shortcutChipText}>{p.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Detalles */}
        <View style={styles.formBlock}>
          <View style={styles.fieldGroup}>
            <Text
              style={[styles.fieldLabel, { color: colors.mutedForeground }]}
            >
              TÍTULO
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={
                loadingMeta
                  ? "Detectando título..."
                  : "Nombre del video o canción"
              }
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                { backgroundColor: colors.card, color: colors.foreground },
              ]}
              editable={!loadingMeta || !!title}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text
              style={[styles.fieldLabel, { color: colors.mutedForeground }]}
            >
              ARTISTA O AUTOR
            </Text>
            <TextInput
              value={artist}
              onChangeText={setArtist}
              placeholder="Artista, canal o cuenta"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                { backgroundColor: colors.card, color: colors.foreground },
              ]}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text
              style={[styles.fieldLabel, { color: colors.mutedForeground }]}
            >
              MENSAJE PARA TUS AMIGOS
            </Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="¿Por qué deberían verlo?"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                styles.textarea,
                { backgroundColor: colors.card, color: colors.foreground },
              ]}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {error ? (
          <View
            style={[
              styles.errorBox,
              { backgroundColor: colors.destructive + "22" },
            ]}
          >
            <Feather
              name="alert-circle"
              size={16}
              color={colors.destructive}
            />
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {error}
            </Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <PrimaryButton
            label="Compartir con amigos"
            icon="send"
            onPress={handleShare}
            fullWidth
            size="lg"
            disabled={!media || !title.trim()}
          />
          {!media ? (
            <Text
              style={[styles.actionHint, { color: colors.mutedForeground }]}
            >
              Pega un enlace para activar el botón
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    gap: 14,
  },

  // URL input
  urlBox: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    gap: 6,
  },
  urlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  urlIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  urlInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    padding: 0,
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  helperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingLeft: 42,
  },
  helperText: {
    fontSize: 11.5,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },

  // Vista previa con thumbnail (YouTube)
  previewCard: {
    borderRadius: 14,
    overflow: "hidden",
    aspectRatio: 16 / 9,
    position: "relative",
  },
  previewThumb: {
    width: "100%",
    height: "100%",
  },
  previewBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  previewBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },

  // Vista previa horizontal (IG/TT/FB sin thumbnail)
  platformPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  platformPreviewIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  platformPreviewText: {
    flex: 1,
    gap: 2,
  },
  platformPreviewLabel: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  platformPreviewSub: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },

  // Atajos compactos
  shortcutsBlock: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 10.5,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    letterSpacing: 1,
  },
  shortcutsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  shortcutChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
  },
  shortcutChipText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },

  // Form
  formBlock: {
    gap: 14,
    marginTop: 2,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 10.5,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    letterSpacing: 1,
  },
  input: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
  },
  textarea: {
    minHeight: 84,
    paddingTop: 12,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    flex: 1,
  },
  actions: {
    paddingTop: 4,
    gap: 6,
  },
  actionHint: {
    fontSize: 11.5,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
});
