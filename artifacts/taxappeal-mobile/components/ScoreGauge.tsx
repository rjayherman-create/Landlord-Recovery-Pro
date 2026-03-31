import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

interface ScoreGaugeProps {
  score: number;
  label?: string;
}

function getScoreColor(score: number, colors: ReturnType<typeof useColors>) {
  if (score >= 75) return colors.success;
  if (score >= 50) return colors.accent;
  if (score >= 25) return colors.warning;
  return colors.destructive;
}

function getScoreLabel(score: number) {
  if (score >= 75) return "Strong";
  if (score >= 50) return "Moderate";
  if (score >= 25) return "Fair";
  return "Weak";
}

export function ScoreGauge({ score, label }: ScoreGaugeProps) {
  const colors = useColors();
  const scoreColor = getScoreColor(score, colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          {label ?? "Approval Likelihood"}
        </Text>
        <Text style={[styles.strength, { color: scoreColor }]}>{getScoreLabel(score)}</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.muted }]}>
        <View
          style={[
            styles.fill,
            { width: `${Math.min(100, Math.max(0, score))}%` as unknown as number, backgroundColor: scoreColor },
          ]}
        />
      </View>
      <Text style={[styles.scoreText, { color: scoreColor }]}>{score}/100</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontFamily: "Inter_500Medium", fontSize: 13 },
  strength: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  track: { height: 8, borderRadius: 99, overflow: "hidden" },
  fill: { height: 8, borderRadius: 99 },
  scoreText: { fontFamily: "Inter_700Bold", fontSize: 28, textAlign: "center" },
});
