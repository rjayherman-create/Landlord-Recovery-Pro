import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useCases } from "@/context/CasesContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface SettingsRowProps {
  icon: string;
  label: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  badge?: string;
}

function SettingsRow({ icon, label, subtitle, value, onPress, showChevron = true, badge }: SettingsRowProps) {
  const colors = useColors();
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper onPress={onPress} activeOpacity={0.7} style={styles.rowWrap}>
      <View style={[styles.rowIcon, { backgroundColor: colors.muted }]}>
        <Feather name={icon as any} size={16} color={colors.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
        {subtitle && (
          <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{subtitle}</Text>
        )}
      </View>
      <View style={styles.rowRight}>
        {badge && <Badge label={badge} variant="accent" />}
        {value && (
          <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text>
        )}
        {showChevron && onPress && (
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        )}
      </View>
    </Wrapper>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cases } = useCases();

  const paddingTop = Platform.OS === "web" ? 67 : insets.top;
  const paddingBottom = Platform.OS === "web" ? 34 : insets.bottom + 90;

  const approvedCases = cases.filter((c) => c.status === "approved").length;
  const totalSavings = cases.reduce((sum, c) => {
    return sum + Math.max(0, (c.currentAssessment - c.requestedAssessment) * 0.015);
  }, 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: paddingTop + 20, paddingBottom }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>

      <Card style={[styles.profileCard, { backgroundColor: colors.primary }]} elevated>
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { backgroundColor: colors.accent + "30" }]}>
            <Feather name="user" size={24} color={colors.accent} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.primaryForeground }]}>
              Homeowner
            </Text>
            <Text style={[styles.profilePlan, { color: colors.primaryForeground + "88" }]}>
              Free Plan
            </Text>
          </View>
          <Badge label="Upgrade" variant="accent" />
        </View>
        <View style={[styles.profileStats, { borderTopColor: colors.primaryForeground + "22" }]}>
          <View style={styles.profileStat}>
            <Text style={[styles.profileStatNum, { color: colors.accent }]}>{cases.length}</Text>
            <Text style={[styles.profileStatLabel, { color: colors.primaryForeground + "88" }]}>
              Cases
            </Text>
          </View>
          <View style={[styles.profileStatDivider, { backgroundColor: colors.primaryForeground + "22" }]} />
          <View style={styles.profileStat}>
            <Text style={[styles.profileStatNum, { color: colors.accent }]}>{approvedCases}</Text>
            <Text style={[styles.profileStatLabel, { color: colors.primaryForeground + "88" }]}>
              Won
            </Text>
          </View>
          <View style={[styles.profileStatDivider, { backgroundColor: colors.primaryForeground + "22" }]} />
          <View style={styles.profileStat}>
            <Text style={[styles.profileStatNum, { color: colors.accent }]}>
              ${Math.round(totalSavings / 1000)}k
            </Text>
            <Text style={[styles.profileStatLabel, { color: colors.primaryForeground + "88" }]}>
              Saved
            </Text>
          </View>
        </View>
      </Card>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SUBSCRIPTION</Text>
      <Card style={styles.section}>
        <SettingsRow
          icon="star"
          label="Upgrade to Basic"
          subtitle="$99.99 · Unlimited appeals + PDF forms"
          onPress={() => {}}
          badge="$99"
        />
      </Card>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>STATES SUPPORTED</Text>
      <Card style={styles.section}>
        {(["NY", "NJ", "TX", "FL"] as const).map((s, i, arr) => (
          <React.Fragment key={s}>
            <SettingsRow
              icon="map-pin"
              label={s === "NY" ? "New York" : s === "NJ" ? "New Jersey" : s === "TX" ? "Texas" : "Florida"}
              subtitle={s === "NY" ? "RP-524" : s === "NJ" ? "A-1" : s === "TX" ? "Notice of Protest" : "DR-486"}
              showChevron={false}
            />
            {i < arr.length - 1 && (
              <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
            )}
          </React.Fragment>
        ))}
      </Card>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SUPPORT</Text>
      <Card style={styles.section}>
        <SettingsRow
          icon="help-circle"
          label="Help & FAQ"
          onPress={() => Linking.openURL("https://taxappealdiy.com/help")}
        />
        <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
        <SettingsRow
          icon="mail"
          label="Contact Support"
          onPress={() => Linking.openURL("mailto:support@taxappealdiy.com")}
        />
        <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
        <SettingsRow
          icon="shield"
          label="Privacy Policy"
          onPress={() => Linking.openURL("https://taxappealdiy.com/privacy")}
        />
      </Card>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>
        TaxAppeal DIY v1.0.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 8 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, marginBottom: 16 },
  profileCard: { padding: 20, marginBottom: 8 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: { flex: 1 },
  profileName: { fontFamily: "Inter_700Bold", fontSize: 18 },
  profilePlan: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  profileStats: {
    flexDirection: "row",
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 16,
  },
  profileStat: { flex: 1, alignItems: "center" },
  profileStatNum: { fontFamily: "Inter_700Bold", fontSize: 22 },
  profileStatLabel: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  profileStatDivider: { width: 1 },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 6,
    marginLeft: 4,
  },
  section: { overflow: "hidden" },
  rowWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: { flex: 1 },
  rowLabel: { fontFamily: "Inter_500Medium", fontSize: 15 },
  rowSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowValue: { fontFamily: "Inter_400Regular", fontSize: 14 },
  rowDivider: { height: 1, marginLeft: 62 },
  version: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
});
