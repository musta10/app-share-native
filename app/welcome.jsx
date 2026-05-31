import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/Avatar";
import { COUNTRIES, getCountry, normalizeText } from "@/constants/countries";
import { useApp } from "@/context/AppContext";
import { useUI } from "@/context/UIContext";
import { useColors } from "@/hooks/useColors";

export default function WelcomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { confirm } = useUI();
  const {
    hydrated,
    completeOnboarding,
    savedAccounts,
    switchAccount,
    removeAccount,
  } = useApp();

  const hasAccounts = savedAccounts.length > 0;
  const [mode, setMode] = useState(null);

  useEffect(() => {
    if (mode === null && hydrated) {
      setMode(hasAccounts ? "list" : "create");
    }
  }, [hydrated, hasAccounts, mode]);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [country, setCountry] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState(null);

  const ageNum = parseInt(age, 10);
  const validAge = !isNaN(ageNum) && ageNum >= 13 && ageNum <= 120;

  const filtered = useMemo(() => {
    const q = normalizeText(search.trim());
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.searchKey.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [search]);

  const handleSelectAccount = (accountId) => {
    if (switchAccount(accountId)) {
      router.replace("/(tabs)");
    }
  };

  const handleRemoveAccount = (account) => {
    confirm({
      title: "Eliminar cuenta",
      message: `¿Eliminar la cuenta de ${account.profile.name}? Se perderán sus canciones, likes y comentarios guardados en este dispositivo.`,
      confirmText: "Eliminar",
      destructive: true,
      icon: "trash-2",
      onConfirm: () => removeAccount(account.id),
    });
  };

  const handleContinue = () => {
    if (name.trim().length < 2) {
      setFeedback({ type: "error", text: "Escribe tu nombre (mínimo 2 letras)." });
      return;
    }
    if (!age) {
      setFeedback({ type: "error", text: "Falta tu edad." });
      return;
    }
    if (isNaN(ageNum)) {
      setFeedback({ type: "error", text: "La edad debe ser un número." });
      return;
    }
    if (ageNum < 13) {
      setFeedback({ type: "error", text: "Debes tener al menos 13 años." });
      return;
    }
    if (ageNum > 120) {
      setFeedback({ type: "error", text: "Edad inválida." });
      return;
    }
    if (!country) {
      setFeedback({ type: "error", text: "Selecciona tu país." });
      return;
    }
    setFeedback(null);
    const result = completeOnboarding({
      name,
      age: ageNum,
      country: country.code,
    });
    if (result && result.ok === false) {
      setFeedback({ type: "error", text: result.error });
      return;
    }
    router.replace("/(tabs)");
  };

  const showAccountList = mode === "list" && hasAccounts;

  if (!hydrated || mode === null) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]} />
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.inner,
          {
            paddingTop: insets.top + 28,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoBox}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        <View style={styles.headings}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {showAccountList ? "Bienvenido de vuelta" : "Bienvenido a Share"}
          </Text>
          <Text
            style={[styles.subtitle, { color: colors.mutedForeground }]}
          >
            {showAccountList
              ? "Elige una cuenta para continuar."
              : "Cuéntanos un poco sobre ti para empezar."}
          </Text>
        </View>

        {showAccountList ? (
          <View style={styles.accountsList}>
            {savedAccounts.map((acc) => {
              const c = acc.profile.country
                ? getCountry(acc.profile.country)
                : null;
              return (
                <View
                  key={acc.id}
                  style={[
                    styles.accountCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => handleSelectAccount(acc.id)}
                    style={({ pressed }) => [
                      styles.accountMain,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Avatar user={acc.profile} size={52} ring />
                    <View style={styles.accountInfo}>
                      <Text
                        style={[
                          styles.accountName,
                          { color: colors.foreground },
                        ]}
                        numberOfLines={1}
                      >
                        {acc.profile.name}
                      </Text>
                      <Text
                        style={[
                          styles.accountHandle,
                          { color: colors.mutedForeground },
                        ]}
                        numberOfLines={1}
                      >
                        {acc.profile.handle}
                        {c ? `  ·  ${c.flag} ${c.name}` : ""}
                      </Text>
                    </View>
                    <Feather
                      name="arrow-right"
                      size={20}
                      color={colors.primary}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => handleRemoveAccount(acc)}
                    hitSlop={10}
                    style={({ pressed }) => [
                      styles.accountRemove,
                      { opacity: pressed ? 0.5 : 1 },
                    ]}
                  >
                    <Feather name="x" size={14} color={colors.mutedForeground} />
                  </Pressable>
                </View>
              );
            })}

            <Pressable
              onPress={() => {
                setMode("create");
                setFeedback(null);
              }}
              style={({ pressed }) => [
                styles.newAccountBtn,
                {
                  borderColor: colors.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Feather name="plus" size={18} color={colors.primary} />
              <Text style={[styles.newAccountText, { color: colors.primary }]}>
                Crear cuenta nueva
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {hasAccounts ? (
              <Pressable
                onPress={() => {
                  setMode("list");
                  setFeedback(null);
                }}
                style={({ pressed }) => [
                  styles.backToList,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Feather
                  name="arrow-left"
                  size={14}
                  color={colors.mutedForeground}
                />
                <Text
                  style={[styles.backToListText, { color: colors.mutedForeground }]}
                >
                  Volver a tus cuentas guardadas
                </Text>
              </Pressable>
            ) : null}

            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>
                  ¿CÓMO TE LLAMAS?
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Tu nombre"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={30}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      color: colors.foreground,
                      borderColor: name.trim()
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>
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
                      borderColor: validAge ? colors.primary : colors.border,
                    },
                  ]}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>
                  PAÍS
                </Text>
                <Pressable
                  onPress={() => setPickerOpen(true)}
                  style={({ pressed }) => [
                    styles.input,
                    styles.countryButton,
                    {
                      backgroundColor: colors.card,
                      borderColor: country ? colors.primary : colors.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  {country ? (
                    <>
                      <Text style={styles.countryFlag}>{country.flag}</Text>
                      <Text
                        style={[
                          styles.countryName,
                          { color: colors.foreground },
                        ]}
                      >
                        {country.name}
                      </Text>
                    </>
                  ) : (
                    <Text
                      style={[
                        styles.countryPlaceholder,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Selecciona tu país
                    </Text>
                  )}
                  <Feather
                    name="chevron-down"
                    size={18}
                    color={colors.mutedForeground}
                  />
                </Pressable>
              </View>

              <Text
                style={[styles.hint, { color: colors.mutedForeground }]}
              >
                Tus datos se guardan solo en este dispositivo. Podrás cambiarlos
                cuando quieras.
              </Text>
            </View>

            {feedback ? (
              <View
                style={[
                  styles.feedback,
                  {
                    backgroundColor:
                      feedback.type === "error" ? "#3b1212" : "#0f2a16",
                    borderColor:
                      feedback.type === "error" ? "#ef4444" : "#22c55e",
                  },
                ]}
              >
                <Feather
                  name={feedback.type === "error" ? "alert-circle" : "check-circle"}
                  size={16}
                  color={feedback.type === "error" ? "#ef4444" : "#22c55e"}
                />
                <Text
                  style={[
                    styles.feedbackText,
                    {
                      color: feedback.type === "error" ? "#fecaca" : "#bbf7d0",
                    },
                  ]}
                >
                  {feedback.text}
                </Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleContinue}
              style={({ pressed }) => [
                styles.cta,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.85 : 1,
                  marginTop: feedback ? 12 : 24,
                },
              ]}
            >
              <Text style={styles.ctaText}>Empezar</Text>
              <Feather name="arrow-right" size={20} color="#1a1206" />
            </Pressable>
          </>
        )}
      </ScrollView>

      <Modal
        visible={pickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
        <View
          style={[
            styles.modalBackdrop,
            { paddingTop: insets.top + 40 },
          ]}
        >
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.background,
                paddingBottom: insets.bottom + 12,
              },
            ]}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text
                style={[styles.modalTitle, { color: colors.foreground }]}
              >
                Selecciona tu país
              </Text>
              <Pressable
                onPress={() => setPickerOpen(false)}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.modalClose,
                  {
                    backgroundColor: colors.card,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Feather name="x" size={18} color={colors.foreground} />
              </Pressable>
            </View>

            <View style={styles.searchBox}>
              <Feather
                name="search"
                size={16}
                color={colors.mutedForeground}
              />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar país"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: colors.card,
                    color: colors.foreground,
                  },
                ]}
              />
            </View>

            <FlatList
              data={filtered}
              keyExtractor={(c) => c.code}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const selected = country?.code === item.code;
                return (
                  <Pressable
                    onPress={() => {
                      setCountry(item);
                      setPickerOpen(false);
                      setSearch("");
                    }}
                    style={({ pressed }) => [
                      styles.countryRow,
                      {
                        backgroundColor: selected
                          ? colors.card
                          : "transparent",
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text style={styles.countryRowFlag}>{item.flag}</Text>
                    <Text
                      style={[
                        styles.countryRowName,
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
                    styles.emptyText,
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flexGrow: 1,
    paddingHorizontal: 28,
  },
  logoBox: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  headings: {
    alignItems: "center",
    gap: 8,
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  accountsList: {
    gap: 10,
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  accountMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    marginBottom: 2,
  },
  accountHandle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  accountRemove: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.06)",
  },
  newAccountBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    marginTop: 6,
  },
  newAccountText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  backToList: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 4,
    marginBottom: 12,
  },
  backToListText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  form: {
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    letterSpacing: 1,
  },
  input: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  countryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  countryFlag: {
    fontSize: 22,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  countryPlaceholder: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 4,
    marginTop: 4,
  },
  feedback: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  feedbackText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    lineHeight: 18,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 999,
  },
  ctaText: {
    color: "#1a1206",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  modalHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3a3543",
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: {
    flex: 1,
    fontSize: 19,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  countryRowFlag: {
    fontSize: 24,
  },
  countryRowName: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: 30,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
