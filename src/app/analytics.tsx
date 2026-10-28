import Colors from "@/constants/Colors";
import { useTasks } from "@/context/TaskContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Analytics = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tasks } = useTasks();

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "Done").length;
  const inProgress = tasks.filter((t) => t.status === "In Progress").length;
  const todo = tasks.filter((t) => t.status === "To-do").length;

  const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const inProgressPercent = total > 0 ? Math.round((inProgress / total) * 100) : 0;
  const todoPercent = total > 0 ? Math.round((todo / total) * 100) : 0;

  // Category distribution
  const categories = useMemo(() => {
    const map = new Map<
      string,
      { total: number; completed: number; inProgress: number; todo: number }
    >();

    tasks.forEach((t) => {
      const existing = map.get(t.category) || {
        total: 0,
        completed: 0,
        inProgress: 0,
        todo: 0,
      };
      existing.total += 1;
      if (t.status === "Done") existing.completed += 1;
      if (t.status === "In Progress") existing.inProgress += 1;
      if (t.status === "To-do") existing.todo += 1;
      map.set(t.category, existing);
    });

    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      ...data,
      percent: Math.round((data.completed / data.total) * 100),
    }));
  }, [tasks]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/")}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Analytics</Text>

        <View style={styles.iconButtonPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Productivity Rate Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroSubtitle}>Productivity Overview</Text>
              <Text style={styles.heroRate}>{completionPercent}%</Text>
            </View>
            <View style={styles.heroBadge}>
              <Ionicons
                name="trending-up"
                size={20}
                color={Colors.statusDone}
              />
              <Text style={styles.heroBadgeText}>
                {completed} of {total} Done
              </Text>
            </View>
          </View>

          {/* Multi-segmented Progress Bar */}
          <View style={styles.multiProgressBar}>
            {completed > 0 && (
              <View
                style={[
                  styles.progressBarSegment,
                  {
                    flex: completed,
                    backgroundColor: Colors.statusDone,
                  },
                ]}
              />
            )}
            {inProgress > 0 && (
              <View
                style={[
                  styles.progressBarSegment,
                  {
                    flex: inProgress,
                    backgroundColor: Colors.statusInProgress,
                  },
                ]}
              />
            )}
            {todo > 0 && (
              <View
                style={[
                  styles.progressBarSegment,
                  {
                    flex: todo,
                    backgroundColor: Colors.statusTodo,
                  },
                ]}
              />
            )}
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: Colors.statusDone },
                ]}
              />
              <Text style={styles.legendText}>Done ({completionPercent}%)</Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: Colors.statusInProgress },
                ]}
              />
              <Text style={styles.legendText}>
                Active ({inProgressPercent}%)
              </Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: Colors.statusTodo },
                ]}
              />
              <Text style={styles.legendText}>To-do ({todoPercent}%)</Text>
            </View>
          </View>
        </View>

        {/* 2x2 Metric Grid */}
        <View style={styles.metricsGrid}>
          {/* Card: Total */}
          <View style={styles.metricCard}>
            <View style={styles.metricIconWrap}>
              <Ionicons
                name="layers-outline"
                size={18}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.metricNumber}>{total}</Text>
            <Text style={styles.metricLabel}>Total Tasks</Text>
          </View>

          {/* Card: Completed */}
          <View style={styles.metricCard}>
            <View
              style={[
                styles.metricIconWrap,
                { backgroundColor: "rgba(74, 222, 128, 0.15)" },
              ]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={Colors.statusDone}
              />
            </View>
            <Text style={[styles.metricNumber, { color: Colors.statusDone }]}>
              {completed}
            </Text>
            <Text style={styles.metricLabel}>Completed</Text>
          </View>

          {/* Card: In Progress */}
          <View style={styles.metricCard}>
            <View
              style={[
                styles.metricIconWrap,
                { backgroundColor: "rgba(251, 191, 36, 0.15)" },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={18}
                color={Colors.statusInProgress}
              />
            </View>
            <Text
              style={[
                styles.metricNumber,
                { color: Colors.statusInProgress },
              ]}
            >
              {inProgress}
            </Text>
            <Text style={styles.metricLabel}>In Progress</Text>
          </View>

          {/* Card: To-do */}
          <View style={styles.metricCard}>
            <View
              style={[
                styles.metricIconWrap,
                { backgroundColor: "rgba(56, 189, 248, 0.15)" },
              ]}
            >
              <Ionicons
                name="hourglass-outline"
                size={18}
                color={Colors.statusTodo}
              />
            </View>
            <Text style={[styles.metricNumber, { color: Colors.statusTodo }]}>
              {todo}
            </Text>
            <Text style={styles.metricLabel}>Pending</Text>
          </View>
        </View>

        {/* Category Breakdown */}
        <Text style={styles.sectionTitle}>Category Breakdown</Text>
        {categories.map((cat) => (
          <View key={cat.name} style={styles.categoryCard}>
            <View style={styles.catHeader}>
              <Text style={styles.catName} numberOfLines={1}>
                {cat.name}
              </Text>
              <Text style={styles.catRatio}>
                {cat.completed}/{cat.total} done
              </Text>
            </View>

            <View style={styles.catProgressBar}>
              <View
                style={[
                  styles.catProgressFill,
                  {
                    width: `${cat.percent}%`,
                    backgroundColor:
                      cat.percent === 100
                        ? Colors.statusDone
                        : Colors.primary,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default Analytics;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  iconButtonPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    marginBottom: 16,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  heroRate: {
    fontSize: 34,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(74, 222, 128, 0.12)",
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.statusDone,
  },
  multiProgressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surfaceLight,
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 14,
  },
  progressBarSegment: {
    height: "100%",
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primaryMuted,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  metricNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  categoryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
  },
  catHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  catName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  catRatio: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  catProgressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceLight,
    overflow: "hidden",
  },
  catProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
});
