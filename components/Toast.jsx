import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TYPE_STYLES = {
  success: {
    icon: "check-circle",
    accent: "#10b981",
    gradient: ["#10b981", "#059669"],
  },
  error: {
    icon: "alert-circle",
    accent: "#ef4444",
    gradient: ["#ef4444", "#b91c1c"],
  },
  info: {
    icon: "info",
    accent: "#3b82f6",
    gradient: ["#3b82f6", "#1d4ed8"],
  },
  warning: {
    icon: "alert-triangle",
    accent: "#f59e0b",
    gradient: ["#f59e0b", "#d97706"],
  },
};

export function Toast({ toast, onDismiss }) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    const dur = toast.duration ?? 2600;
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 240,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => onDismiss(toast.id));
    }, dur);
    return () => clearTimeout(t);
  }, [toast.id]);

  const cfg = TYPE_STYLES[toast.type] || TYPE_STYLES.info;
  const top = (Platform.OS === "web" ? Math.max(insets.top, 14) : insets.top) + 10;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          top,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Pressable onPress={() => onDismiss(toast.id)} style={styles.card}>
        <LinearGradient
          colors={cfg.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconWrap}
        >
          <Feather name={cfg.icon} size={18} color="#fff" />
        </LinearGradient>
        <View style={styles.textBlock}>
          {toast.title ? <Text style={styles.title}>{toast.title}</Text> : null}
          <Text style={styles.message} numberOfLines={3}>
            {toast.message}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 14,
    right: 14,
    zIndex: 9999,
    alignItems: "center",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(22, 19, 31, 0.97)",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    minWidth: 240,
    maxWidth: 480,
    width: "100%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 18,
      },
      android: { elevation: 12 },
      web: { boxShadow: "0 12px 32px rgba(0,0,0,0.45)" },
    }),
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    flex: 1,
    gap: 1,
  },
  title: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  message: {
    color: "rgba(245,245,247,0.85)",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    lineHeight: 17,
  },
});
