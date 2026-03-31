import React from "react";
import { View, StyleSheet, Platform, type ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}

export function Card({ children, style, elevated = false }: CardProps) {
  const colors = useColors();

  const nativeShadow = Platform.OS !== "web"
    ? {
        shadowColor: colors.foreground,
        shadowOpacity: elevated ? 0.08 : 0.04,
        shadowRadius: elevated ? 12 : 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: elevated ? 4 : 1,
      }
    : {};

  const webShadow: ViewStyle = Platform.OS === "web"
    ? { boxShadow: elevated ? `0 2px 12px rgba(0,0,0,0.08)` : `0 1px 4px rgba(0,0,0,0.04)` } as ViewStyle
    : {};

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderColor: colors.border,
        },
        nativeShadow,
        webShadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: "hidden",
  },
});
