import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useCases, type Case, type CaseStatus } from "@/context/CasesContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ScoreGauge } from "@/components/ScoreGauge";

function statusVariant(status: CaseStatus) {
  switch (status) {
    case "submitted": return "success";
    case "approved": return "accent";
    case "denied": return "destructive";
    case "hearing_scheduled": return "warning";
    default: return "muted";
  }
}

const NEXT_STATUS: Partial<Record<CaseStatus, CaseStatus>> = {
  draft: "submitted",
  submitted: "hearing_scheduled",
  hearing_scheduled: "approved",
};

const NEXT_STATUS_LABEL: Partial<Record<CaseStatus, string>> = {
  draft: "Mark as Submitted",
  submitted: "Schedule Hearing",
  hearing_scheduled: "Mark Approved",
};

const STATE_FORM_LABELS: Record<string, string> = {
  NY: "RP-524",
  NJ: "A-1",
  TX: "Notice of Protest",
  FL: "DR-486",
};

function InfoRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={infoStyles.row}>
      <Text style={[infoStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[infoStyles.value, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  label: { fontFamily: "Inter_400Regular", fontSize: 14 },
  value: { fontFamily: "Inter_500Medium", fontSize: 14, maxWidth: "55%", textAlign: "right" },
});

export default function CaseDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cases, updateCase, deleteCase } = useCases();

  const paddingTop = Platform.OS === "web" ? 67 : insets.top;
  const paddingBottom = Platform.OS === "web" ? 34 : insets.bottom + 20;

  const item = cases.find((c) => c.id === id);

  if (!item) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.foreground }]}>Case not found</Text>
        <Button label="Go Back" onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  const potentialSavings = Math.max(
    0,
    (item.currentAssessment - item.requestedAssessment) * 0.015
  );

  const nextStatus = NEXT_STATUS[item.status];
  const nextLabel = NEXT_STATUS_LABEL[item.status];

  function handleAdvanceStatus() {
    if (!nextStatus) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateCase(item.id, { status: nextStatus });
  }

  function handleDelete() {
    Alert.alert(
      "Delete Case",
      "Are you sure you want to delete this case? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteCase(item.id);
            router.back();
          },
        },
      ]
    );
  }

  const formLabel = STATE_FORM_LABELS[item.state] ?? item.state;
  const overPct = item.estimatedMarketValue > 0
    ? ((item.currentAssessment - item.estimatedMarketValue) / item.estimatedMarketValue) * 100
    : 0;

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: paddingTop + 4, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.foreground }]} numberOfLines={1}>
          Case Detail
        </Text>
        <TouchableOpacity onPress={handleDelete} activeOpacity={0.7} style={styles.backBtn}>
          <Feather name="trash-2" size={20} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={[styles.address, { color: colors.foreground }]} numberOfLines={2}>
            {item.propertyAddress}
          </Text>
          <View style={styles.badgeRow}>
            <Badge label={item.status.replace("_", " ")} variant={statusVariant(item.status)} />
            <Badge label={`${item.state} · ${formLabel}`} variant="muted" />
          </View>
        </View>

        <Card style={styles.savingsCard} elevated>
          <Text style={[styles.savingsLabel, { color: colors.mutedForeground }]}>
            Potential Annual Savings
          </Text>
          <Text style={[styles.savingsAmount, { color: colors.accent }]}>
            ${Math.round(potentialSavings).toLocaleString()}
          </Text>
        </Card>

        <Card style={styles.card} elevated>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Approval Likelihood</Text>
          <View style={{ marginTop: 8 }}>
            <ScoreGauge score={item.approvalScore} />
          </View>
          {overPct > 0 && (
            <Text style={[styles.overText, { color: colors.mutedForeground }]}>
              Property is over-assessed by {overPct.toFixed(1)}% vs. market value
            </Text>
          )}
        </Card>

        <Card style={styles.card} elevated>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Assessment Details</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <InfoRow label="Current Assessment" value={`$${item.currentAssessment.toLocaleString()}`} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <InfoRow label="Estimated Market Value" value={`$${item.estimatedMarketValue.toLocaleString()}`} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <InfoRow label="Requested Assessment" value={`$${item.requestedAssessment.toLocaleString()}`} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <InfoRow label="Tax Year" value={String(item.taxYear)} />
        </Card>

        <Card style={styles.card} elevated>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Property Info</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <InfoRow label="Owner" value={item.ownerName} />
          {item.county && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <InfoRow label="County" value={item.county} />
            </>
          )}
          {item.municipality && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <InfoRow label="Municipality" value={item.municipality} />
            </>
          )}
          {item.parcelId && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <InfoRow label="Parcel ID" value={item.parcelId} />
            </>
          )}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <InfoRow
            label="Filed"
            value={new Date(item.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          />
        </Card>

        {item.notes ? (
          <Card style={styles.card} elevated>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Notes</Text>
            <Text style={[styles.notes, { color: colors.mutedForeground }]}>{item.notes}</Text>
          </Card>
        ) : null}

        {nextLabel && nextStatus && (
          <Button
            label={nextLabel}
            onPress={handleAdvanceStatus}
            variant="primary"
            fullWidth
            style={{ marginTop: 8 }}
            testID="advance-status-btn"
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8 },
  topTitle: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 17, textAlign: "center" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  notFoundText: { fontFamily: "Inter_600SemiBold", fontSize: 18 },
  content: { padding: 20, gap: 16 },
  headerSection: { gap: 10 },
  address: { fontFamily: "Inter_700Bold", fontSize: 20, lineHeight: 28 },
  badgeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  savingsCard: { padding: 20 },
  savingsLabel: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 4 },
  savingsAmount: { fontFamily: "Inter_700Bold", fontSize: 36 },
  card: { padding: 16 },
  cardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, marginBottom: 4 },
  divider: { height: 1, marginVertical: 2 },
  overText: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 8 },
  notes: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, marginTop: 8 },
});
