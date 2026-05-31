import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/Avatar";
import { SongTile } from "@/components/SongTile";
import { getCountry } from "@/constants/countries";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function UserProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const { users, songs, following, toggleFollow, me } = useApp();

  const user = useMemo(
    () => users.find((u) => u.id === id),
    [users, id]
  );

  const userSongs = useMemo(
    () =>
      songs
        .filter((s) => s.addedById === id)
        .sort((a, b) => b.sharedAt - a.sharedAt),
    [songs, id]
  );

  if (!user) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          },
        ]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <Feather name="user-x" size={48} color={colors.mutedForeground} />
        <Text
          style={{
            color: colors.foreground,
            fontFamily: "Inter_600SemiBold",
            fontSize: 16,
            marginTop: 16,
          }}
        >
          Usuario no encontrado
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: 20,
            paddingHorizontal: 20,
            paddingVertical: 12,
            backgroundColor: colors.primary,
            borderRadius: 999,
          }}
        >
          <Text
            style={{
              color: "#1a1206",
              fontFamily: "Inter_700Bold",
              fontSize: 14,
            }}
          >
            Volver
          </Text>
        </Pressable>
      </View>
    );
  }

  const isMe = user.id === me.id;
  const isFollowing = following.includes(user.id);
  const country = user.country ? getCountry(user.country) : null;

  const sharedCount = userSongs.length;
  const likesReceived = userSongs.reduce(
    (acc, s) => acc + (s.likes?.length || 0),
    0
  );

  const handleToggle = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    toggleFollow(user.id);
  };

  const renderHeader = () => (
    <View>
      <View
        style={[
          styles.topBar,
          { paddingTop: insets.top + 12, backgroundColor: colors.background },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: colors.card,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text
          style={[styles.topTitle, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {user.name}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.profileBlock}>
        <Avatar user={user} size={96} ring />
        <Text style={[styles.name, { color: colors.foreground }]}>
          {user.name}
        </Text>
        <Text style={[styles.handle, { color: colors.mutedForeground }]}>
          {user.handle}
        </Text>

        {user.bio ? (
          <Text style={[styles.bio, { color: colors.foreground }]}>
            {user.bio}
          </Text>
        ) : null}

        {country || user.age ? (
          <View style={styles.metaRow}>
            {country ? (
              <View
                style={[
                  styles.metaChip,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={styles.metaFlag}>{country.flag}</Text>
                <Text
                  style={[styles.metaText, { color: colors.foreground }]}
                >
                  {country.name}
                </Text>
              </View>
            ) : null}
            {user.age ? (
              <View
                style={[
                  styles.metaChip,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Feather name="user" size={13} color={colors.mutedForeground} />
                <Text
                  style={[styles.metaText, { color: colors.foreground }]}
                >
                  {user.age} años
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {sharedCount}
            </Text>
            <Text
              style={[styles.statLabel, { color: colors.mutedForeground }]}
            >
              Compartidas
            </Text>
          </View>
          <View
            style={[styles.statSep, { backgroundColor: colors.border }]}
          />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {likesReceived}
            </Text>
            <Text
              style={[styles.statLabel, { color: colors.mutedForeground }]}
            >
              Me gusta
            </Text>
          </View>
        </View>

        {!isMe ? (
          <Pressable
            onPress={handleToggle}
            style={({ pressed }) => [
              styles.followCta,
              {
                backgroundColor: isFollowing
                  ? "transparent"
                  : colors.primary,
                borderColor: isFollowing ? colors.border : colors.primary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Feather
              name={isFollowing ? "check" : "user-plus"}
              size={16}
              color={isFollowing ? colors.foreground : "#1a1206"}
            />
            <Text
              style={[
                styles.followCtaText,
                {
                  color: isFollowing ? colors.foreground : "#1a1206",
                },
              ]}
            >
              {isFollowing ? "Siguiendo" : "Seguir"}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push("/(tabs)/profile")}
            style={({ pressed }) => [
              styles.followCta,
              {
                backgroundColor: "transparent",
                borderColor: colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Feather name="edit-2" size={14} color={colors.foreground} />
            <Text
              style={[styles.followCtaText, { color: colors.foreground }]}
            >
              Editar perfil
            </Text>
          </Pressable>
        )}
      </View>

      <Text
        style={[styles.sectionLabel, { color: colors.mutedForeground }]}
      >
        CANCIONES COMPARTIDAS
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList
        data={
          userSongs.length % 2 === 1
            ? [...userSongs, { id: "__placeholder__", __placeholder: true }]
            : userSongs
        }
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) =>
          item.__placeholder ? (
            <View style={[styles.tileWrap, styles.tilePlaceholder]} />
          ) : (
            <View style={styles.tileWrap}>
              <SongTile song={item} />
            </View>
          )
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Feather name="music" size={36} color={colors.mutedForeground} />
            <Text
              style={[styles.emptyText, { color: colors.mutedForeground }]}
            >
              {isMe
                ? "Aún no has compartido nada"
                : `${user.name.split(" ")[0]} aún no ha compartido nada`}
            </Text>
          </View>
        }
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  profileBlock: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 10,
  },
  name: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    marginTop: 8,
  },
  handle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  bio: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  metaFlag: {
    fontSize: 14,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    marginTop: 14,
  },
  statItem: { alignItems: "center" },
  statValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  statSep: {
    width: 1,
    height: 28,
  },
  followCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 18,
    minWidth: 160,
  },
  followCtaText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    letterSpacing: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
  },
  row: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 10,
  },
  tileWrap: {
    flex: 1,
    maxWidth: "50%",
  },
  tilePlaceholder: {
    aspectRatio: 3 / 4,
    opacity: 0,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 50,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
