import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useCases } from "@/context/CasesContext";
import { CaseCard } from "@/components/CaseCard";

export default function CasesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cases, isLoaded } = useCases();
  const [refreshing, setRefreshing] = useState(false);

  const paddingTop = Platform.OS === "web" ? 67 : insets.top;
  const paddingBottom = Platform.OS === "web" ? 34 : insets.bottom + 90;

  function onRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={cases}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CaseCard
            item={item}
            onPress={() => router.push({ pathname: "/case/[id]", params: { id: item.id } })}
          />
        )}
        contentContainerStyle={[
          styles.list,
          { paddingTop: paddingTop + 16, paddingBottom },
        ]}
        scrollEnabled={!!cases.length}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>My Cases</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {cases.length === 0
                ? "No cases yet"
                : `${cases.length} case${cases.length !== 1 ? "s" : ""}`}
            </Text>
          </View>
        }
        ListEmptyComponent={
          isLoaded ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
                <Feather name="folder" size={32} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No cases yet
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Start a new appeal from the New Case tab
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 20 },
  header: { marginBottom: 20 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 2 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18 },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
