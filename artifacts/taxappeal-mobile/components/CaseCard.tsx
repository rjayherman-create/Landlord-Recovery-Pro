import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Case } from "@/context/CasesContext";

function statusVariant(status: Case["status"]) {
  switch (status) {
    case "submitted": return "success";
    case "approved": return "accent";
    case "denied": return "destructive";
    case "hearing_scheduled": return "warning";
    default: return "muted";
  }
}

function statusLabel(status: Case["status"]) {
  switch (status) {
    case "draft": return "Draft";
    case "submitted": return "Submitted";
    case "hearing_scheduled": return "Hearing Scheduled";
    case "approved": return "Approved";
    case "denied": return "Denied";
    default: return status;
  }
}

function stateLabel(state: Case["state"]) {
  const map: Record<string, string> = { NY: "New York", NJ: "New Jersey", TX: "Texas", FL: "Florida" };
  return map[state] ?? state;
}

interface CaseCardProps {
  item: Case;
  onPress: () => void;
}

export function CaseCard({ item, onPress }: CaseCardProps) {
  const colors = useColors();
  const savings = item.requestedAssessment > 0
    ? Math.max(0, (item.currentAssessment - item.requestedAssessment) * 0.015)
    : null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} testID="case-card">
      <Card style={styles.card} elevated>
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + "12" }]}>
              <Feather name="home" size={20} color={colors.primary} />
            </View>
          </View>
          <View style={styles.info}>
            <Text style={[styles.address, { color: colors.foreground }]} numberOfLines={1}>
              {item.propertyAddress}
            </Text>
            <Text style={[styles.county, { color: colors.mutedForeground }]} numberOfLines={1}>
              {item.county} County · {stateLabel(item.state)}
            </Text>
            <View style={styles.badges}>
              <Badge label={statusLabel(item.status)} variant={statusVariant(item.status)} />
              {savings && savings > 0 && (
                <Badge label={`~$${Math.round(savings).toLocaleString()} saved`} variant="accent" />
              )}
            </View>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: {},
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, gap: 4 },
  address: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  county: { fontFamily: "Inter_400Regular", fontSize: 13 },
  badges: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 4 },
});
