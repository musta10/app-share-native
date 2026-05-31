import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
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
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { PlatformThumb } from "@/components/PlatformThumb";

export default function DiscoverScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { songs, users, me, following, toggleFollow } = useApp();
  const [query, setQuery] = useState("");

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const songMatches = songs
      .filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.artist || "").toLowerCase().includes(q)
      )
      .map((s) => ({ type: "song", data: s }));
    const userMatches = users
      .filter(
        (u) =>
          u.id !== me.id &&
          (u.name.toLowerCase().includes(q) ||
            u.handle.toLowerCase().includes(q))
      )
      .map((u) => ({ type: "user", data: u }));
    return [...songMatches, ...userMatches];
  }, [query, songs, users, me.id]);

  const handleToggleFollow = (userId) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    toggleFollow(userId);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Descubrir" subtitle="Encuentra amigos y canciones" />

      <View style={styles.searchWrap}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Busca canciones, artistas o amigos..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {query ? (
            <Pressable onPress={() => setQuery("")}>
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {query ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Resultados
            </Text>
            {searchResults.length === 0 ? (
              <Text
                style={[styles.emptyText, { color: colors.mutedForeground }]}
              >
                Sin resultados para "{query}"
              </Text>
            ) : (
              <View style={{ gap: 10 }}>
                {searchResults.map((r, i) => {
                  if (r.type === "song") {
                    const s = r.data;
                    return (
                      <Pressable
                        key={`s-${s.id}-${i}`}
                        onPress={() => router.push(`/song/${s.id}`)}
                        style={({ pressed }) => [
                          styles.resultRow,
                          {
                            backgroundColor: colors.card,
                            opacity: pressed ? 0.8 : 1,
                          },
                        ]}
                      >
                        <PlatformThumb song={s} style={styles.resultThumb} quality="mq" />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.resultTitle,
                              { color: colors.foreground },
                            ]}
                            numberOfLines={1}
                          >
                            {s.title}
                          </Text>
                          <Text
                            style={[
                              styles.resultMeta,
                              { color: colors.mutedForeground },
                            ]}
                            numberOfLines={1}
                          >
                            {s.artist}
                          </Text>
                        </View>
                        <Feather
                          name="chevron-right"
                          size={20}
                          color={colors.mutedForeground}
                        />
                      </Pressable>
                    );
                  }
                  const u = r.data;
                  const isFollowing = following.includes(u.id);
                  return (
                    <View
                      key={`u-${u.id}-${i}`}
                      style={[
                        styles.resultRow,
                        { backgroundColor: colors.card },
                      ]}
                    >
                      <View
                        style={[
                          styles.userAvatar,
                          { backgroundColor: u.color || colors.primary },
                        ]}
                      >
                        <Text style={{ fontSize: 22 }}>{u.avatar}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.resultTitle,
                            { color: colors.foreground },
                          ]}
                        >
                          {u.name}
                        </Text>
                        <Text
                          style={[
                            styles.resultMeta,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          {u.handle}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => handleToggleFollow(u.id)}
                        style={({ pressed }) => [
                          styles.followPill,
                          {
                            backgroundColor: isFollowing
                              ? "transparent"
                              : colors.primary,
                            borderColor: isFollowing
                              ? colors.border
                              : colors.primary,
                            opacity: pressed ? 0.8 : 1,
                          },
                        ]}
                      >
                        <Feather
                          name={isFollowing ? "check" : "user-plus"}
                          size={14}
                          color={isFollowing ? colors.foreground : "#fff"}
                        />
                        <Text
                          style={[
                            styles.followPillText,
                            {
                              color: isFollowing
                                ? colors.foreground
                                : "#fff",
                            },
                          ]}
                        >
                          {isFollowing ? "Siguiendo" : "Seguir"}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.placeholder}>
            <View
              style={[
                styles.placeholderIcon,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Feather name="search" size={32} color={colors.primary} />
            </View>
            <Text
              style={[styles.placeholderTitle, { color: colors.foreground }]}
            >
              Empieza a buscar
            </Text>
            <Text
              style={[
                styles.placeholderText,
                { color: colors.mutedForeground },
              ]}
            >
              Encuentra a tus amigos por nombre o usuario, o busca canciones que
              hayan compartido.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrap: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    paddingVertical: 12,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 14,
  },
  resultThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: "#000",
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  resultTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  resultMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  followPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  followPillText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  placeholder: {
    paddingHorizontal: 32,
    paddingTop: 60,
    alignItems: "center",
    gap: 14,
  },
  placeholderIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  placeholderTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
