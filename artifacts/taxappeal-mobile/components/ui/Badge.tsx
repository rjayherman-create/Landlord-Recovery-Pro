import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

type BadgeVariant = "default" | "success" | "warning" | "destructive" | "accent" | "muted";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = "default" }: BadgeProps) {
  const colors = useColors();

  const variantMap: Record<BadgeVariant, { bg: string; text: string }> = {
    default: { bg: colors.secondary, text: colors.foreground },
    success: { bg: "#dcfce7", text: "#166534" },
    warning: { bg: "#fef9c3", text: "#854d0e" },
    destructive: { bg: "#fee2e2", text: "#991b1b" },
    accent: { bg: colors.accent + "22", text: colors.accent },
    muted: { bg: colors.muted, text: colors.mutedForeground },
  };

  const vs = variantMap[variant];

  return (
    <View style={[styles.badge, { backgroundColor: vs.bg, borderRadius: 99 }]}>
      <Text style={[styles.text, { color: vs.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  text: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
