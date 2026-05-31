import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { PrimaryButton } from "@/components/PrimaryButton";
import { COUNTRIES, getCountry, normalizeText } from "@/constants/countries";
import { useApp } from "@/context/AppContext";
import { useUI } from "@/context/UIContext";
import { useColors } from "@/hooks/useColors";
import { PlatformThumb } from "@/components/PlatformThumb";

const AVATAR_OPTIONS = [
  "🎧", "🎸", "🎹", "🎤", "🥁", "🎺", "🎷", "🎻", "🪕", "🎼", "🪗", "🎙️",
  "🎵", "🎶", "🎬", "🎭", "🎨", "🎯", "🎲", "🎰", "🕺", "💃", "🪩", "📀",
  "🔥", "💎", "⚡", "🌟", "✨", "💫", "🌈", "☄️", "🌙", "☀️", "🪐", "🌌",
  "👑", "💀", "👻", "👽", "🤖", "🎃", "🛸", "🚀", "🛹", "🏆", "🥇", "💯",
  "🌹", "🌷", "🌻", "🌺", "🌸", "🌴", "🌵", "🍀", "🍁", "🍄", "🌶️", "🍒",
  "🦄", "🦊", "🐯", "🦁", "🐺", "🐲", "🐉", "🦋", "🦅", "🦉", "🐬", "🐙",
  "🦈", "🐼", "🐸", "🐵", "🐨", "🦖", "🦴", "🪲", "🦜", "🐢", "🐝", "🦩",
  "🧚", "🧜", "🧙", "🦸", "🦹", "🧞", "🥷", "🤴", "👸", "🧑‍🎤", "🕴️", "🦾",
  "😎", "🤩", "🥳", "🤘", "🫶", "💅", "👁️", "🫧", "💋", "💖", "💛", "🧿",
];

const AVATAR_COLORS = [
  "#FFBA00", "#f97316", "#ef4444", "#f59e0b", "#eab308",
  "#10b981", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
];

const colorForIndex = (i) => AVATAR_COLORS[i % AVATAR_COLORS.length];

const HOW_IT_WORKS = [
  "Crea tu perfil musical desde la pestaña Perfil.",
  "Pega enlaces de YouTube en Agregar para compartir música.",
  "Comparte tu código de usuario con tus amigos.",
  "Tus amigos te encuentran por código y empiezan a seguirte.",
];

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { me, mySongs, stats, updateProfile, removeSong, joinByCode, signOut } =
    useApp();
  const { confirm, toast } = useUI();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(me.name);
  const [handle, setHandle] = useState(me.handle);
  const [bio, setBio] = useState(me.bio);
  const [avatar, setAvatar] = useState(me.avatar);
  const [avatarColor, setAvatarColor] = useState(me.color || "#FFBA00");
  const [age, setAge] = useState(me.age ? String(me.age) : "");
  const [countryCode, setCountryCode] = useState(me.country || null);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinFeedback, setJoinFeedback] = useState(null);
  const [editError, setEditError] = useState(null);

  const myCode = (me.handle || "").replace(/^@/, "").toUpperCase();
  const editingCountry = countryCode ? getCountry(countryCode) : null;

  const filteredCountries = useMemo(() => {
    const q = normalizeText(countrySearch.trim());
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.searchKey.includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [countrySearch]);

  const handleSave = () => {
    setEditError(null);
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setEditError("El nombre debe tener al menos 2 letras.");
      return;
    }
    const trimmedHandle = handle.trim().replace(/^@+/, "");
    if (!trimmedHandle) {
      setEditError("El usuario no puede estar vacío.");
      return;
    }
    if (!age || age.trim() === "") {
      setEditError("Falta tu edad.");
      return;
    }
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum)) {
      setEditError("La edad debe ser un número.");
      return;
    }
    if (ageNum < 13) {
      setEditError("Debes tener al menos 13 años.");
      return;
    }
    if (ageNum > 120) {
      setEditError("Edad inválida.");
      return;
    }
    if (!countryCode) {
      setEditError("Selecciona tu país.");
      return;
    }
    const result = updateProfile({
      name: trimmedName,
      handle: handle.trim(),
      bio: bio.trim(),
      avatar,
      color: avatarColor,
      age: ageNum,
      country: countryCode,
    });
    if (result && result.ok === false) {
      setEditError(result.error);
      return;
    }
    setEditing(false);
  };

  const handleRandomColor = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    let next = avatarColor;
    while (next === avatarColor) {
      next = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    }
    setAvatarColor(next);
  };

  const handleDelete = (songId) => {
    confirm({
      title: "Eliminar canción",
      message: "¿Quieres eliminarla de tu perfil? Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      destructive: true,
      icon: "trash-2",
      onConfirm: () => {
        removeSong(songId);
        toast({ type: "success", message: "Canción eliminada" });
      },
    });
  };

  const handleJoin = () => {
    if (!joinCode.trim()) return;
    const user = joinByCode(joinCode);
    if (user) {
      setJoinFeedback({
        type: "success",
        text: `¡Conectado! Ahora sigues a ${user.name} (${user.handle}).`,
      });
      setJoinCode("");
    } else {
      setJoinFeedback({
        type: "error",
        text: "Código no encontrado. Prueba con: LUCIA, MARCO, KJFLOW, YARI o RASHFLOW.",
      });
    }
  };

  const handleShareCode = async () => {
    if (!myCode) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    try {
      await Share.share({
        message: `¡Sígueme en Share! Mi código es: ${myCode}\n\nDescarga la app y úsalo en "Unirse por código" para empezar a compartir música conmigo. 🎵`,
      });
    } catch (e) {
      toast({ type: "info", title: "Tu código", message: myCode });
    }
  };

  const handleSignOut = () => {
    const doSignOut = async () => {
      await signOut();
      setName("Tú");
      setHandle("@yo");
      setBio("Amante de la música. Compartiendo buenas vibras.");
      setAvatar("🎧");
      setAvatarColor("#FFBA00");
      setEditing(false);
    };
    confirm({
      title: "Cerrar sesión",
      message:
        "Tu cuenta queda guardada en este dispositivo. Podrás volver a entrar desde la pantalla de bienvenida.",
      confirmText: "Cerrar sesión",
      destructive: true,
      icon: "log-out",
      onConfirm: doSignOut,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Perfil"
        subtitle="Tu identidad musical"
        right={
          <Pressable
            onPress={() => {
              setEditError(null);
              if (editing) {
                setEditing(false);
              } else {
                setName(me.name);
                setHandle(me.handle);
                setBio(me.bio || "");
                setAvatar(me.avatar);
                setAvatarColor(me.color || "#FFBA00");
                setAge(me.age ? String(me.age) : "");
                setCountryCode(me.country || null);
                setEditing(true);
              }
            }}
            style={({ pressed }) => [
              styles.editBtn,
              {
                backgroundColor: editing ? colors.primary : colors.card,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Feather
              name={editing ? "x" : "edit-2"}
              size={16}
              color={editing ? "#fff" : colors.foreground}
            />
          </Pressable>
        }
      />

      <FlatList
        data={mySongs}
        keyExtractor={(s) => s.id}
        ListHeaderComponent={
          <>
            <View
              style={[
                styles.profileCard,
                { backgroundColor: colors.card },
              ]}
            >
              <View style={styles.avatarRow}>
                <Avatar
                  user={{ ...me, avatar, color: avatarColor }}
                  size={88}
                  ring
                />
                <View style={styles.statsRow}>
                  <Stat
                    value={stats.sharedCount}
                    label="Compartidas"
                    colors={colors}
                  />
                  <Stat
                    value={stats.friendsCount}
                    label="Amigos"
                    colors={colors}
                  />
                  <Stat
                    value={stats.likesReceived}
                    label="Likes"
                    colors={colors}
                  />
                </View>
              </View>

              {editing ? (
                <>
                  <View style={styles.fieldGroup}>
                    <View style={styles.avatarHeader}>
                      <Text
                        style={[
                          styles.fieldLabel,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        AVATAR
                      </Text>
                      <Pressable
                        onPress={handleRandomColor}
                        style={({ pressed }) => [
                          styles.randomColorBtn,
                          {
                            backgroundColor: avatarColor,
                            opacity: pressed ? 0.7 : 1,
                          },
                        ]}
                      >
                        <Feather name="shuffle" size={12} color="#fff" />
                        <Text style={styles.randomColorText}>
                          Color al azar
                        </Text>
                      </Pressable>
                    </View>
                    <View style={styles.avatarPicker}>
                      {AVATAR_OPTIONS.map((emoji, i) => {
                        const optionColor = colorForIndex(i);
                        const selected = avatar === emoji;
                        return (
                          <Pressable
                            key={emoji}
                            onPress={() => {
                              setAvatar(emoji);
                              setAvatarColor(optionColor);
                              if (Platform.OS !== "web") {
                                Haptics.selectionAsync().catch(() => {});
                              }
                            }}
                            style={({ pressed }) => [
                              styles.avatarOption,
                              {
                                backgroundColor: optionColor,
                                opacity: pressed ? 0.7 : selected ? 1 : 0.5,
                                borderWidth: selected ? 2 : 0,
                                borderColor: colors.foreground,
                              },
                            ]}
                          >
                            <Text style={styles.avatarEmoji}>{emoji}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <Field
                    label="NOMBRE"
                    value={name}
                    onChange={setName}
                    colors={colors}
                  />
                  <Field
                    label="USUARIO"
                    value={handle}
                    onChange={setHandle}
                    colors={colors}
                  />
                  <Field
                    label="BIO"
                    value={bio}
                    onChange={setBio}
                    colors={colors}
                    multiline
                  />

                  <View style={styles.fieldGroup}>
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      EDAD
                    </Text>
                    <TextInput
                      value={age}
                      onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ""))}
                      placeholder="Ej. 24"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="number-pad"
                      maxLength={3}
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.card,
                          color: colors.foreground,
                          borderWidth: 1,
                          borderColor: colors.border,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      PAÍS
                    </Text>
                    <Pressable
                      onPress={() => setCountryPickerOpen(true)}
                      style={({ pressed }) => [
                        styles.input,
                        styles.countryButtonProfile,
                        {
                          backgroundColor: colors.card,
                          borderWidth: 1,
                          borderColor: colors.border,
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      {editingCountry ? (
                        <>
                          <Text style={styles.countryButtonFlag}>
                            {editingCountry.flag}
                          </Text>
                          <Text
                            style={[
                              styles.countryButtonName,
                              { color: colors.foreground },
                            ]}
                            numberOfLines={1}
                          >
                            {editingCountry.name}
                          </Text>
                        </>
                      ) : (
                        <Text
                          style={[
                            styles.countryButtonPlaceholder,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          Selecciona tu país
                        </Text>
                      )}
                      <Feather
                        name="chevron-down"
                        size={16}
                        color={colors.mutedForeground}
                      />
                    </Pressable>
                  </View>

                  {editError ? (
                    <View
                      style={[
                        styles.editErrorBox,
                        { backgroundColor: "rgba(239,68,68,0.15)" },
                      ]}
                    >
                      <Feather
                        name="alert-circle"
                        size={14}
                        color="#ef4444"
                      />
                      <Text style={styles.editErrorText}>{editError}</Text>
                    </View>
                  ) : null}

                  <View style={{ marginTop: 8 }}>
                    <PrimaryButton
                      label="Guardar cambios"
                      icon="check"
                      onPress={handleSave}
                      fullWidth
                    />
                  </View>
                </>
              ) : (
                <>
                  <Text
                    style={[styles.profileName, { color: colors.foreground }]}
                  >
                    {me.name}
                  </Text>
                  <Text
                    style={[
                      styles.profileHandle,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {me.handle}
                  </Text>
                  {me.bio ? (
                    <Text
                      style={[
                        styles.profileBio,
                        { color: colors.foreground },
                      ]}
                    >
                      {me.bio}
                    </Text>
                  ) : null}
                  {(me.country || me.age) ? (
                    <View style={styles.metaRow}>
                      {me.country
                        ? (() => {
                            const c = getCountry(me.country);
                            return c ? (
                              <View style={styles.metaChip}>
                                <Text style={styles.metaFlag}>{c.flag}</Text>
                                <Text
                                  style={[
                                    styles.metaText,
                                    { color: colors.foreground },
                                  ]}
                                >
                                  {c.name}
                                </Text>
                              </View>
                            ) : null;
                          })()
                        : null}
                      {me.age ? (
                        <View style={styles.metaChip}>
                          <Feather
                            name="calendar"
                            size={12}
                            color={colors.mutedForeground}
                          />
                          <Text
                            style={[
                              styles.metaText,
                              { color: colors.foreground },
                            ]}
                          >
                            {me.age} años
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </>
              )}
            </View>

            <View style={styles.sectionHeader}>
              <Text
                style={[styles.sectionTitle, { color: colors.foreground }]}
              >
                Mis canciones
              </Text>
              <Text
                style={[
                  styles.sectionCount,
                  { color: colors.mutedForeground },
                ]}
              >
                {mySongs.length}
              </Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/song/${item.id}`)}
            onLongPress={() => handleDelete(item.id)}
            style={({ pressed }) => [
              styles.songRow,
              {
                backgroundColor: colors.card,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <PlatformThumb song={item} style={styles.songThumb} quality="mq" />
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.songTitle, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.songMeta,
                  { color: colors.mutedForeground },
                ]}
                numberOfLines={1}
              >
                {item.artist}
              </Text>
              <View style={styles.songFooter}>
                <Feather name="heart" size={12} color={colors.primary} />
                <Text
                  style={[
                    styles.songFooterText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {item.likes.length}
                </Text>
                <Feather
                  name="message-circle"
                  size={12}
                  color={colors.mutedForeground}
                  style={{ marginLeft: 8 }}
                />
                <Text
                  style={[
                    styles.songFooterText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {item.comments.length}
                </Text>
              </View>
            </View>
            <Feather
              name="chevron-right"
              size={20}
              color={colors.mutedForeground}
            />
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="music"
            title="Aún no compartes música"
            subtitle="Pega un enlace de YouTube para empezar a compartir."
            action={
              <PrimaryButton
                label="Compartir canción"
                icon="plus"
                onPress={() => router.push("/(tabs)/add")}
              />
            }
          />
        }
        ListFooterComponent={
          <View style={styles.footerSection}>
            <View
              style={[styles.infoCard, { backgroundColor: colors.card }]}
            >
              <View style={styles.cardTitleRow}>
                <Feather name="hash" size={20} color={colors.primary} />
                <Text
                  style={[styles.cardTitle, { color: colors.foreground }]}
                >
                  Unirse por código
                </Text>
              </View>
              <Text
                style={[
                  styles.cardSubtitle,
                  { color: colors.mutedForeground },
                ]}
              >
                Pídele a un amigo el código de su perfil para seguirle.
              </Text>

              <TextInput
                value={joinCode}
                onChangeText={(t) => {
                  setJoinCode(t);
                  if (joinFeedback) setJoinFeedback(null);
                }}
                placeholder="ABC123"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="characters"
                autoCorrect={false}
                style={[
                  styles.codeInput,
                  {
                    backgroundColor: colors.background,
                    color: colors.foreground,
                    borderColor: colors.border,
                  },
                ]}
              />

              <Pressable
                onPress={handleJoin}
                disabled={!joinCode.trim()}
                style={({ pressed }) => [
                  styles.joinBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: !joinCode.trim() ? 0.4 : pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={styles.joinBtnText}>Unirme</Text>
              </Pressable>

              {joinFeedback ? (
                <View
                  style={[
                    styles.joinFeedback,
                    {
                      backgroundColor:
                        joinFeedback.type === "success"
                          ? "rgba(34,197,94,0.15)"
                          : "rgba(239,68,68,0.15)",
                      borderColor:
                        joinFeedback.type === "success"
                          ? "#22c55e"
                          : "#ef4444",
                    },
                  ]}
                >
                  <Feather
                    name={
                      joinFeedback.type === "success"
                        ? "check-circle"
                        : "alert-circle"
                    }
                    size={14}
                    color={
                      joinFeedback.type === "success" ? "#22c55e" : "#ef4444"
                    }
                  />
                  <Text
                    style={[
                      styles.joinFeedbackText,
                      {
                        color:
                          joinFeedback.type === "success"
                            ? "#22c55e"
                            : "#ef4444",
                      },
                    ]}
                  >
                    {joinFeedback.text}
                  </Text>
                </View>
              ) : null}

              <Pressable
                onPress={handleShareCode}
                disabled={!myCode}
                style={({ pressed }) => [
                  styles.myCodeBox,
                  {
                    borderColor: colors.primary,
                    opacity: !myCode ? 0.5 : pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.myCodeLabel,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    TU CÓDIGO
                  </Text>
                  <Text
                    style={[styles.myCodeValue, { color: colors.foreground }]}
                  >
                    {myCode || "—"}
                  </Text>
                  <Text
                    style={[
                      styles.myCodeHint,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Toca para compartirlo con tus amigos
                  </Text>
                </View>
                <View
                  style={[
                    styles.myCodeShareBtn,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Feather name="share-2" size={18} color="#fff" />
                </View>
              </Pressable>
            </View>

            <View
              style={[styles.infoCard, { backgroundColor: colors.card }]}
            >
              <View style={styles.cardTitleRow}>
                <Feather name="users" size={20} color={colors.primary} />
                <Text
                  style={[styles.cardTitle, { color: colors.foreground }]}
                >
                  Cómo funciona
                </Text>
              </View>
              {HOW_IT_WORKS.map((step, idx) => (
                <Text
                  key={idx}
                  style={[styles.stepText, { color: colors.foreground }]}
                >
                  {idx + 1}. {step}
                </Text>
              ))}
            </View>

            <Pressable
              onPress={handleSignOut}
              style={({ pressed }) => [
                styles.signOutBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Feather name="log-out" size={18} color={colors.primary} />
              <Text style={[styles.signOutText, { color: colors.primary }]}>
                Cerrar sesión
              </Text>
            </Pressable>
          </View>
        }
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 100,
          gap: 10,
        }}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={countryPickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setCountryPickerOpen(false)}
      >
        <View
          style={[
            styles.cpBackdrop,
            { paddingTop: insets.top + 40 },
          ]}
        >
          <View
            style={[
              styles.cpSheet,
              {
                backgroundColor: colors.background,
                paddingBottom: insets.bottom + 12,
              },
            ]}
          >
            <View style={styles.cpHandle} />
            <View style={styles.cpHeader}>
              <Text style={[styles.cpTitle, { color: colors.foreground }]}>
                Selecciona tu país
              </Text>
              <Pressable
                onPress={() => setCountryPickerOpen(false)}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.cpClose,
                  {
                    backgroundColor: colors.card,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Feather name="x" size={18} color={colors.foreground} />
              </Pressable>
            </View>

            <View style={styles.cpSearchBox}>
              <Feather
                name="search"
                size={16}
                color={colors.mutedForeground}
              />
              <TextInput
                value={countrySearch}
                onChangeText={setCountrySearch}
                placeholder="Buscar país"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.cpSearchInput,
                  {
                    backgroundColor: colors.card,
                    color: colors.foreground,
                  },
                ]}
              />
            </View>

            <FlatList
              data={filteredCountries}
              keyExtractor={(c) => c.code}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const selected = countryCode === item.code;
                return (
                  <Pressable
                    onPress={() => {
                      setCountryCode(item.code);
                      setCountryPickerOpen(false);
                      setCountrySearch("");
                    }}
                    style={({ pressed }) => [
                      styles.cpRow,
                      {
                        backgroundColor: selected
                          ? colors.card
                          : "transparent",
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text style={styles.cpRowFlag}>{item.flag}</Text>
                    <Text
                      style={[
                        styles.cpRowName,
                        { color: colors.foreground },
                      ]}
                    >
                      {item.name}
                    </Text>
                    {selected ? (
                      <Feather
                        name="check"
                        size={18}
                        color={colors.primary}
                      />
                    ) : null}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text
                  style={[
                    styles.cpEmpty,
                    { color: colors.mutedForeground },
                  ]}
                >
                  No se encontró ningún país.
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Stat({ value, label, colors }) {
  return (
    <View style={statStyles.box}>
      <Text style={[statStyles.value, { color: colors.foreground }]}>
        {value}
      </Text>
      <Text style={[statStyles.label, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

function Field({ label, value, onChange, colors, multiline = false }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        style={[
          styles.input,
          multiline && styles.inputMulti,
          { backgroundColor: colors.background, color: colors.foreground },
        ]}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        placeholderTextColor={colors.mutedForeground}
      />
    </View>
  );
}

const statStyles = StyleSheet.create({
  box: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  value: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    letterSpacing: 0.5,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  profileCard: {
    marginHorizontal: 20,
    marginTop: 4,
    padding: 18,
    borderRadius: 20,
    gap: 12,
    marginBottom: 16,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 4,
  },
  statsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  profileName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  profileHandle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: -8,
  },
  profileBio: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  metaFlag: {
    fontSize: 14,
  },
  metaCodeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 30,
    alignItems: "center",
  },
  metaCodeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  fieldGroup: {
    gap: 8,
  },
  editErrorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  editErrorText: {
    color: "#ef4444",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    letterSpacing: 1,
  },
  input: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  inputMulti: {
    minHeight: 70,
    paddingTop: 12,
  },
  avatarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  randomColorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  randomColorText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  avatarPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  avatarOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 22,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingHorizontal: 4,
    paddingBottom: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    flex: 1,
  },
  sectionCount: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 14,
  },
  songThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#000",
  },
  songTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  songMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  songFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  songFooterText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  footerSection: {
    marginTop: 16,
    gap: 14,
  },
  infoCard: {
    padding: 18,
    borderRadius: 20,
    gap: 12,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Inter_400Regular",
  },
  codeInput: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    letterSpacing: 4,
    textAlign: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  joinBtn: {
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  joinBtnText: {
    color: "#1a1206",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  joinFeedback: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  joinFeedbackText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    lineHeight: 16,
  },
  myCodeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    marginTop: 4,
  },
  myCodeLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    letterSpacing: 1,
  },
  myCodeValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 2,
  },
  myCodeHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  myCodeShareBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "Inter_500Medium",
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 999,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  countryButtonProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  countryButtonFlag: {
    fontSize: 22,
  },
  countryButtonName: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  countryButtonPlaceholder: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  cpBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  cpSheet: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
  },
  cpHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginTop: 10,
    marginBottom: 14,
  },
  cpHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cpTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  cpClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cpSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  cpSearchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
  },
  cpRowFlag: {
    fontSize: 22,
  },
  cpRowName: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  cpEmpty: {
    textAlign: "center",
    paddingVertical: 28,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
