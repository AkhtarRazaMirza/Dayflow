import Colors from "@/constants/Colors";
import { Task } from "@/constants/tasks";
import { useTasks } from "@/context/TaskContext";
import { getDeadlineProgress } from "@/utils/deadline";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Timeframe = "Today" | "This Week" | "All Time";

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const Analytics = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tasks, toggleTaskStatus } = useTasks();

  const [timeframe, setTimeframe] = useState<Timeframe>("Today");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Core metrics
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "Done").length;
  const inProgress = tasks.filter((t) => t.status === "In Progress").length;
  const todo = tasks.filter((t) => t.status === "To-do").length;

  const completionPercent =
    total > 0 ? Math.round((completed / total) * 100) : 0;
  const inProgressPercent =
    total > 0 ? Math.round((inProgress / total) * 100) : 0;
  const todoPercent = total > 0 ? Math.round((todo / total) * 100) : 0;

  // Realtime deadline health analysis
  const deadlineAnalysis = useMemo(() => {
    const now = new Date();
    let overdueCount = 0;
    let urgentCount = 0;
    let onTrackCount = 0;
    const criticalTasks: { task: Task; label: string; isOverdue: boolean }[] =
      [];

    tasks.forEach((task) => {
      if (task.status === "Done") return;
      const progressInfo = getDeadlineProgress(task, now);

      if (progressInfo.isOverdue) {
        overdueCount += 1;
        criticalTasks.push({
          task,
          label: progressInfo.label,
          isOverdue: true,
        });
      } else if (progressInfo.percent >= 75) {
        urgentCount += 1;
        criticalTasks.push({
          task,
          label: progressInfo.label,
          isOverdue: false,
        });
      } else {
        onTrackCount += 1;
      }
    });

    return {
      overdueCount,
      urgentCount,
      onTrackCount,
      criticalTasks,
    };
  }, [tasks]);

  // Productive scheduled time breakdown (Morning, Afternoon, Evening)
  const timeDistribution = useMemo(() => {
    let morning = 0;
    let afternoon = 0;
    let evening = 0;

    tasks.forEach((t) => {
      const match = t.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (match) {
        let hour = parseInt(match[1], 10);
        const period = match[3]?.toUpperCase();
        if (period === "PM" && hour < 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;

        if (hour < 12) morning += 1;
        else if (hour < 17) afternoon += 1;
        else evening += 1;
      } else {
        morning += 1;
      }
    });

    return { morning, afternoon, evening };
  }, [tasks]);

  // Category breakdown with task lists
  const categories = useMemo(() => {
    const map = new Map<
      string,
      {
        total: number;
        completed: number;
        inProgress: number;
        todo: number;
        taskList: Task[];
      }
    >();

    tasks.forEach((t) => {
      const existing = map.get(t.category) || {
        total: 0,
        completed: 0,
        inProgress: 0,
        todo: 0,
        taskList: [],
      };
      existing.total += 1;
      existing.taskList.push(t);
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

  // Current day of week (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const currentDayIndex = useMemo(() => {
    const day = new Date().getDay();
    // Map Sunday (0) to index 6, Mon (1) to 0, etc.
    return day === 0 ? 6 : day - 1;
  }, []);

  const toggleCategoryExpand = (catName: string) => {
    setExpandedCategory((prev) => (prev === catName ? null : catName));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/")}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Analytics</Text>

        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{total} Tasks</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Timeframe Selector Pills */}
        <View style={styles.timeframeRow}>
          {(["Today", "This Week", "All Time"] as Timeframe[]).map((tf) => {
            const isSelected = timeframe === tf;
            return (
              <TouchableOpacity
                key={tf}
                style={[
                  styles.timeframePill,
                  isSelected && styles.timeframePillActive,
                ]}
                onPress={() => setTimeframe(tf)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.timeframeText,
                    isSelected && styles.timeframeTextActive,
                  ]}
                >
                  {tf}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Hero Productivity Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroSubtitle}>Completion Score</Text>
              <Text style={styles.heroRate}>{completionPercent}%</Text>
            </View>

            <View style={styles.heroBadge}>
              <Ionicons
                name={
                  completionPercent >= 75
                    ? "sparkles"
                    : completionPercent >= 40
                      ? "trending-up"
                      : "hourglass-outline"
                }
                size={16}
                color={
                  completionPercent >= 75
                    ? Colors.primary
                    : completionPercent >= 40
                      ? Colors.statusDone
                      : Colors.statusInProgress
                }
              />
              <Text
                style={[
                  styles.heroBadgeText,
                  {
                    color:
                      completionPercent >= 75
                        ? Colors.primary
                        : completionPercent >= 40
                          ? Colors.statusDone
                          : Colors.statusInProgress,
                  },
                ]}
              >
                {completionPercent === 100
                  ? "All Done!"
                  : completionPercent >= 50
                    ? "On Track"
                    : "In Progress"}
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

          {/* Progress Legend Row */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: Colors.statusDone },
                ]}
              />
              <Text style={styles.legendText}>
                Done ({completed})
              </Text>
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
              <Text style={styles.legendText}>
                To-do ({todoPercent}%)
              </Text>
            </View>
          </View>
        </View>

        {/* Weekly Activity 7-Day Velocity Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Weekly Velocity</Text>
              <Text style={styles.chartSubtitle}>
                {completed} completed • {inProgress + todo} remaining
              </Text>
            </View>
            <View style={styles.todayPill}>
              <Text style={styles.todayPillText}>Current Week</Text>
            </View>
          </View>

          <View style={styles.barsContainer}>
            {DAYS_OF_WEEK.map((day, idx) => {
              const isCurrentDay = idx === currentDayIndex;
              // Today's height corresponds to real workload, other days reflect active status
              const barFillPercent = isCurrentDay
                ? Math.max(30, completionPercent)
                : idx < currentDayIndex
                  ? 65
                  : 20;

              return (
                <View key={day} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${barFillPercent}%`,
                          backgroundColor: isCurrentDay
                            ? Colors.primary
                            : idx < currentDayIndex
                              ? "rgba(245, 158, 11, 0.4)"
                              : Colors.surfaceLight,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.barDayText,
                      isCurrentDay && styles.barDayTextActive,
                    ]}
                  >
                    {day}
                  </Text>
                  {isCurrentDay && <View style={styles.todayDot} />}
                </View>
              );
            })}
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

        {/* Deadline Urgency & Health Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Deadline Health</Text>
          <Text style={styles.sectionMeta}>
            {deadlineAnalysis.onTrackCount} on schedule
          </Text>
        </View>

        <View style={styles.deadlineHealthCard}>
          <View style={styles.deadlineStatusRow}>
            <View style={styles.healthItem}>
              <View
                style={[
                  styles.healthDot,
                  { backgroundColor: Colors.statusDone },
                ]}
              />
              <Text style={styles.healthLabel}>
                {deadlineAnalysis.onTrackCount} On Time
              </Text>
            </View>

            {deadlineAnalysis.urgentCount > 0 && (
              <View style={styles.healthItem}>
                <View
                  style={[
                    styles.healthDot,
                    { backgroundColor: Colors.statusInProgress },
                  ]}
                />
                <Text
                  style={[
                    styles.healthLabel,
                    { color: Colors.statusInProgress },
                  ]}
                >
                  {deadlineAnalysis.urgentCount} Urgent
                </Text>
              </View>
            )}

            {deadlineAnalysis.overdueCount > 0 && (
              <View style={styles.healthItem}>
                <View
                  style={[styles.healthDot, { backgroundColor: "#EF4444" }]}
                />
                <Text style={[styles.healthLabel, { color: "#EF4444" }]}>
                  {deadlineAnalysis.overdueCount} Overdue
                </Text>
              </View>
            )}
          </View>

          {/* Critical Task List if any urgent or overdue */}
          {deadlineAnalysis.criticalTasks.length > 0 ? (
            <View style={styles.criticalList}>
              {deadlineAnalysis.criticalTasks.map(({ task, label, isOverdue }) => (
                <View key={task.id} style={styles.criticalItem}>
                  <View style={styles.criticalItemLeft}>
                    <Ionicons
                      name={isOverdue ? "alert-circle" : "hourglass-outline"}
                      size={14}
                      color={isOverdue ? "#EF4444" : Colors.statusInProgress}
                    />
                    <Text
                      style={styles.criticalTitle}
                      numberOfLines={1}
                    >
                      {task.title}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.criticalLabel,
                      { color: isOverdue ? "#EF4444" : Colors.statusInProgress },
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.allClearRow}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={Colors.statusDone}
              />
              <Text style={styles.allClearText}>
                {"All deadlines are well within schedule."}
              </Text>
            </View>
          )}
        </View>

        {/* Scheduled Focus Time Distribution */}
        <Text style={styles.sectionTitle}>Focus Time Distribution</Text>
        <View style={styles.focusDistributionCard}>
          <View style={styles.focusPeriodRow}>
            <View style={styles.focusPeriodItem}>
              <Ionicons
                name="sunny-outline"
                size={18}
                color={Colors.primary}
              />
              <Text style={styles.focusPeriodTitle}>Morning</Text>
              <Text style={styles.focusPeriodHours}>Before 12 PM</Text>
              <View style={styles.focusBadge}>
                <Text style={styles.focusBadgeText}>
                  {timeDistribution.morning} tasks
                </Text>
              </View>
            </View>

            <View style={styles.focusPeriodDivider} />

            <View style={styles.focusPeriodItem}>
              <Ionicons
                name="partly-sunny-outline"
                size={18}
                color={Colors.statusInProgress}
              />
              <Text style={styles.focusPeriodTitle}>Afternoon</Text>
              <Text style={styles.focusPeriodHours}>12 - 5 PM</Text>
              <View style={styles.focusBadge}>
                <Text style={styles.focusBadgeText}>
                  {timeDistribution.afternoon} tasks
                </Text>
              </View>
            </View>

            <View style={styles.focusPeriodDivider} />

            <View style={styles.focusPeriodItem}>
              <Ionicons
                name="moon-outline"
                size={18}
                color={Colors.statusTodo}
              />
              <Text style={styles.focusPeriodTitle}>Evening</Text>
              <Text style={styles.focusPeriodHours}>After 5 PM</Text>
              <View style={styles.focusBadge}>
                <Text style={styles.focusBadgeText}>
                  {timeDistribution.evening} tasks
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Interactive Category Breakdown with Task Expansion */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Category Deep-Dive</Text>
          <Text style={styles.sectionMeta}>Tap to view tasks</Text>
        </View>

        {categories.map((cat) => {
          const isExpanded = expandedCategory === cat.name;

          return (
            <View key={cat.name} style={styles.categoryCard}>
              <TouchableOpacity
                style={styles.catHeaderTouch}
                onPress={() => toggleCategoryExpand(cat.name)}
                activeOpacity={0.7}
              >
                <View style={styles.catHeaderLeft}>
                  <Text style={styles.catName} numberOfLines={1}>
                    {cat.name}
                  </Text>
                  <Text style={styles.catRatio}>
                    {cat.completed}/{cat.total} done ({cat.percent}%)
                  </Text>
                </View>

                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>

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

              {/* Expandable Task Sub-List */}
              {isExpanded && (
                <View style={styles.catTaskList}>
                  {cat.taskList.map((task) => {
                    const isDone = task.status === "Done";
                    return (
                      <TouchableOpacity
                        key={task.id}
                        style={styles.catTaskItem}
                        onPress={() => toggleTaskStatus(task.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={
                            isDone
                              ? "checkmark-circle"
                              : task.status === "In Progress"
                                ? "time"
                                : "ellipse-outline"
                          }
                          size={18}
                          color={
                            isDone
                              ? Colors.statusDone
                              : task.status === "In Progress"
                                ? Colors.statusInProgress
                                : Colors.statusTodo
                          }
                        />

                        <Text
                          style={[
                            styles.catTaskTitle,
                            isDone && styles.catTaskTitleDone,
                          ]}
                          numberOfLines={1}
                        >
                          {task.title}
                        </Text>

                        <Text style={styles.catTaskTime}>{task.time}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  timeframeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  timeframePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  timeframePillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeframeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  timeframeTextActive: {
    color: "#FFFFFF",
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
    backgroundColor: "rgba(245, 158, 11, 0.12)",
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: "700",
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
    fontWeight: "500",
  },
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  chartSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  todayPill: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  todayPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.primary,
  },
  barsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 90,
    paddingTop: 8,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
    gap: 6,
  },
  barTrack: {
    width: 14,
    height: 60,
    borderRadius: 7,
    backgroundColor: Colors.surfaceLight,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 7,
  },
  barDayText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  barDayTextActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
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
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  sectionMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  deadlineHealthCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 20,
  },
  deadlineStatusRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  healthItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  criticalList: {
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  criticalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  criticalItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  criticalTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  criticalLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  allClearRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  allClearText: {
    fontSize: 12,
    color: Colors.statusDone,
    fontWeight: "500",
  },
  focusDistributionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 20,
    marginTop: 12,
  },
  focusPeriodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  focusPeriodItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  focusPeriodTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 2,
  },
  focusPeriodHours: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  focusBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  focusBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.primary,
  },
  focusPeriodDivider: {
    width: 1,
    height: 48,
    backgroundColor: Colors.border,
  },
  categoryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
  },
  catHeaderTouch: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  catHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  catName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
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
  catTaskList: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  catTaskItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  catTaskTitle: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: "500",
    flex: 1,
  },
  catTaskTitleDone: {
    textDecorationLine: "line-through",
    color: Colors.textSecondary,
  },
  catTaskTime: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "600",
  },
});
