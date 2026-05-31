import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/Avatar";
import { Header } from "@/components/Header";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function FriendsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { users, me, following, toggleFollow } = useApp();
  const [tab, setTab] = useState("siguiendo");
  const [query, setQuery] = useState("");

  const others = users.filter((u) => u.id !== me.id);

  const data = useMemo(() => {
    let list = others;
    if (tab === "siguiendo") {
      list = list.filter((u) => following.includes(u.id));
    } else if (tab === "sugeridos") {
      list = list.filter((u) => !following.includes(u.id));
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.handle.toLowerCase().includes(q)
      );
    }
    return list;
  }, [others, following, tab, query]);

  const handleToggle = (userId) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    toggleFollow(userId);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Amigos" subtitle="Tu comunidad musical" />

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
            placeholder="Buscar amigos..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
            autoCapitalize="none"
          />
          {query ? (
            <Pressable onPress={() => setQuery("")}>
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.tabsWrap}>
        {[
          { id: "siguiendo", label: "Siguiendo" },
          { id: "sugeridos", label: "Sugeridos" },
          { id: "todos", label: "Todos" },
        ].map((t) => {
          const active = t.id === tab;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={({ pressed }) => [
                styles.tab,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: active ? "#fff" : colors.foreground },
                ]}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={data}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 20,
          paddingTop: 8,
          gap: 10,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isFollowing = following.includes(item.id);
          return (
            <View
              style={[styles.userRow, { backgroundColor: colors.card }]}
            >
              <Pressable
                onPress={() => router.push(`/user/${item.id}`)}
                style={({ pressed }) => [
                  styles.userInfoArea,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Avatar user={item} size={52} ring />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.userName, { color: colors.foreground }]}>
                    {item.name}
                  </Text>
                  <Text
                    style={[styles.userHandle, { color: colors.mutedForeground }]}
                  >
                    {item.handle}
                  </Text>
                  {item.bio ? (
                    <Text
                      style={[
                        styles.userBio,
                        { color: colors.mutedForeground },
                      ]}
                      numberOfLines={1}
                    >
                      {item.bio}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
              <Pressable
                onPress={() => handleToggle(item.id)}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.followBtn,
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
                <Text
                  style={[
                    styles.followText,
                    { color: isFollowing ? colors.foreground : "#fff" },
                  ]}
                >
                  {isFollowing ? "Siguiendo" : "Seguir"}
                </Text>
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Feather name="users" size={42} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {tab === "siguiendo"
                ? "Aún no sigues a nadie"
                : "Sin resultados"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrap: { paddingHorizontal: 20, paddingBottom: 12 },
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
  tabsWrap: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  tabText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
  },
  userInfoArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  userHandle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  userBio: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  followText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
