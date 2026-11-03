import DateSelector, { formatDateKey } from "@/components/DateSelector";
import FilterTabs from "@/components/FilterTabs";
import Header from "@/components/Header";
import TaskCard from "@/components/TaskCard";
import WatchWidget from "@/components/WatchWidget";
import Colors from "@/constants/Colors";
import { FilterOptions, Task, TaskPriority, TaskStatus } from "@/constants/tasks";
import { useTasks } from "@/context/TaskContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

const Index = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    tasks,
    isLoaded,
    toggleTaskStatus,
    updateTaskStatus,
    deleteTask,
    toggleSubtask,
    activeFocusTaskId,
    focusRemainingSeconds,
    focusInitialSeconds,
    isFocusRunning,
    startFocusSession,
    pauseFocusSession,
    resumeFocusSession,
    stopFocusSession,
  } = useTasks();

  const [activeFilter, setActiveFilter] = useState<FilterOptions>("All");
  const todayKey = useMemo(() => formatDateKey(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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

  const handleDeleteTask = (task: Task) => {
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
            if (selectedTask?.id === task.id) {
              setSelectedTask(null);
            }
            showToast(`Deleted "${task.title}"`);
          },
        },
      ]
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  // Filter tasks belonging to the selected date
  const dateScopedTasks = useMemo(() => {
    return tasks.filter((t) => {
      const taskDate = t.date || todayKey;
      return taskDate === selectedDate;
    });
  }, [tasks, selectedDate, todayKey]);

  // Filter counts for tabs on selected date
  const filterCounts = useMemo<Record<FilterOptions, number>>(() => {
    return {
      All: dateScopedTasks.length,
      "To do": dateScopedTasks.filter((t) => t.status === "To-do").length,
      "In Progress": dateScopedTasks.filter((t) => t.status === "In Progress")
        .length,
      Completed: dateScopedTasks.filter((t) => t.status === "Done").length,
    };
  }, [dateScopedTasks]);

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

  // Dynamic schedule section heading
  const scheduleTitle = useMemo(() => {
    if (selectedDate === todayKey) return "Today's Schedule";
    const now = new Date();
    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    if (selectedDate === formatDateKey(tomorrow)) return "Tomorrow's Schedule";
    return `${headerTitle.replace(" Tasks", "")} Schedule`;
  }, [selectedDate, todayKey, headerTitle]);

  // Filtered tasks based on active filter tab and search query
  const filteredTasks = useMemo(() => {
    return dateScopedTasks.filter((task) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.notes &&
          task.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeFilter === "All") return true;
      if (activeFilter === "To do") return task.status === "To-do";
      if (activeFilter === "In Progress") return task.status === "In Progress";
      if (activeFilter === "Completed") return task.status === "Done";
      return true;
    });
  }, [dateScopedTasks, activeFilter, searchQuery]);

  // Active focus task object
  const activeFocusTask = useMemo(() => {
    if (!activeFocusTaskId) return null;
    return tasks.find((t) => t.id === activeFocusTaskId) || null;
  }, [tasks, activeFocusTaskId]);

  // Active modal task synced with tasks state
  const modalTask = useMemo(() => {
    if (!selectedTask) return null;
    return tasks.find((t) => t.id === selectedTask.id) || selectedTask;
  }, [tasks, selectedTask]);

  // Format focus time remaining
  const focusMinutes = String(Math.floor(focusRemainingSeconds / 60)).padStart(
    2,
    "0"
  );
  const focusSeconds = String(focusRemainingSeconds % 60).padStart(2, "0");
  const focusProgress =
    focusInitialSeconds > 0
      ? 1 - focusRemainingSeconds / focusInitialSeconds
      : 0;

  if (!isLoaded) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading tasks from storage...</Text>
      </View>
    );
  }

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
            onPress={() => setSelectedTask(item)}
            onToggleStatus={() => handleToggleTask(item)}
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

            {/* Active Focus Session Banner */}
            {activeFocusTask && (
              <View style={styles.focusBanner}>
                <View style={styles.focusBannerHeader}>
                  <View style={styles.focusHeaderLeft}>
                    <View style={styles.focusPulseBadge}>
                      <Ionicons name="flame" size={13} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text style={styles.focusBannerTitle} numberOfLines={1}>
                        Focus Session: {activeFocusTask.title}
                      </Text>
                      <Text style={styles.focusBannerSubtitle}>
                        {activeFocusTask.category}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.focusTimerText}>
                    {focusMinutes}:{focusSeconds}
                  </Text>
                </View>

                {/* Focus Progress Track */}
                <View style={styles.focusTrack}>
                  <View
                    style={[
                      styles.focusFill,
                      { width: `${Math.round(focusProgress * 100)}%` },
                    ]}
                  />
                </View>

                {/* Focus Controls */}
                <View style={styles.focusControlsRow}>
                  <TouchableOpacity
                    style={styles.focusControlBtn}
                    onPress={() => {
                      if (isFocusRunning) {
                        pauseFocusSession();
                        showToast("Focus paused");
                      } else {
                        resumeFocusSession();
                        showToast("Focus resumed");
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isFocusRunning ? "pause" : "play"}
                      size={14}
                      color={Colors.primary}
                    />
                    <Text style={styles.focusControlText}>
                      {isFocusRunning ? "Pause" : "Resume"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.focusCompleteBtn}
                    onPress={() => {
                      updateTaskStatus(activeFocusTask.id, "Done");
                      stopFocusSession();
                      showToast(`Completed focus session for "${activeFocusTask.title}"! 🎉`);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="checkmark-done" size={14} color="#FFFFFF" />
                    <Text style={styles.focusCompleteText}>Finish Task</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.focusStopBtn}
                    onPress={() => {
                      stopFocusSession();
                      showToast("Focus session ended");
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={14} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Live Watch & Daily Progress Widget */}
            <WatchWidget />

            {/* Realtime Date Selector */}
            <DateSelector
              selectedDate={selectedDate}
              onSelectDate={(newDate) => {
                setSelectedDate(newDate);
                setActiveFilter("All");
              }}
            />

            {/* Filter Tabs with real counts */}
            <FilterTabs
              selected={activeFilter}
              onSelect={setActiveFilter}
              counts={filterCounts}
            />

            {/* Inline Quick Search Field when opened */}
            {isSearchOpen && (
              <View style={styles.inlineSearchContainer}>
                <Ionicons name="search" size={16} color={Colors.textSecondary} />
                <TextInput
                  style={styles.inlineSearchInput}
                  placeholder="Filter schedule by keyword..."
                  placeholderTextColor={Colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={Colors.textSecondary}
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Tasks Section Header with Search Toggle & Quick Add Button */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Text style={styles.sectionTitle}>{scheduleTitle}</Text>
                <View style={styles.taskCountBadge}>
                  <Text style={styles.taskCountText}>
                    {filteredTasks.length}{" "}
                    {filteredTasks.length === 1 ? "task" : "tasks"}
                  </Text>
                </View>
              </View>

              <View style={styles.sectionHeaderActions}>
                <TouchableOpacity
                  style={[
                    styles.searchToggleBtn,
                    isSearchOpen && styles.searchToggleBtnActive,
                  ]}
                  onPress={() => {
                    if (isSearchOpen && searchQuery) {
                      setSearchQuery("");
                    }
                    setIsSearchOpen(!isSearchOpen);
                  }}
                  activeOpacity={0.7}
                  accessibilityLabel="Search tasks"
                >
                  <Ionicons
                    name={isSearchOpen ? "close" : "search-outline"}
                    size={16}
                    color={isSearchOpen ? Colors.primary : Colors.textSecondary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickAddButton}
                  onPress={() => router.push("/create")}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={15} color={Colors.primary} />
                  <Text style={styles.quickAddText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name="calendar-outline"
                size={32}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery
                ? "No matching tasks found"
                : `No tasks for ${headerTitle.replace(" Tasks", "")}`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? "Try searching for a different keyword or category."
                : `You have no tasks scheduled for this date under "${activeFilter}".`}
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push("/create")}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Schedule New Task</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Task Details & Action Bottom Modal */}
      {modalTask && (
        <Modal
          visible={!!modalTask}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedTask(null)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setSelectedTask(null)}
          >
            <Pressable
              style={styles.detailCard}
              onPress={(e) => e.stopPropagation()}
            >
              {/* Modal Top Bar */}
              <View style={styles.detailHeader}>
                <View style={styles.detailCategoryGroup}>
                  <View style={styles.detailCategoryPill}>
                    <Text style={styles.detailCategoryText}>
                      {modalTask.category}
                    </Text>
                  </View>

                  {modalTask.priority && (
                    <View
                      style={[
                        styles.detailPriorityPill,
                        {
                          backgroundColor:
                            PRIORITY_META[modalTask.priority].bg,
                        },
                      ]}
                    >
                      <Ionicons
                        name={PRIORITY_META[modalTask.priority].icon}
                        size={10}
                        color={PRIORITY_META[modalTask.priority].color}
                      />
                      <Text
                        style={[
                          styles.detailPriorityText,
                          {
                            color:
                              PRIORITY_META[modalTask.priority].color,
                          },
                        ]}
                      >
                        {modalTask.priority}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => setSelectedTask(null)}
                  style={styles.modalCloseBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.detailTitle}>{modalTask.title}</Text>

              {/* Optional Notes */}
              {modalTask.notes ? (
                <View style={styles.detailNotesCard}>
                  <Text style={styles.detailNotesLabel}>NOTES</Text>
                  <Text style={styles.detailNotesText}>
                    {modalTask.notes}
                  </Text>
                </View>
              ) : null}

              {/* Interactive Subtasks Checklist */}
              {modalTask.subtasks && modalTask.subtasks.length > 0 && (
                <View style={styles.subtasksCard}>
                  <View style={styles.subtasksCardHeader}>
                    <Text style={styles.subtasksCardLabel}>
                      SUBTASKS (
                      {modalTask.subtasks.filter((s) => s.completed).length}/
                      {modalTask.subtasks.length})
                    </Text>
                  </View>

                  <View style={styles.subtasksItemsList}>
                    {modalTask.subtasks.map((st) => (
                      <TouchableOpacity
                        key={st.id}
                        style={styles.subtaskItemRow}
                        onPress={() => toggleSubtask(modalTask.id, st.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={
                            st.completed
                              ? "checkbox"
                              : "square-outline"
                          }
                          size={18}
                          color={
                            st.completed
                              ? Colors.statusDone
                              : Colors.textSecondary
                          }
                        />
                        <Text
                          style={[
                            styles.subtaskItemText,
                            st.completed && styles.subtaskItemTextCompleted,
                          ]}
                          numberOfLines={1}
                        >
                          {st.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Meta Grid */}
              <View style={styles.detailMetaGrid}>
                <View style={styles.detailMetaBox}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={Colors.primary}
                  />
                  <Text style={styles.detailMetaLabel}>Time</Text>
                  <Text style={styles.detailMetaVal}>{modalTask.time}</Text>
                </View>

                <View style={styles.detailMetaBox}>
                  <Ionicons
                    name="hourglass-outline"
                    size={16}
                    color={Colors.statusInProgress}
                  />
                  <Text style={styles.detailMetaLabel}>Deadline</Text>
                  <Text style={styles.detailMetaVal}>
                    {modalTask.deadline || modalTask.time}
                  </Text>
                </View>

                {modalTask.estimatedDuration && (
                  <View style={styles.detailMetaBox}>
                    <Ionicons
                      name="timer-outline"
                      size={16}
                      color={Colors.statusTodo}
                    />
                    <Text style={styles.detailMetaLabel}>Estimate</Text>
                    <Text style={styles.detailMetaVal}>
                      {modalTask.estimatedDuration}
                    </Text>
                  </View>
                )}
              </View>

              {/* Focus Session Trigger Button */}
              <TouchableOpacity
                style={styles.detailFocusBtn}
                onPress={() => {
                  startFocusSession(modalTask.id, 25);
                  setSelectedTask(null);
                  showToast(`Started 25m focus session for "${modalTask.title}"!`);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="flame" size={16} color="#FFFFFF" />
                <Text style={styles.detailFocusBtnText}>
                  Start 25m Focus Session
                </Text>
              </TouchableOpacity>

              {/* Status Switcher Buttons */}
              <Text style={styles.statusSwitchLabel}>Update Status</Text>
              <View style={styles.statusSwitchRow}>
                {(["To-do", "In Progress", "Done"] as TaskStatus[]).map(
                  (s) => {
                    const isSelected = modalTask.status === s;
                    return (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.statusSwitchPill,
                          isSelected && styles.statusSwitchPillActive,
                        ]}
                        onPress={() => {
                          updateTaskStatus(modalTask.id, s);
                          showToast(`Updated status to ${s}`);
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
                  onPress={() => handleDeleteTask(modalTask)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <Text style={styles.detailDeleteText}>Delete Task</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.detailDoneBtn}
                  onPress={() => setSelectedTask(null)}
                  activeOpacity={0.8}
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

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  list: {
    paddingBottom: 28,
  },
  toastContainer: {
    position: "absolute",
    top: 55,
    left: 20,
    right: 20,
    zIndex: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  focusBanner: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  focusBannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  focusHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 12,
  },
  focusPulseBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  focusBannerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  focusBannerSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  focusTimerText: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.primary,
    fontVariant: ["tabular-nums"],
  },
  focusTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceLight,
    overflow: "hidden",
    marginBottom: 10,
  },
  focusFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  focusControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  focusControlBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  focusControlText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
  },
  focusCompleteBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    borderRadius: 8,
  },
  focusCompleteText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  focusStopBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
  },
  inlineSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 20,
    marginBottom: 8,
    gap: 8,
  },
  inlineSearchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
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
  sectionHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  searchToggleBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  quickAddButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    paddingHorizontal: 20,
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
  detailCategoryGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
  detailPriorityPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailPriorityText: {
    fontSize: 10,
    fontWeight: "700",
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 14,
  },
  detailNotesLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  detailNotesText: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  subtasksCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  subtasksCardHeader: {
    marginBottom: 8,
  },
  subtasksCardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  subtasksItemsList: {
    gap: 8,
  },
  subtaskItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  subtaskItemText: {
    fontSize: 13,
    color: Colors.textPrimary,
    flex: 1,
  },
  subtaskItemTextCompleted: {
    textDecorationLine: "line-through",
    color: Colors.textSecondary,
  },
  detailMetaGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
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
  detailFocusBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  detailFocusBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  statusSwitchLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusSwitchRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
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
    backgroundColor: Colors.surfaceLight,
  },
  detailDoneText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
});
