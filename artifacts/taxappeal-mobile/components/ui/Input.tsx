import React from "react";
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, style, ...rest }: InputProps) {
  const colors = useColors();
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      )}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.destructive : colors.border,
            borderRadius: colors.radius - 2,
            color: colors.foreground,
          },
          style,
        ]}
        placeholderTextColor={colors.mutedForeground}
        {...rest}
      />
      {error && (
        <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    height: 48,
  },
  error: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
});
