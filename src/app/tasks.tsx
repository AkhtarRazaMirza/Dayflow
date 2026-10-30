import Colors from "@/constants/Colors";
import { Task, TaskPriority, TaskStatus } from "@/constants/tasks";
import { useTasks } from "@/context/TaskContext";
import { getDeadlineProgress } from "@/utils/deadline";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SortOption = "Deadline" | "Priority" | "Status" | "Newest";

const STATUS_ICONS: Record<
  TaskStatus,
  { name: any; color: string; bg: string }
> = {
  Done: {
    name: "checkmark-circle",
    color: Colors.statusDone,
    bg: "rgba(74, 222, 128, 0.12)",
  },
  "In Progress": {
    name: "time",
    color: Colors.statusInProgress,
    bg: "rgba(251, 191, 36, 0.12)",
  },
  "To-do": {
    name: "ellipse-outline",
    color: Colors.statusTodo,
    bg: "rgba(56, 189, 248, 0.12)",
  },
};

const PRIORITY_META: Record<
  TaskPriority,
  { color: string; bg: string; icon: any }
> = {
  High: {
    color: "#EF4444",
    bg: "rgba(239, 68, 68, 0.12)",
    icon: "flame",
  },
  Medium: {
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.12)",
    icon: "alert-circle",
  },
  Low: {
    color: "#38BDF8",
    bg: "rgba(56, 189, 248, 0.12)",
    icon: "flag",
  },
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
  const { tasks, toggleTaskStatus, updateTaskStatus, deleteTask } = useTasks();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | TaskStatus>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<SortOption>("Deadline");
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [now, setNow] = useState(() => new Date());

  // Realtime countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Category options list from tasks
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => set.add(t.category));
    return ["All", ...Array.from(set)];
  }, [tasks]);

  // Status counts for tabs
  const statusCounts = useMemo(() => {
    return {
      All: tasks.length,
      "To-do": tasks.filter((t) => t.status === "To-do").length,
      "In Progress": tasks.filter((t) => t.status === "In Progress").length,
      Done: tasks.filter((t) => t.status === "Done").length,
    };
  }, [tasks]);

  // Overall task progress
  const completedCount = statusCounts.Done;
  const totalCount = tasks.length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filtered and sorted tasks
  const filteredTasks = useMemo(() => {
    let result = tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTab = activeTab === "All" || t.status === activeTab;
      const matchesCategory =
        selectedCategory === "All" || t.category === selectedCategory;
      return matchesSearch && matchesTab && matchesCategory;
    });

    // Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === "Priority") {
        const order: Record<TaskPriority, number> = {
          High: 3,
          Medium: 2,
          Low: 1,
        };
        const pA = order[a.priority || "Medium"];
        const pB = order[b.priority || "Medium"];
        return pB - pA;
      }
      if (sortBy === "Status") {
        const order: Record<TaskStatus, number> = {
          "In Progress": 3,
          "To-do": 2,
          Done: 1,
        };
        return order[b.status] - order[a.status];
      }
      if (sortBy === "Newest") {
        return (b.createdAt || 0) - (a.createdAt || 0);
      }
      // Default: Deadline (Earliest first)
      const progA = getDeadlineProgress(a, now);
      const progB = getDeadlineProgress(b, now);
      return progB.percent - progA.percent;
    });

    return result;
  }, [tasks, searchQuery, activeTab, selectedCategory, sortBy, now]);

  const handleDelete = (task: Task) => {
    Alert.alert(
      "Delete Task",
      `Are you sure you want to delete "${task.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteTask(task.id);
            if (detailTask?.id === task.id) {
              setDetailTask(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push("/");
            }
          }}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>All Tasks</Text>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setSortModalVisible(true)}
          activeOpacity={0.7}
          accessibilityLabel="Sort tasks"
        >
          <Ionicons
            name="swap-vertical"
            size={20}
            color={Colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Top Overview Capsule */}
      <View style={styles.overviewCapsule}>
        <View style={styles.overviewHeader}>
          <View style={styles.overviewLeft}>
            <Ionicons
              name="checkbox-outline"
              size={15}
              color={Colors.primary}
            />
            <Text style={styles.overviewTitle}>
              {completedCount} of {totalCount} completed
            </Text>
          </View>
          <Text style={styles.overviewPercent}>{progressPercent}%</Text>
        </View>

        <View style={styles.capsuleProgressBarTrack}>
          <View
            style={[
              styles.capsuleProgressBarFill,
              {
                width: `${progressPercent}%`,
                backgroundColor:
                  progressPercent === 100
                    ? Colors.statusDone
                    : Colors.primary,
              },
            ]}
          />
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, category, or notes..."
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

      {/* Status Filter Tabs Menu (Home style horizontal pill scroll) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={styles.statusFilterScrollView}
        contentContainerStyle={styles.statusFilterScroll}
      >
        {FILTER_TABS.map((tab) => {
          const isSelected = activeTab === tab;
          const count = statusCounts[tab];
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.statusTabPill,
                isSelected && styles.statusTabPillSelected,
              ]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.statusTabPillText,
                  isSelected && styles.statusTabPillTextSelected,
                ]}
                numberOfLines={1}
              >
                {tab}
              </Text>
              <View
                style={[
                  styles.statusCountBadge,
                  isSelected && styles.statusCountBadgeSelected,
                ]}
              >
                <Text
                  style={[
                    styles.statusCountBadgeText,
                    isSelected && styles.statusCountBadgeTextSelected,
                  ]}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Task Category Tabs Section Header */}
      <View style={styles.categoryHeader}>
        <View style={styles.categoryTitleWrap}>
          <Ionicons
            name="folder-open-outline"
            size={13}
            color={Colors.primary}
          />
          <Text style={styles.categorySectionTitle}>CATEGORIES</Text>
        </View>

        {selectedCategory !== "All" && (
          <TouchableOpacity
            onPress={() => setSelectedCategory("All")}
            activeOpacity={0.7}
            style={styles.categoryResetBtn}
          >
            <Ionicons name="close-circle" size={13} color={Colors.primary} />
            <Text style={styles.categoryResetText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter Chips Horizontal Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={styles.categoryFilterScrollView}
        contentContainerStyle={styles.categoryScroll}
      >
        {categoryOptions.map((cat) => {
          const isSelected = selectedCategory === cat;
          const isAll = cat === "All";
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                isSelected && styles.categoryChipSelected,
              ]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isAll ? "apps-outline" : "pricetag-outline"}
                size={12}
                color={isSelected ? Colors.primary : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.categoryChipText,
                  isSelected && styles.categoryChipTextSelected,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {cat}
              </Text>
              {isSelected && !isAll && (
                <View style={styles.categoryActiveDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        style={styles.flatList}
        contentContainerStyle={[
          styles.listContent,
          filteredTasks.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name="document-text-outline"
                size={34}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.emptyTitle}>No matching tasks</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? "No tasks match your search query."
                : "No tasks in this category or status filter."}
            </Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => router.push("/create")}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.emptyAddBtnText}>Create New Task</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const statusConfig = STATUS_ICONS[item.status];
          const deadlineInfo = getDeadlineProgress(item, now);
          const isDone = item.status === "Done";
          const priorityConfig = item.priority
            ? PRIORITY_META[item.priority]
            : PRIORITY_META.Medium;

          return (
            <TouchableOpacity
              style={[styles.taskCard, isDone && styles.taskCardDone]}
              onPress={() => setDetailTask(item)}
              activeOpacity={0.75}
            >
              {/* Checkbox status toggle */}
              <TouchableOpacity
                style={styles.checkboxTouch}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  toggleTaskStatus(item.id);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={statusConfig.name}
                  size={24}
                  color={statusConfig.color}
                />
              </TouchableOpacity>

              <View style={styles.taskContent}>
                {/* Meta Row: Category + Priority Tag + Delete Icon */}
                <View style={styles.cardHeaderMeta}>
                  <View style={styles.metaLeftGroup}>
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryText} numberOfLines={1}>
                        {item.category}
                      </Text>
                    </View>

                    {item.priority && (
                      <View
                        style={[
                          styles.priorityTag,
                          { backgroundColor: priorityConfig.bg },
                        ]}
                      >
                        <Ionicons
                          name={priorityConfig.icon}
                          size={10}
                          color={priorityConfig.color}
                        />
                        <Text
                          style={[
                            styles.priorityTagText,
                            { color: priorityConfig.color },
                          ]}
                        >
                          {item.priority}
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      handleDelete(item);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={Colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Task Title */}
                <Text
                  style={[
                    styles.title,
                    isDone && styles.titleDone,
                  ]}
                >
                  {item.title}
                </Text>

                {/* Optional Notes Preview */}
                {item.notes ? (
                  <Text style={styles.notesPreview} numberOfLines={1}>
                    {item.notes}
                  </Text>
                ) : null}

                {/* Footer Row: Time + Status Badge */}
                <View style={styles.footerRow}>
                  <View style={styles.timeRow}>
                    <Ionicons
                      name="time-outline"
                      size={13}
                      color={Colors.primary}
                    />
                    <Text style={styles.time}>{item.time}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusConfig.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: statusConfig.color },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
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
            </TouchableOpacity>
          );
        }}
      />

      {/* Sort Options Modal */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSortModalVisible(false)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort Tasks By</Text>
              <TouchableOpacity
                onPress={() => setSortModalVisible(false)}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.sortOptionsList}>
              {(
                [
                  { key: "Deadline", label: "Deadline (Urgent First)", icon: "hourglass-outline" },
                  { key: "Priority", label: "Priority (High to Low)", icon: "flame-outline" },
                  { key: "Status", label: "Status (Active First)", icon: "checkmark-circle-outline" },
                  { key: "Newest", label: "Recently Added", icon: "calendar-outline" },
                ] as { key: SortOption; label: string; icon: any }[]
              ).map((opt) => {
                const isSelected = sortBy === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.sortOptionItem,
                      isSelected && styles.sortOptionItemSelected,
                    ]}
                    onPress={() => {
                      setSortBy(opt.key);
                      setSortModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sortOptionLeft}>
                      <Ionicons
                        name={opt.icon}
                        size={18}
                        color={isSelected ? Colors.primary : Colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.sortOptionText,
                          isSelected && styles.sortOptionTextSelected,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </View>

                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={Colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Task Details & Action Bottom Modal */}
      {detailTask && (
        <Modal
          visible={!!detailTask}
          transparent
          animationType="fade"
          onRequestClose={() => setDetailTask(null)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setDetailTask(null)}
          >
            <Pressable
              style={styles.detailCard}
              onPress={(e) => e.stopPropagation()}
            >
              {/* Modal Top Bar */}
              <View style={styles.detailHeader}>
                <View style={styles.detailCategoryPill}>
                  <Text style={styles.detailCategoryText}>
                    {detailTask.category}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setDetailTask(null)}
                  style={styles.closeBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.detailTitle}>{detailTask.title}</Text>

              {detailTask.notes ? (
                <View style={styles.detailNotesCard}>
                  <Text style={styles.detailNotesLabel}>Notes</Text>
                  <Text style={styles.detailNotesText}>
                    {detailTask.notes}
                  </Text>
                </View>
              ) : null}

              {/* Meta Grid */}
              <View style={styles.detailMetaGrid}>
                <View style={styles.detailMetaBox}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={Colors.primary}
                  />
                  <Text style={styles.detailMetaLabel}>Time</Text>
                  <Text style={styles.detailMetaVal}>{detailTask.time}</Text>
                </View>

                <View style={styles.detailMetaBox}>
                  <Ionicons
                    name="hourglass-outline"
                    size={16}
                    color={Colors.statusInProgress}
                  />
                  <Text style={styles.detailMetaLabel}>Deadline</Text>
                  <Text style={styles.detailMetaVal}>
                    {detailTask.deadline || detailTask.time}
                  </Text>
                </View>

                {detailTask.priority && (
                  <View style={styles.detailMetaBox}>
                    <Ionicons
                      name={PRIORITY_META[detailTask.priority].icon}
                      size={16}
                      color={PRIORITY_META[detailTask.priority].color}
                    />
                    <Text style={styles.detailMetaLabel}>Priority</Text>
                    <Text
                      style={[
                        styles.detailMetaVal,
                        { color: PRIORITY_META[detailTask.priority].color },
                      ]}
                    >
                      {detailTask.priority}
                    </Text>
                  </View>
                )}
              </View>

              {/* Status Switcher Buttons */}
              <Text style={styles.statusSwitchLabel}>Update Status</Text>
              <View style={styles.statusSwitchRow}>
                {(["To-do", "In Progress", "Done"] as TaskStatus[]).map(
                  (s) => {
                    const isSelected = detailTask.status === s;
                    return (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.statusSwitchPill,
                          isSelected && styles.statusSwitchPillActive,
                        ]}
                        onPress={() => {
                          updateTaskStatus(detailTask.id, s);
                          setDetailTask((prev) =>
                            prev ? { ...prev, status: s } : null
                          );
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.statusSwitchText,
                            isSelected && styles.statusSwitchTextActive,
                          ]}
                        >
                          {s}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.detailActionButtons}>
                <TouchableOpacity
                  style={styles.detailDeleteBtn}
                  onPress={() => handleDelete(detailTask)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <Text style={styles.detailDeleteText}>Delete Task</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.detailDoneBtn}
                  onPress={() => setDetailTask(null)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.detailDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  overviewCapsule: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  overviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  overviewLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  overviewTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  overviewPercent: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },
  capsuleProgressBarTrack: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.surfaceLight,
    overflow: "hidden",
  },
  capsuleProgressBarFill: {
    height: "100%",
    borderRadius: 2.5,
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
    marginBottom: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  statusFilterScrollView: {
    flexGrow: 0,
    marginBottom: 8,
  },
  statusFilterScroll: {
    paddingHorizontal: 20,
    gap: 10,
    paddingVertical: 4,
    alignItems: "center",
  },
  statusTabPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusTabPillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  statusTabPillText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
    includeFontPadding: false,
  },
  statusTabPillTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  statusCountBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statusCountBadgeSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  statusCountBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  statusCountBadgeTextSelected: {
    color: "#FFFFFF",
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
  },
  categoryTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  categorySectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  categoryResetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
  },
  categoryResetText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
  },
  categoryFilterScrollView: {
    flexGrow: 0,
    marginBottom: 12,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
    paddingVertical: 2,
    alignItems: "center",
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 14,
  },
  categoryChipSelected: {
    backgroundColor: "rgba(245, 158, 11, 0.14)",
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textSecondary,
    maxWidth: 160,
    includeFontPadding: false,
  },
  categoryChipTextSelected: {
    color: Colors.primary,
    fontWeight: "700",
  },
  categoryActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
  },
  flatList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  listContentEmpty: {
    flexGrow: 1,
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
  taskCardDone: {
    opacity: 0.85,
    borderColor: "rgba(74, 222, 128, 0.25)",
  },
  checkboxTouch: {
    paddingTop: 2,
  },
  taskContent: {
    flex: 1,
  },
  cardHeaderMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  metaLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  categoryPill: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: "65%",
  },
  categoryText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  priorityTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityTagText: {
    fontSize: 9,
    fontWeight: "700",
  },
  deleteButton: {
    padding: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
    lineHeight: 20,
  },
  titleDone: {
    textDecorationLine: "line-through",
    color: Colors.textSecondary,
  },
  notesPreview: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 4,
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
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
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
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
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
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyAddBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
  },
  sortOptionsList: {
    gap: 10,
  },
  sortOptionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: "transparent",
  },
  sortOptionItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  sortOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  sortOptionTextSelected: {
    color: Colors.primary,
    fontWeight: "700",
  },
  detailCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    maxHeight: "85%",
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailCategoryPill: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailCategoryText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
    lineHeight: 24,
  },
  detailNotesCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  detailNotesLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  detailNotesText: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  detailMetaGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  detailMetaBox: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    gap: 3,
  },
  detailMetaLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: "600",
    marginTop: 2,
  },
  detailMetaVal: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  statusSwitchLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  statusSwitchRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  statusSwitchPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusSwitchPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statusSwitchText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  statusSwitchTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  detailActionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailDeleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
  },
  detailDeleteText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#EF4444",
  },
  detailDoneBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  detailDoneText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
