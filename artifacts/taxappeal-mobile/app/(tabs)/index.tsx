import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useCases } from "@/context/CasesContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

function SavingsCard({ cases }: { cases: ReturnType<typeof useCases>["cases"] }) {
  const colors = useColors();
  const totalSavings = cases.reduce((sum, c) => {
    if (c.currentAssessment && c.requestedAssessment) {
      return sum + Math.max(0, (c.currentAssessment - c.requestedAssessment) * 0.015);
    }
    return sum;
  }, 0);
  const approvedCount = cases.filter((c) => c.status === "approved").length;
  const pendingCount = cases.filter(
    (c) => c.status === "submitted" || c.status === "hearing_scheduled"
  ).length;

  return (
    <Card style={[styles.savingsCard, { backgroundColor: colors.primary }]} elevated>
      <Text style={[styles.savingsLabel, { color: colors.primaryForeground + "aa" }]}>
        Estimated Total Savings
      </Text>
      <Text style={[styles.savingsAmount, { color: colors.accent }]}>
        ${Math.round(totalSavings).toLocaleString()}
      </Text>
      <View style={styles.savingsRow}>
        <View style={styles.savingsStat}>
          <Text style={[styles.savingsStatNum, { color: colors.primaryForeground }]}>
            {approvedCount}
          </Text>
          <Text style={[styles.savingsStatLabel, { color: colors.primaryForeground + "99" }]}>
            Approved
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.primaryForeground + "22" }]} />
        <View style={styles.savingsStat}>
          <Text style={[styles.savingsStatNum, { color: colors.primaryForeground }]}>
            {pendingCount}
          </Text>
          <Text style={[styles.savingsStatLabel, { color: colors.primaryForeground + "99" }]}>
            Pending
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.primaryForeground + "22" }]} />
        <View style={styles.savingsStat}>
          <Text style={[styles.savingsStatNum, { color: colors.primaryForeground }]}>
            {cases.length}
          </Text>
          <Text style={[styles.savingsStatLabel, { color: colors.primaryForeground + "99" }]}>
            Total
          </Text>
        </View>
      </View>
    </Card>
  );
}

interface QuickActionProps {
  icon: string;
  label: string;
  sublabel: string;
  onPress: () => void;
  accentColor?: string;
}

function QuickAction({ icon, label, sublabel, onPress, accentColor }: QuickActionProps) {
  const colors = useColors();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ flex: 1 }}>
      <Card style={styles.quickCard} elevated>
        <View
          style={[
            styles.quickIcon,
            { backgroundColor: (accentColor ?? colors.accent) + "18" },
          ]}
        >
          <Feather name={icon as any} size={22} color={accentColor ?? colors.accent} />
        </View>
        <Text style={[styles.quickLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.quickSublabel, { color: colors.mutedForeground }]}>{sublabel}</Text>
      </Card>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cases } = useCases();

  const paddingTop = Platform.OS === "web" ? 67 : insets.top;
  const paddingBottom = Platform.OS === "web" ? 34 : insets.bottom + 90;

  const recentCases = cases.slice(0, 3);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: paddingTop + 20, paddingBottom }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Welcome back</Text>
          <Text style={[styles.appName, { color: colors.foreground }]}>TaxAppeal DIY</Text>
        </View>
        <View style={[styles.logoBadge, { backgroundColor: colors.primary }]}>
          <Feather name="shield" size={20} color={colors.accent} />
        </View>
      </View>

      <SavingsCard cases={cases} />

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
      <View style={styles.quickRow}>
        <QuickAction
          icon="plus-circle"
          label="New Appeal"
          sublabel="Start filing"
          onPress={() => router.push("/(tabs)/new-case")}
          accentColor={colors.accent}
        />
        <QuickAction
          icon="trending-down"
          label="Estimator"
          sublabel="Check savings"
          onPress={() => router.push("/(tabs)/estimator")}
          accentColor={colors.primary}
        />
      </View>

      {recentCases.length > 0 && (
        <>
          <View style={styles.recentHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>
              Recent Cases
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/cases")} activeOpacity={0.7}>
              <Text style={[styles.viewAll, { color: colors.accent }]}>View all</Text>
            </TouchableOpacity>
          </View>
          {recentCases.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => router.push({ pathname: "/case/[id]", params: { id: c.id } })}
              activeOpacity={0.8}
            >
              <Card style={styles.recentCard} elevated>
                <View style={styles.recentRow}>
                  <View style={styles.recentInfo}>
                    <Text style={[styles.recentAddress, { color: colors.foreground }]} numberOfLines={1}>
                      {c.propertyAddress}
                    </Text>
                    <Text style={[styles.recentCounty, { color: colors.mutedForeground }]}>
                      {c.county} · {c.state}
                    </Text>
                  </View>
                  <Badge
                    label={c.status.replace("_", " ")}
                    variant={
                      c.status === "approved"
                        ? "accent"
                        : c.status === "submitted"
                        ? "success"
                        : "muted"
                    }
                  />
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </>
      )}

      <Card style={styles.tipCard}>
        <View style={styles.tipRow}>
          <Feather name="info" size={18} color={colors.accent} />
          <Text style={[styles.tipTitle, { color: colors.foreground }]}>Filing Tip</Text>
        </View>
        <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
          In NY, Grievance Day is the 4th Tuesday in May for most municipalities. File RP-524 before that date.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 4 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greeting: { fontFamily: "Inter_400Regular", fontSize: 13 },
  appName: { fontFamily: "Inter_700Bold", fontSize: 24 },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  savingsCard: { padding: 20, marginBottom: 24 },
  savingsLabel: { fontFamily: "Inter_500Medium", fontSize: 13, marginBottom: 6 },
  savingsAmount: { fontFamily: "Inter_700Bold", fontSize: 40, marginBottom: 16 },
  savingsRow: { flexDirection: "row", alignItems: "center" },
  savingsStat: { flex: 1, alignItems: "center" },
  savingsStatNum: { fontFamily: "Inter_700Bold", fontSize: 20 },
  savingsStatLabel: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  divider: { width: 1, height: 32 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 12, marginTop: 8 },
  quickRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  quickCard: { padding: 16, gap: 8 },
  quickIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  quickSublabel: { fontFamily: "Inter_400Regular", fontSize: 12 },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  viewAll: { fontFamily: "Inter_500Medium", fontSize: 14 },
  recentCard: { padding: 14, marginBottom: 10 },
  recentRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  recentInfo: { flex: 1, marginRight: 10 },
  recentAddress: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  recentCounty: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  tipCard: { padding: 16, marginTop: 12, gap: 8 },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tipTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  tipText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
});
