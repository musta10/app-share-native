import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export function ConfirmDialog({ dialog, onClose }) {
  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const visible = !!dialog;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.92);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!dialog) return null;

  const {
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    destructive = false,
    icon,
    onConfirm,
  } = dialog;

  const handleConfirm = () => {
    onClose();
    if (onConfirm) onConfirm();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={[
            styles.card,
            { opacity, transform: [{ scale }] },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <Pressable onPress={(e) => e.stopPropagation && e.stopPropagation()}>
            {icon ? (
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: destructive
                      ? "rgba(239,68,68,0.15)"
                      : "rgba(255,186,0,0.15)",
                  },
                ]}
              >
                <Feather
                  name={icon}
                  size={24}
                  color={destructive ? "#ef4444" : "#FFBA00"}
                />
              </View>
            ) : null}
            <Text style={styles.title}>{title}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}

            <View style={styles.actions}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.btn,
                  styles.cancelBtn,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={styles.cancelText}>{cancelText}</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirm}
                style={({ pressed }) => [
                  styles.btn,
                  destructive ? styles.destructiveBtn : styles.confirmBtn,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text
                  style={
                    destructive ? styles.destructiveText : styles.confirmText
                  }
                >
                  {confirmText}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#1d1929",
    borderRadius: 24,
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 22,
    width: "100%",
    maxWidth: 380,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.5,
        shadowRadius: 28,
      },
      android: { elevation: 24 },
      web: { boxShadow: "0 20px 60px rgba(0,0,0,0.55)" },
    }),
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    color: "rgba(245,245,247,0.7)",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 22,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  cancelText: {
    color: "rgba(245,245,247,0.85)",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  confirmBtn: {
    backgroundColor: "#FFBA00",
  },
  confirmText: {
    color: "#1a1206",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  destructiveBtn: {
    backgroundColor: "#ef4444",
  },
  destructiveText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
});
