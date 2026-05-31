import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SongTile } from "@/components/SongTile";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const TILE_GAP = 10;

export default function FeedScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { feedSongs, me, users, following } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const followedUsers = users.filter((u) => following.includes(u.id));

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const renderHeader = () => (
    <>
      <Header
        title={`Hola, ${me.name.split(" ")[0]}`}
        subtitle="Tu feed musical"
        right={
          <Pressable
            onPress={() => router.push("/(tabs)/profile")}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Avatar user={me} size={42} ring />
          </Pressable>
        }
      />

      {followedUsers.length > 0 ? (
        <View style={styles.storiesSection}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesList}
            data={[me, ...followedUsers]}
            keyExtractor={(u) => u.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() =>
                  item.id === me.id
                    ? router.push("/(tabs)/profile")
                    : router.push(`/user/${item.id}`)
                }
                style={({ pressed }) => [
                  styles.storyItem,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Avatar user={item} size={62} ring />
                <Text
                  style={[styles.storyName, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {item.id === me.id ? "Tú" : item.name.split(" ")[0]}
                </Text>
              </Pressable>
            )}
          />
        </View>
      ) : null}

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
        ÚLTIMAS COMPARTIDAS
      </Text>
    </>
  );

  // Aseguramos un número par de items para que el grid de 2 columnas
  // nunca estire la última tarjeta a ancho completo.
  const gridData =
    feedSongs.length % 2 === 1
      ? [...feedSongs, { id: "__placeholder__", __placeholder: true }]
      : feedSongs;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={gridData}
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
          <EmptyState
            icon="music"
            title="Tu feed está vacío"
            subtitle="Sigue a tus amigos o comparte tu primera canción para empezar."
            action={
              <PrimaryButton
                label="Compartir canción"
                icon="plus"
                onPress={() => router.push("/(tabs)/add")}
              />
            }
          />
        }
        refreshControl={
          Platform.OS !== "web" ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          ) : undefined
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
  container: {
    flex: 1,
  },
  storiesSection: {
    paddingTop: 6,
    paddingBottom: 14,
  },
  storiesList: {
    paddingHorizontal: 16,
    gap: 14,
  },
  storyItem: {
    alignItems: "center",
    gap: 6,
    width: 70,
  },
  storyName: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
  },
  row: {
    paddingHorizontal: 16,
    gap: TILE_GAP,
    marginBottom: TILE_GAP,
  },
  tileWrap: {
    flex: 1,
    maxWidth: "50%",
  },
  tilePlaceholder: {
    aspectRatio: 3 / 4,
    opacity: 0,
  },
});
