import Colors from "@/constants/Colors";
import { Task, TaskStatus } from "@/constants/tasks";
import { useTasks } from "@/context/TaskContext";
import { getDeadlineProgress } from "@/utils/deadline";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STATUS_ICONS: Record<
  TaskStatus,
  { name: any; color: string }
> = {
  Done: { name: "checkmark-circle", color: Colors.statusDone },
  "In Progress": { name: "ellipse", color: Colors.statusInProgress },
  "To-do": { name: "ellipse-outline", color: Colors.statusTodo },
};

const FILTER_TABS: ("All" | TaskStatus)[] = [
  "All",
  "To-do",
  "In Progress",
  "Done",
];

const TasksScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tasks, toggleTaskStatus, deleteTask } = useTasks();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | TaskStatus>("All");
  const [now, setNow] = useState(() => new Date());

  // Realtime countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === "All" || t.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [tasks, searchQuery, activeTab]);

  const handleDelete = (task: Task) => {
    Alert.alert(
      "Delete Task",
      `Are you sure you want to delete "${task.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteTask(task.id),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/")}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>All Tasks</Text>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/create")}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title or category..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons
              name="close-circle"
              size={18}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Filter Pills */}
      <View style={styles.tabsRow}>
        {FILTER_TABS.map((tab) => {
          const isSelected = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabPill, isSelected && styles.tabPillSelected]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabPillText,
                  isSelected && styles.tabPillTextSelected,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="document-text-outline"
              size={48}
              color={Colors.border}
            />
            <Text style={styles.emptyTitle}>No matching tasks</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? "Try searching for a different keyword."
                : "No tasks in this category yet."}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const statusConfig = STATUS_ICONS[item.status];
          const deadlineInfo = getDeadlineProgress(item, now);

          return (
            <View style={styles.taskCard}>
              {/* Checkbox status toggle */}
              <TouchableOpacity
                style={styles.checkboxTouch}
                onPress={() => toggleTaskStatus(item.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={statusConfig.name}
                  size={24}
                  color={statusConfig.color}
                />
              </TouchableOpacity>

              <View style={styles.taskContent}>
                <View style={styles.titleRow}>
                  <Text style={styles.category}>{item.category}</Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={Colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                <Text
                  style={[
                    styles.title,
                    item.status === "Done" && styles.titleDone,
                  ]}
                >
                  {item.title}
                </Text>

                <View style={styles.footerRow}>
                  <View style={styles.timeRow}>
                    <Ionicons
                      name="time-outline"
                      size={13}
                      color={Colors.primary}
                    />
                    <Text style={styles.time}>{item.time}</Text>
                  </View>

                  <Text
                    style={[
                      styles.statusBadge,
                      { color: statusConfig.color },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>

                {/* Realtime Deadline Progress Bar */}
                <View style={styles.deadlineSection}>
                  <View style={styles.deadlineMetaRow}>
                    <View style={styles.deadlineLabelWrap}>
                      <Ionicons
                        name={
                          deadlineInfo.isDone
                            ? "checkmark-circle"
                            : deadlineInfo.isOverdue
                              ? "alert-circle"
                              : "hourglass-outline"
                        }
                        size={11}
                        color={deadlineInfo.color}
                      />
                      <Text
                        style={[
                          styles.deadlineLabelText,
                          { color: deadlineInfo.color },
                        ]}
                      >
                        {deadlineInfo.label}
                      </Text>
                    </View>

                    <Text style={styles.deadlinePercentText}>
                      {deadlineInfo.percent}%
                    </Text>
                  </View>

                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${deadlineInfo.percent}%`,
                          backgroundColor: deadlineInfo.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

export default TasksScreen;

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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabPillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  tabPillTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  taskCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkboxTouch: {
    paddingTop: 2,
  },
  taskContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  category: {
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
  },
  deleteButton: {
    padding: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  titleDone: {
    textDecorationLine: "line-through",
    color: Colors.textSecondary,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  time: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "500",
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: "600",
  },
  deadlineSection: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  deadlineMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  deadlineLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  deadlineLabelText: {
    fontSize: 11,
    fontWeight: "600",
  },
  deadlinePercentText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceLight,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
