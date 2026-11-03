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

const formatDateKey = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const Analytics = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tasks, toggleTaskStatus } = useTasks();

  const [timeframe, setTimeframe] = useState<Timeframe>("Today");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const todayKey = useMemo(() => formatDateKey(new Date()), []);

  // 7-day date keys for current week (Mon to Sun)
  const currentWeekDates = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    const dates = new Set<string>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.add(formatDateKey(d));
    }
    return dates;
  }, []);

  // Filter tasks based on selected timeframe
  const scopedTasks = useMemo(() => {
    if (timeframe === "Today") {
      return tasks.filter((t) => (t.date || todayKey) === todayKey);
    }
    if (timeframe === "This Week") {
      return tasks.filter((t) => currentWeekDates.has(t.date || todayKey));
    }
    return tasks;
  }, [tasks, timeframe, todayKey, currentWeekDates]);

  // Core metrics calculated from scoped tasks
  const total = scopedTasks.length;
  const completed = scopedTasks.filter((t) => t.status === "Done").length;
  const inProgress = scopedTasks.filter((t) => t.status === "In Progress").length;
  const todo = scopedTasks.filter((t) => t.status === "To-do").length;

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

    scopedTasks.forEach((task) => {
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
  }, [scopedTasks]);

  // Productive scheduled time breakdown (Morning, Afternoon, Evening)
  const timeDistribution = useMemo(() => {
    let morning = 0;
    let afternoon = 0;
    let evening = 0;

    scopedTasks.forEach((t) => {
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
  }, [scopedTasks]);

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

    scopedTasks.forEach((t) => {
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
  }, [scopedTasks]);

  // Current day of week (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const currentDayIndex = useMemo(() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
  }, []);

  const toggleCategoryExpand = (catName: string) => {
    setExpandedCategory((prev) => (prev === catName ? null : catName));
  };

  // Focus time parsed from completed tasks
  const totalCompletedMinutes = useMemo(() => {
    return scopedTasks
      .filter((t) => t.status === "Done")
      .reduce((acc, t) => {
        const dur = t.estimatedDuration;
        if (!dur) return acc + 30;
        let mins = 0;
        const hMatch = dur.match(/(\d+)\s*h/i);
        const mMatch = dur.match(/(\d+)\s*m/i);
        if (hMatch) mins += parseInt(hMatch[1], 10) * 60;
        if (mMatch) mins += parseInt(mMatch[1], 10);
        return acc + (mins || 30);
      }, 0);
  }, [scopedTasks]);

  const focusLoggedLabel = useMemo(() => {
    if (totalCompletedMinutes === 0) return "0 hrs";
    if (totalCompletedMinutes < 60) return `${totalCompletedMinutes}m`;
    const hrs = (totalCompletedMinutes / 60).toFixed(1);
    return `${hrs.replace(".0", "")} hrs`;
  }, [totalCompletedMinutes]);

  // Dynamic active streak calculation
  const activeStreakDays = useMemo(() => {
    const doneTasksWithDate = tasks.filter((t) => t.status === "Done" && t.date);
    if (doneTasksWithDate.length === 0) return 0;
    const doneDates = new Set(doneTasksWithDate.map((t) => t.date!));

    let streak = 0;
    const d = new Date();
    const todayStr = formatDateKey(d);
    if (!doneDates.has(todayStr)) {
      d.setDate(d.getDate() - 1);
    }
    while (streak < 30) {
      const key = formatDateKey(d);
      if (doneDates.has(key)) {
        streak += 1;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [tasks]);

  // Peak activity window
  const peakWindow = useMemo(() => {
    const { morning, afternoon, evening } = timeDistribution;
    if (morning === 0 && afternoon === 0 && evening === 0) return "Flexible";
    if (morning >= afternoon && morning >= evening) return "Morning";
    if (afternoon >= morning && afternoon >= evening) return "Afternoon";
    return "Evening";
  }, [timeDistribution]);

  // Weekly velocity data for 7 days
  const weeklyVelocityData = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    return DAYS_OF_WEEK.map((dayName, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const key = formatDateKey(d);

      const dayTasks = tasks.filter((t) => t.date === key);
      const dayTotal = dayTasks.length;
      const dayCompleted = dayTasks.filter((t) => t.status === "Done").length;
      const percent =
        dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0;

      return {
        day: dayName,
        dateKey: key,
        total: dayTotal,
        completed: dayCompleted,
        percent,
      };
    });
  }, [tasks]);

  // AI Productivity recommendation
  const insightRecommendation = useMemo(() => {
    if (deadlineAnalysis.overdueCount > 0) {
      return {
        type: "alert",
        icon: "warning-outline",
        color: "#EF4444",
        bg: "rgba(239, 68, 68, 0.12)",
        title: "Immediate Action Required",
        message: `${deadlineAnalysis.overdueCount} task is past its deadline. Start a 25m Focus Session to resolve it promptly.`,
      };
    }
    if (completionPercent >= 75) {
      return {
        type: "success",
        icon: "trophy-outline",
        color: Colors.statusDone,
        bg: "rgba(74, 222, 128, 0.12)",
        title: "High Velocity Flow",
        message: `Stellar execution! You have completed ${completionPercent}% of your ${timeframe.toLowerCase()} schedule.`,
      };
    }
    if (inProgress > 0) {
      return {
        type: "active",
        icon: "flame-outline",
        color: Colors.primary,
        bg: "rgba(245, 158, 11, 0.12)",
        title: "Momentum in Progress",
        message: `${inProgress} active task underway. Recommended focus period: Afternoon 12:00 - 05:00 PM.`,
      };
    }
    if (total === 0) {
      return {
        type: "neutral",
        icon: "sparkles-outline",
        color: Colors.primary,
        bg: "rgba(245, 158, 11, 0.12)",
        title: "Fresh Slate Ahead",
        message: "No tasks scheduled yet. Tap + to schedule your priorities and ignite your flow.",
      };
    }
    return {
      type: "neutral",
      icon: "bulb-outline",
      color: Colors.statusTodo,
      bg: "rgba(56, 189, 248, 0.12)",
      title: "Ready to Kickstart",
      message: `${todo} pending tasks on deck. Pick your highest-impact task to begin.`,
    };
  }, [
    deadlineAnalysis.overdueCount,
    completionPercent,
    inProgress,
    total,
    todo,
    timeframe,
  ]);

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
              <Text style={styles.heroSubtitle}>
                {timeframe} Completion Score
              </Text>
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
              <Text style={styles.legendText}>Done ({completed})</Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: Colors.statusInProgress },
                ]}
              />
              <Text style={styles.legendText}>Active ({inProgressPercent}%)</Text>
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

        {/* AI Productivity Insight Card */}
        <View
          style={[
            styles.insightCard,
            { backgroundColor: insightRecommendation.bg },
          ]}
        >
          <View style={styles.insightHeader}>
            <View style={styles.insightHeaderLeft}>
              <Ionicons
                name={insightRecommendation.icon as any}
                size={18}
                color={insightRecommendation.color}
              />
              <Text
                style={[
                  styles.insightTitle,
                  { color: insightRecommendation.color },
                ]}
              >
                {insightRecommendation.title}
              </Text>
            </View>
            <View style={styles.insightBadge}>
              <Text style={styles.insightBadgeText}>Insight</Text>
            </View>
          </View>
          <Text style={styles.insightMessage}>
            {insightRecommendation.message}
          </Text>

          {/* Metric Triad: Streak + Focus + Best Window */}
          <View style={styles.insightMetricsRow}>
            <View style={styles.insightMetricItem}>
              <Text style={styles.insightMetricNum}>
                {`🔥 ${activeStreakDays} ${activeStreakDays === 1 ? "Day" : "Days"}`}
              </Text>
              <Text style={styles.insightMetricLabel}>Active Streak</Text>
            </View>
            <View style={styles.insightMetricDivider} />
            <View style={styles.insightMetricItem}>
              <Text style={styles.insightMetricNum}>{`⏱️ ${focusLoggedLabel}`}</Text>
              <Text style={styles.insightMetricLabel}>Focus Logged</Text>
            </View>
            <View style={styles.insightMetricDivider} />
            <View style={styles.insightMetricItem}>
              <Text style={styles.insightMetricNum}>
                {peakWindow === "Morning"
                  ? "☀️ Morning"
                  : peakWindow === "Afternoon"
                    ? "🌤️ Afternoon"
                    : peakWindow === "Evening"
                      ? "🌙 Evening"
                      : "⚡ Flexible"}
              </Text>
              <Text style={styles.insightMetricLabel}>Peak Hours</Text>
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
            {weeklyVelocityData.map((dayData, idx) => {
              const isCurrentDay = idx === currentDayIndex;
              const hasTasks = dayData.total > 0;
              const barFillPercent = hasTasks
                ? Math.max(18, dayData.percent)
                : isCurrentDay && completionPercent > 0
                  ? Math.max(18, completionPercent)
                  : 0;

              return (
                <View key={dayData.day} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    {barFillPercent > 0 && (
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${barFillPercent}%`,
                            backgroundColor: isCurrentDay
                              ? Colors.primary
                              : dayData.percent === 100
                                ? Colors.statusDone
                                : "rgba(245, 158, 11, 0.45)",
                          },
                        ]}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.barDayText,
                      isCurrentDay && styles.barDayTextActive,
                    ]}
                  >
                    {dayData.day}
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
                All deadlines are well within schedule.
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
          <Text style={styles.sectionMeta}>
            {categories.length > 0 ? "Tap to view tasks" : "No active categories"}
          </Text>
        </View>

        {categories.length === 0 ? (
          <View style={styles.categoryEmptyCard}>
            <Ionicons
              name="folder-open-outline"
              size={26}
              color={Colors.textSecondary}
            />
            <Text style={styles.categoryEmptyTitle}>No Categories Yet</Text>
            <Text style={styles.categoryEmptySubtitle}>
              Categorized tasks will automatically appear and graph here.
            </Text>
          </View>
        ) : (
          categories.map((cat) => {
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
                      const subtaskCount = task.subtasks?.length ?? 0;
                      const completedSubtaskCount =
                        task.subtasks?.filter((st) => st.completed).length ?? 0;

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

                          <View style={styles.catTaskTitleWrap}>
                            <Text
                              style={[
                                styles.catTaskTitle,
                                isDone && styles.catTaskTitleDone,
                              ]}
                              numberOfLines={1}
                            >
                              {task.title}
                            </Text>

                            {subtaskCount > 0 && (
                              <Text style={styles.catSubtaskMeta}>
                                {completedSubtaskCount}/{subtaskCount} subtasks
                              </Text>
                            )}
                          </View>

                          <Text style={styles.catTaskTime}>{task.time}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })
        )}
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
    fontWeight: "500",
    marginBottom: 4,
  },
  heroRate: {
    fontSize: 36,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
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
    marginBottom: 16,
  },
  progressBarSegment: {
    height: "100%",
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  insightCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 16,
  },
  insightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  insightHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  insightBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  insightBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
  },
  insightMessage: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
    marginBottom: 14,
  },
  insightMetricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  insightMetricItem: {
    flex: 1,
    alignItems: "center",
  },
  insightMetricNum: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  insightMetricLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  insightMetricDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
  },
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
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
    height: 120,
    paddingTop: 10,
  },
  barCol: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  barTrack: {
    width: 16,
    height: 80,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 8,
  },
  barDayText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
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
    marginTop: -4,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    width: "48%",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryMuted,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
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
    fontWeight: "500",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
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
    marginBottom: 24,
  },
  deadlineStatusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
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
    color: Colors.textSecondary,
  },
  criticalList: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  criticalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  criticalItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 10,
  },
  criticalTitle: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  criticalLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  allClearRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
  },
  allClearText: {
    fontSize: 12,
    color: Colors.statusDone,
    fontWeight: "600",
  },
  focusDistributionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginTop: 10,
    marginBottom: 24,
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
    marginTop: 2,
  },
  focusBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  focusPeriodDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  categoryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
  },
  catHeaderTouch: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  catHeaderLeft: {
    flex: 1,
    marginRight: 10,
  },
  catName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  catRatio: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  catProgressBar: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.surfaceLight,
    overflow: "hidden",
  },
  catProgressFill: {
    height: "100%",
    borderRadius: 2.5,
  },
  catTaskList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
  },
  catTaskItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 2,
  },
  catTaskTitleWrap: {
    flex: 1,
  },
  catTaskTitle: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  catTaskTitleDone: {
    textDecorationLine: "line-through",
    color: Colors.textSecondary,
  },
  catSubtaskMeta: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  catTaskTime: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "600",
  },
  categoryEmptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    gap: 8,
  },
  categoryEmptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  categoryEmptySubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
    maxWidth: 240,
    lineHeight: 17,
  },
});
