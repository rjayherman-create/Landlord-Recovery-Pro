import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useCases, type CaseState } from "@/context/CasesContext";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Step = 1 | 2 | 3;

const STATE_LABELS: Record<CaseState, string> = {
  NY: "New York",
  NJ: "New Jersey",
  TX: "Texas",
  FL: "Florida",
};

const STATE_FORM_LABELS: Record<CaseState, string> = {
  NY: "RP-524 (Complaint on Assessment)",
  NJ: "A-1 (County Board of Taxation)",
  TX: "Notice of Protest (CAD/ARB)",
  FL: "DR-486 (Value Adjustment Board)",
};

const STATE_DEADLINES: Record<CaseState, string> = {
  NY: "4th Tuesday in May (Grievance Day)",
  NJ: "April 1 (or 45 days after mailing)",
  TX: "May 15 or 30 days after notice",
  FL: "September 18 (approx.)",
};

function StepIndicator({ current, total }: { current: Step; total: number }) {
  const colors = useColors();
  return (
    <View style={stepStyles.row}>
      {Array.from({ length: total }, (_, i) => i + 1).map((step) => (
        <React.Fragment key={step}>
          <View
            style={[
              stepStyles.dot,
              {
                backgroundColor:
                  step <= current ? colors.accent : colors.muted,
                borderColor: step === current ? colors.accent : "transparent",
              },
            ]}
          >
            {step < current ? (
              <Feather name="check" size={10} color={colors.accentForeground} />
            ) : (
              <Text style={[stepStyles.dotNum, { color: step === current ? colors.accentForeground : colors.mutedForeground }]}>
                {step}
              </Text>
            )}
          </View>
          {step < total && (
            <View
              style={[
                stepStyles.line,
                { backgroundColor: step < current ? colors.accent : colors.muted },
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  dotNum: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  line: { flex: 1, height: 2, marginHorizontal: 4 },
});

export default function NewCaseScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addCase } = useCases();

  const paddingTop = Platform.OS === "web" ? 67 : insets.top;
  const paddingBottom = Platform.OS === "web" ? 34 : insets.bottom + 90;

  const [step, setStep] = useState<Step>(1);
  const [selectedState, setSelectedState] = useState<CaseState>("NY");
  const [form, setForm] = useState({
    propertyAddress: "",
    county: "",
    municipality: "",
    parcelId: "",
    ownerName: "",
    currentAssessment: "",
    estimatedMarketValue: "",
    requestedAssessment: "",
    taxYear: String(new Date().getFullYear()),
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function validateStep1() {
    return true;
  }

  function validateStep2() {
    const errs: Record<string, string> = {};
    if (!form.propertyAddress.trim()) errs.propertyAddress = "Required";
    if (!form.county.trim()) errs.county = "Required";
    if (!form.ownerName.trim()) errs.ownerName = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep3() {
    const errs: Record<string, string> = {};
    if (!form.currentAssessment || isNaN(Number(form.currentAssessment.replace(/,/g, ""))))
      errs.currentAssessment = "Enter a valid amount";
    if (!form.estimatedMarketValue || isNaN(Number(form.estimatedMarketValue.replace(/,/g, ""))))
      errs.estimatedMarketValue = "Enter a valid amount";
    if (!form.requestedAssessment || isNaN(Number(form.requestedAssessment.replace(/,/g, ""))))
      errs.requestedAssessment = "Enter a valid amount";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function goNext() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((prev) => Math.min(3, prev + 1) as Step);
  }

  function goBack() {
    setStep((prev) => Math.max(1, prev - 1) as Step);
  }

  function computeScore(overassessedPct: number): number {
    if (overassessedPct >= 30) return 85;
    if (overassessedPct >= 20) return 74;
    if (overassessedPct >= 10) return 60;
    if (overassessedPct >= 5) return 44;
    if (overassessedPct >= 0) return 24;
    return 8;
  }

  async function handleSubmit() {
    if (!validateStep3()) return;
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const cur = Number(form.currentAssessment.replace(/,/g, ""));
    const mkt = Number(form.estimatedMarketValue.replace(/,/g, ""));
    const req = Number(form.requestedAssessment.replace(/,/g, ""));
    const overPct = mkt > 0 ? ((cur - mkt) / mkt) * 100 : 0;

    const newCase = addCase({
      state: selectedState,
      propertyAddress: form.propertyAddress,
      county: form.county,
      municipality: form.municipality,
      parcelId: form.parcelId,
      ownerName: form.ownerName,
      currentAssessment: cur,
      estimatedMarketValue: mkt,
      requestedAssessment: req,
      taxYear: Number(form.taxYear) || new Date().getFullYear(),
      approvalScore: computeScore(overPct),
      notes: form.notes,
    });

    setIsSubmitting(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({ pathname: "/case/[id]", params: { id: newCase.id } });
  }

  const states = (Object.keys(STATE_LABELS) as CaseState[]);

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
        <Text style={[styles.title, { color: colors.foreground }]}>New Appeal</Text>
        <StepIndicator current={step} total={3} />

        {step === 1 && (
          <Card style={styles.card} elevated>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Select State</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              Choose the state where your property is located
            </Text>
            <View style={styles.stateGrid}>
              {states.map((s) => {
                const isSelected = selectedState === s;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setSelectedState(s)}
                    activeOpacity={0.8}
                    style={[
                      styles.stateOption,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.secondary,
                        borderRadius: colors.radius,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stateCode,
                        { color: isSelected ? colors.accent : colors.foreground },
                      ]}
                    >
                      {s}
                    </Text>
                    <Text
                      style={[
                        styles.stateName,
                        { color: isSelected ? colors.primaryForeground + "cc" : colors.mutedForeground },
                      ]}
                    >
                      {STATE_LABELS[s]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedState && (
              <View style={[styles.infoBox, { backgroundColor: colors.accent + "12" }]}>
                <Text style={[styles.infoBoxTitle, { color: colors.accent }]}>
                  {STATE_FORM_LABELS[selectedState]}
                </Text>
                <Text style={[styles.infoBoxSub, { color: colors.mutedForeground }]}>
                  Filing deadline: {STATE_DEADLINES[selectedState]}
                </Text>
              </View>
            )}

            <Button label="Continue" onPress={goNext} fullWidth style={{ marginTop: 8 }} />
          </Card>
        )}

        {step === 2 && (
          <Card style={styles.card} elevated>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Property Details</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              Enter information about the property you're appealing
            </Text>
            <View style={styles.fieldGroup}>
              <Input
                label="Property Address *"
                placeholder="123 Main St, Springfield"
                value={form.propertyAddress}
                onChangeText={(v) => setField("propertyAddress", v)}
                error={errors.propertyAddress}
                testID="address-input"
              />
              <Input
                label="County *"
                placeholder="e.g. Nassau"
                value={form.county}
                onChangeText={(v) => setField("county", v)}
                error={errors.county}
              />
              <Input
                label="Municipality / Town"
                placeholder="e.g. Hempstead"
                value={form.municipality}
                onChangeText={(v) => setField("municipality", v)}
              />
              <Input
                label="Parcel ID / SBL"
                placeholder="e.g. 01-234-56-789"
                value={form.parcelId}
                onChangeText={(v) => setField("parcelId", v)}
              />
              <Input
                label="Owner Name *"
                placeholder="Full name as on deed"
                value={form.ownerName}
                onChangeText={(v) => setField("ownerName", v)}
                error={errors.ownerName}
              />
            </View>
            <View style={styles.btnRow}>
              <Button label="Back" onPress={goBack} variant="outline" style={{ flex: 1 }} />
              <Button label="Continue" onPress={goNext} style={{ flex: 2 }} />
            </View>
          </Card>
        )}

        {step === 3 && (
          <Card style={styles.card} elevated>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Assessment Values</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              Enter the assessment values from your tax bill
            </Text>
            <View style={styles.fieldGroup}>
              <Input
                label="Current Assessed Value ($) *"
                placeholder="e.g. 320,000"
                value={form.currentAssessment}
                onChangeText={(v) => setField("currentAssessment", v)}
                keyboardType="numeric"
                error={errors.currentAssessment}
                testID="current-assessment-input"
              />
              <Input
                label="Estimated Market Value ($) *"
                placeholder="e.g. 280,000"
                value={form.estimatedMarketValue}
                onChangeText={(v) => setField("estimatedMarketValue", v)}
                keyboardType="numeric"
                error={errors.estimatedMarketValue}
              />
              <Input
                label="Requested Assessment ($) *"
                placeholder="e.g. 280,000"
                value={form.requestedAssessment}
                onChangeText={(v) => setField("requestedAssessment", v)}
                keyboardType="numeric"
                error={errors.requestedAssessment}
              />
              <Input
                label="Tax Year"
                placeholder={String(new Date().getFullYear())}
                value={form.taxYear}
                onChangeText={(v) => setField("taxYear", v)}
                keyboardType="numeric"
              />
              <Input
                label="Notes (optional)"
                placeholder="Additional info or observations..."
                value={form.notes}
                onChangeText={(v) => setField("notes", v)}
                multiline
                numberOfLines={3}
                style={{ height: 80 }}
              />
            </View>
            <View style={styles.btnRow}>
              <Button label="Back" onPress={goBack} variant="outline" style={{ flex: 1 }} />
              <Button
                label="Create Case"
                onPress={handleSubmit}
                loading={isSubmitting}
                variant="accent"
                style={{ flex: 2 }}
                testID="create-case-btn"
              />
            </View>
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, marginBottom: 16 },
  card: { padding: 20, gap: 16 },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  cardSub: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, marginTop: -8 },
  stateGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  stateOption: {
    width: "46%",
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    gap: 4,
  },
  stateCode: { fontFamily: "Inter_700Bold", fontSize: 22 },
  stateName: { fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center" },
  infoBox: { padding: 14, borderRadius: 8, gap: 4 },
  infoBoxTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  infoBoxSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  fieldGroup: { gap: 14 },
  btnRow: { flexDirection: "row", gap: 10 },
});
