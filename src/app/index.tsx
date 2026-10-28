import DateSelector, { formatDateKey } from "@/components/DateSelector";
import FilterTabs from "@/components/FilterTabs";
import Header from "@/components/Header";
import TaskCard from "@/components/TaskCard";
import WatchWidget from "@/components/WatchWidget";
import Colors from "@/constants/Colors";
import { FilterOptions, Task } from "@/constants/tasks";
import { useTasks } from "@/context/TaskContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Index = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tasks, toggleTaskStatus } = useTasks();
  const [activeFilter, setActiveFilter] = useState<FilterOptions>("All");
  const todayKey = useMemo(() => formatDateKey(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  }, []);

  const handleToggleTask = (task: Task) => {
    toggleTaskStatus(task.id);
    const nextStatus =
      task.status === "To-do"
        ? "In Progress"
        : task.status === "In Progress"
          ? "Done"
          : "To-do";
    showToast(`Marked "${task.title}" as ${nextStatus}`);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  // Filter counts for tabs
  const filterCounts = useMemo<Record<FilterOptions, number>>(() => {
    return {
      All: tasks.length,
      "To do": tasks.filter((t) => t.status === "To-do").length,
      "In Progress": tasks.filter((t) => t.status === "In Progress").length,
      Completed: tasks.filter((t) => t.status === "Done").length,
    };
  }, [tasks]);

  // Dynamic header title based on the realtime date selected
  const headerTitle = useMemo(() => {
    if (selectedDate === todayKey) return "Today's Task";

    const now = new Date();
    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    if (selectedDate === formatDateKey(tomorrow)) return "Tomorrow's Task";

    const yesterday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1
    );
    if (selectedDate === formatDateKey(yesterday)) return "Yesterday's Task";

    const [year, month, day] = selectedDate.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return `${d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} Tasks`;
  }, [selectedDate, todayKey]);

  // Filter tasks based on active filter tab
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (activeFilter === "All") return true;
      if (activeFilter === "To do") return task.status === "To-do";
      if (activeFilter === "In Progress") return task.status === "In Progress";
      if (activeFilter === "Completed") return task.status === "Done";
      return true;
    });
  }, [tasks, activeFilter]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Floating Interactive Toast */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={Colors.statusDone}
          />
          <Text style={styles.toastText} numberOfLines={1}>
            {toastMessage}
          </Text>
        </View>
      )}

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onPress={() => handleToggleTask(item)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* Top Navigation Header */}
            <Header title={headerTitle} />

            {/* Live Watch & Daily Progress Widget */}
            <WatchWidget />

            {/* Realtime Date Selector */}
            <DateSelector
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />

            {/* Filter Tabs with real counts */}
            <FilterTabs
              selected={activeFilter}
              onSelect={setActiveFilter}
              counts={filterCounts}
            />

            {/* Tasks Section Header with Quick Add Button */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Text style={styles.sectionTitle}>{"Today's Schedule"}</Text>
                <View style={styles.taskCountBadge}>
                  <Text style={styles.taskCountText}>
                    {filteredTasks.length}{" "}
                    {filteredTasks.length === 1 ? "task" : "tasks"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.quickAddButton}
                onPress={() => router.push("/create")}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={15} color={Colors.primary} />
                <Text style={styles.quickAddText}>Add</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name="checkmark-done"
                size={32}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.emptyTitle}>No tasks found</Text>
            <Text style={styles.emptySubtitle}>
              No tasks currently match &ldquo;{activeFilter}&rdquo;.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push("/create")}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Add New Task</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    paddingBottom: 24,
  },
  toastContainer: {
    position: "absolute",
    top: 55,
    left: 20,
    right: 20,
    zIndex: 99,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  taskCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  taskCountText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  quickAddButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: Colors.primaryMuted,
  },
  quickAddText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 8,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  emptyButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
