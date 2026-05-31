import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";

function CenterTabButton({ children, onPress }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={(e) => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
            () => {}
          );
        }
        onPress?.(e);
      }}
      style={({ pressed }) => [
        styles.centerWrap,
        { transform: [{ scale: pressed ? 0.92 : 1 }] },
      ]}
    >
      <View
        style={[
          styles.centerButton,
          {
            backgroundColor: colors.primary,
            ...(Platform.OS === "web"
              ? { boxShadow: `0 6px 12px ${colors.primary}66` }
              : { shadowColor: colors.primary }),
          },
        ]}
      >
        {children}
      </View>
    </Pressable>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: isWeb ? 84 : 78,
          paddingTop: 8,
          paddingBottom: isWeb ? 28 : 20,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          tabBarIcon: ({ color }) => (
            <Feather name="compass" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          tabBarIcon: () => <Feather name="plus" size={28} color="#fff" />,
          tabBarButton: (props) => (
            <CenterTabButton onPress={props.onPress}>
              <Feather name="plus" size={28} color="#fff" />
            </CenterTabButton>
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          tabBarIcon: ({ color }) => (
            <Feather name="users" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -22,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
});
