import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { useColors } from "@/hooks/useColors";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "accent";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  testID,
}: ButtonProps) {
  const colors = useColors();

  const variantStyles: Record<Variant, { bg: string; text: string; border?: string }> = {
    primary: { bg: colors.primary, text: colors.primaryForeground },
    secondary: { bg: colors.secondary, text: colors.secondaryForeground },
    outline: { bg: "transparent", text: colors.primary, border: colors.border },
    ghost: { bg: "transparent", text: colors.primary },
    destructive: { bg: colors.destructive, text: colors.destructiveForeground },
    accent: { bg: colors.accent, text: colors.accentForeground },
  };

  const sizeStyles: Record<Size, { paddingH: number; paddingV: number; fontSize: number; height: number }> = {
    sm: { paddingH: 16, paddingV: 8, fontSize: 13, height: 36 },
    md: { paddingH: 20, paddingV: 12, fontSize: 15, height: 48 },
    lg: { paddingH: 24, paddingV: 16, fontSize: 16, height: 56 },
  };

  const vs = variantStyles[variant];
  const ss = sizeStyles[size];

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.base,
        {
          backgroundColor: vs.bg,
          paddingHorizontal: ss.paddingH,
          paddingVertical: ss.paddingV,
          height: ss.height,
          borderRadius: colors.radius,
          borderWidth: vs.border ? 1 : 0,
          borderColor: vs.border ?? "transparent",
          opacity: disabled ? 0.5 : 1,
          alignSelf: fullWidth ? "stretch" : "auto",
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={vs.text} size="small" />
      ) : (
        <Text style={[styles.label, { color: vs.text, fontSize: ss.fontSize }]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.1,
  },
});
