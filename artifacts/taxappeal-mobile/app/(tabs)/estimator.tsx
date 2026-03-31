import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ScoreGauge } from "@/components/ScoreGauge";

type State = "NY" | "NJ" | "TX" | "FL";

interface EstimatorResult {
  estimatedMarketValue: number;
  currentAssessment: number;
  equityRatio: number;
  overassessedBy: number;
  potentialSavings: number;
  approvalScore: number;
}

const STATE_TAX_RATES: Record<State, number> = {
  NY: 0.0182,
  NJ: 0.0218,
  TX: 0.0178,
  FL: 0.0098,
};

function computeScore(overassessedPct: number, hasComps: boolean): number {
  let score = 0;
  if (overassessedPct >= 30) score = 85;
  else if (overassessedPct >= 20) score = 74;
  else if (overassessedPct >= 10) score = 60;
  else if (overassessedPct >= 5) score = 44;
  else if (overassessedPct >= 0) score = 24;
  else score = 8;
  if (hasComps) score = Math.min(100, score + 15);
  return score;
}

export default function EstimatorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === "web" ? 67 : insets.top;
  const paddingBottom = Platform.OS === "web" ? 34 : insets.bottom + 90;

  const [selectedState, setSelectedState] = useState<State>("NY");
  const [currentAssessment, setCurrentAssessment] = useState("");
  const [marketValue, setMarketValue] = useState("");
  const [result, setResult] = useState<EstimatorResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const states: State[] = ["NY", "NJ", "TX", "FL"];

  function validate() {
    const errs: Record<string, string> = {};
    if (!currentAssessment || isNaN(Number(currentAssessment.replace(/,/g, ""))))
      errs.currentAssessment = "Enter a valid assessment amount";
    if (!marketValue || isNaN(Number(marketValue.replace(/,/g, ""))))
      errs.marketValue = "Enter a valid market value";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function calculate() {
    if (!validate()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const assessment = Number(currentAssessment.replace(/,/g, ""));
    const market = Number(marketValue.replace(/,/g, ""));
    const equityRatio = market > 0 ? assessment / market : 0;
    const overassessedBy = Math.max(0, assessment - market);
    const overassessedPct = market > 0 ? ((assessment - market) / market) * 100 : 0;
    const taxRate = STATE_TAX_RATES[selectedState];
    const potentialSavings = overassessedBy * taxRate;
    const score = computeScore(overassessedPct, false);

    setResult({
      estimatedMarketValue: market,
      currentAssessment: assessment,
      equityRatio,
      overassessedBy,
      potentialSavings,
      approvalScore: score,
    });
  }

  function reset() {
    setResult(null);
    setCurrentAssessment("");
    setMarketValue("");
    setErrors({});
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingTop: paddingTop + 20, paddingBottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Savings Estimator</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Enter your property details to estimate your potential savings
        </Text>

        <Card style={styles.formCard} elevated>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>Select State</Text>
          <View style={styles.stateRow}>
            {states.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setSelectedState(s)}
                activeOpacity={0.8}
                style={[
                  styles.stateBtn,
                  {
                    backgroundColor:
                      selectedState === s ? colors.primary : colors.secondary,
                    borderRadius: colors.radius - 4,
                    flex: 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stateBtnText,
                    {
                      color:
                        selectedState === s
                          ? colors.primaryForeground
                          : colors.foreground,
                    },
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ gap: 16, marginTop: 16 }}>
            <Input
              label="Current Assessed Value ($)"
              placeholder="e.g. 320,000"
              value={currentAssessment}
              onChangeText={setCurrentAssessment}
              keyboardType="numeric"
              error={errors.currentAssessment}
              testID="assessment-input"
            />
            <Input
              label="Estimated Market Value ($)"
              placeholder="e.g. 280,000"
              value={marketValue}
              onChangeText={setMarketValue}
              keyboardType="numeric"
              error={errors.marketValue}
              testID="market-value-input"
            />
          </View>

          <Button
            label="Calculate Savings"
            onPress={calculate}
            variant="primary"
            fullWidth
            style={{ marginTop: 20 }}
            testID="calculate-btn"
          />
        </Card>

        {result && (
          <Card style={styles.resultCard} elevated>
            <View style={styles.resultHeader}>
              <Text style={[styles.resultTitle, { color: colors.foreground }]}>
                Your Results
              </Text>
              <TouchableOpacity onPress={reset} activeOpacity={0.7}>
                <Feather name="refresh-ccw" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <ScoreGauge score={result.approvalScore} />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.statGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  Over-assessed by
                </Text>
                <Text style={[styles.statValue, { color: colors.destructive }]}>
                  ${Math.round(result.overassessedBy).toLocaleString()}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  Equity ratio
                </Text>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {(result.equityRatio * 100).toFixed(1)}%
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  Potential savings
                </Text>
                <Text style={[styles.statValue, { color: colors.success }]}>
                  ${Math.round(result.potentialSavings).toLocaleString()}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  Tax rate ({selectedState})
                </Text>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {(STATE_TAX_RATES[selectedState] * 100).toFixed(2)}%
                </Text>
              </View>
            </View>

            {result.approvalScore >= 60 && (
              <View style={[styles.cta, { backgroundColor: colors.accent + "18" }]}>
                <Feather name="check-circle" size={16} color={colors.accent} />
                <Text style={[styles.ctaText, { color: colors.accent }]}>
                  You have a strong case. Consider filing an appeal.
                </Text>
              </View>
            )}
          </Card>
        )}

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Feather name="info" size={16} color={colors.mutedForeground} />
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              Estimates are based on average tax rates. Actual savings depend on your county's equalization rate and comparable sales.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, marginBottom: 4 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, marginBottom: 4 },
  formCard: { padding: 20 },
  formTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, marginBottom: 12 },
  stateRow: { flexDirection: "row", gap: 8 },
  stateBtn: { paddingVertical: 10, alignItems: "center" },
  stateBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  resultCard: { padding: 20, gap: 16 },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  resultTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  divider: { height: 1 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  statItem: { width: "45%", gap: 4 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 12 },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 20 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    padding: 12,
  },
  ctaText: { fontFamily: "Inter_500Medium", fontSize: 13, flex: 1 },
  infoCard: { padding: 14 },
  infoRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  infoText: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1, lineHeight: 18 },
});
