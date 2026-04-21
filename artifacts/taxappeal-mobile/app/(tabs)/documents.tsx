import React, { useState } from "react";
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
import type { ComponentProps } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

type StateFilter = "ALL" | "NY" | "NJ" | "TX" | "FL";

interface Document {
  id: string;
  state: Exclude<StateFilter, "ALL">;
  title: string;
  subtitle: string;
  description: string;
  url: string;
  icon: FeatherIconName;
}

const DOCUMENTS: Document[] = [
  {
    id: "rp524",
    state: "NY",
    title: "Form RP-524",
    subtitle: "Complaint on Real Property Assessment",
    description:
      "Required form to contest your property assessment with the Board of Assessment Review.",
    url: "https://www.tax.ny.gov/pdf/current_forms/orpts/rp524_fill_in.pdf",
    icon: "file-text",
  },
  {
    id: "rp524i",
    state: "NY",
    title: "RP-524 Instructions",
    subtitle: "How to complete Form RP-524",
    description:
      "Step-by-step instructions for completing and filing the RP-524 complaint form.",
    url: "https://www.tax.ny.gov/pdf/current_forms/orpts/rp524i.pdf",
    icon: "book-open",
  },
  {
    id: "nj-a1",
    state: "NJ",
    title: "Form A-1",
    subtitle: "Petition of Appeal",
    description:
      "Standard NJ Tax Court petition form to appeal your property assessment.",
    url: "https://www.njcourts.gov/forms/12012_a1.pdf",
    icon: "file-text",
  },
  {
    id: "tx-50-132",
    state: "TX",
    title: "Form 50-132",
    subtitle: "Notice of Protest",
    description:
      "File a formal protest with the Appraisal Review Board to contest your property value.",
    url: "https://comptroller.texas.gov/forms/50-132.pdf",
    icon: "file-text",
  },
  {
    id: "tx-50-164",
    state: "TX",
    title: "Form 50-164",
    subtitle: "Appraisal Review Board Taxpayer Rights",
    description:
      "Know your rights when protesting your property valuation in Texas.",
    url: "https://comptroller.texas.gov/forms/50-164.pdf",
    icon: "info",
  },
  {
    id: "fl-dr486",
    state: "FL",
    title: "Form DR-486",
    subtitle: "Petition to Value Adjustment Board",
    description:
      "Petition form to contest your property's assessed value or exemption denial in Florida.",
    url: "https://floridarevenue.com/property/Documents/dr486.pdf",
    icon: "file-text",
  },
];

const STATE_LABELS: Record<Exclude<StateFilter, "ALL">, string> = {
  NY: "New York",
  NJ: "New Jersey",
  TX: "Texas",
  FL: "Florida",
};

const FILTERS: StateFilter[] = ["ALL", "NY", "NJ", "TX", "FL"];

function DocumentCard({ doc }: { doc: Document }) {
  const colors = useColors();

  function handleOpen() {
    Linking.openURL(doc.url);
  }

  return (
    <Card style={styles.docCard} elevated>
      <View style={styles.docHeader}>
        <View style={[styles.docIconWrap, { backgroundColor: colors.primary + "15" }]}>
          <Feather name={doc.icon} size={20} color={colors.primary} />
        </View>
        <View style={styles.docTitleWrap}>
          <Text style={[styles.docTitle, { color: colors.foreground }]} numberOfLines={1}>
            {doc.title}
          </Text>
          <Text style={[styles.docSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
            {doc.subtitle}
          </Text>
        </View>
        <Badge label={doc.state} variant="accent" />
      </View>
      <Text style={[styles.docDescription, { color: colors.mutedForeground }]}>
        {doc.description}
      </Text>
      <TouchableOpacity
        onPress={handleOpen}
        activeOpacity={0.75}
        style={[styles.openBtn, { borderColor: colors.border, borderRadius: colors.radius - 4 }]}
      >
        <Feather name="external-link" size={14} color={colors.primary} />
        <Text style={[styles.openBtnText, { color: colors.primary }]}>Open Form</Text>
      </TouchableOpacity>
    </Card>
  );
}

export default function DocumentsPage() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<StateFilter>("ALL");

  const paddingTop = Platform.OS === "web" ? 67 : insets.top;
  const paddingBottom = Platform.OS === "web" ? 34 : insets.bottom + 90;

  const visibleDocs =
    activeFilter === "ALL"
      ? DOCUMENTS
      : DOCUMENTS.filter((d) => d.state === activeFilter);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: paddingTop + 20, paddingBottom },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Documents</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Official forms for your state's property tax appeal
      </Text>

      {/* State filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => {
          const isActive = f === activeFilter;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.75}
              style={[
                styles.filterBtn,
                {
                  backgroundColor: isActive ? colors.primary : colors.secondary,
                  borderRadius: colors.radius - 4,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  { color: isActive ? colors.primaryForeground : colors.foreground },
                ]}
              >
                {f === "ALL" ? "All States" : f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* State label for non-ALL filters */}
      {activeFilter !== "ALL" && (
        <Text style={[styles.stateLabel, { color: colors.mutedForeground }]}>
          {STATE_LABELS[activeFilter]} · {visibleDocs.length} form{visibleDocs.length !== 1 ? "s" : ""}
        </Text>
      )}

      {/* Document list */}
      {visibleDocs.length > 0 ? (
        visibleDocs.map((doc) => <DocumentCard key={doc.id} doc={doc} />)
      ) : (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
            <Feather name="file-text" size={32} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No forms available
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Check back soon for updates
          </Text>
        </View>
      )}

      <View style={[styles.disclaimer, { backgroundColor: colors.muted, borderRadius: colors.radius - 4 }]}>
        <Feather name="info" size={14} color={colors.mutedForeground} />
        <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
          Forms link to official government sources. Filing deadlines and procedures vary
          by county — verify current requirements before submitting.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 12 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, marginBottom: 2 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 4 },
  filterRow: { gap: 8, paddingVertical: 4 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 9 },
  filterBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  stateLabel: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 4 },
  docCard: { padding: 16, gap: 10 },
  docHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  docIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  docTitleWrap: { flex: 1, gap: 2 },
  docTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  docSubtitle: { fontFamily: "Inter_400Regular", fontSize: 12 },
  docDescription: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
  openBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  openBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  empty: { alignItems: "center", paddingTop: 48, gap: 12 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" },
  disclaimer: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    alignItems: "flex-start",
    marginTop: 4,
  },
  disclaimerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
});
