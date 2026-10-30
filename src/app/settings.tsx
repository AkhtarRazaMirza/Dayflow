import Colors from "@/constants/Colors";
import { TaskPriority } from "@/constants/tasks";
import { useTasks } from "@/context/TaskContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type DailyGoalOption = 3 | 5 | 8 | 10;
type SortPreference = "Deadline" | "Priority" | "Newest";

const WORKSPACE_AVATARS = [
  { id: "sparkles", icon: "sparkles-outline", label: "Personal" },
  { id: "briefcase", icon: "briefcase-outline", label: "Work" },
  { id: "rocket", icon: "rocket-outline", label: "Startup" },
  { id: "color-palette", icon: "color-palette-outline", label: "Design" },
  { id: "code-slash", icon: "code-slash-outline", label: "Dev" },
  { id: "school", icon: "school-outline", label: "Study" },
];

const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tasks, updateTaskStatus, resetTasks, clearCompleted } = useTasks();

  // Profile / Workspace State
  const [workspaceName, setWorkspaceName] = useState("Personal Workspace");
  const [userRole, setUserRole] = useState("Productivity Lead");
  const [selectedAvatar, setSelectedAvatar] = useState("sparkles");
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [tempName, setTempName] = useState(workspaceName);
  const [tempRole, setTempRole] = useState(userRole);
  const [tempAvatar, setTempAvatar] = useState(selectedAvatar);

  // Productivity Preferences
  const [dailyGoal, setDailyGoal] = useState<DailyGoalOption>(5);
  const [defaultPriority, setDefaultPriority] = useState<TaskPriority>("Medium");
  const [defaultSort, setDefaultSort] = useState<SortPreference>("Deadline");

  // Notification & Feedback State
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyBriefingEnabled, setDailyBriefingEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Tips modal
  const [tipsModalVisible, setTipsModalVisible] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Task Statistics
  const statusCounts = useMemo(() => {
    return {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "To-do").length,
      inProgress: tasks.filter((t) => t.status === "In Progress").length,
      done: tasks.filter((t) => t.status === "Done").length,
    };
  }, [tasks]);

  const completedCount = statusCounts.done;
  const goalProgressPercent = Math.min(
    100,
    Math.round((completedCount / dailyGoal) * 100)
  );

  // Action: Save profile edit
  const handleSaveProfile = () => {
    if (!tempName.trim()) {
      Alert.alert("Invalid Name", "Workspace name cannot be empty.");
      return;
    }
    setWorkspaceName(tempName.trim());
    setUserRole(tempRole.trim() || "Member");
    setSelectedAvatar(tempAvatar);
    setEditProfileVisible(false);
    showToast("Workspace profile updated");
  };

  // Action: Export Task Summary
  const handleExportSummary = async () => {
    if (tasks.length === 0) {
      Alert.alert("No Tasks", "You have no tasks to export.");
      return;
    }

    const dateStr = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    let exportText = `📋 *${workspaceName} — Task Summary* (${dateStr})\n`;
    exportText += `Progress: ${completedCount}/${tasks.length} completed (${Math.round((completedCount / tasks.length) * 100)}%)\n\n`;

    tasks.forEach((t, idx) => {
      const statusEmoji =
        t.status === "Done" ? "✅" : t.status === "In Progress" ? "⏳" : "⭕";
      exportText += `${idx + 1}. ${statusEmoji} [${t.status}] ${t.title}\n`;
      exportText += `   Category: ${t.category} | Time: ${t.time}${t.priority ? ` | Priority: ${t.priority}` : ""}\n`;
      if (t.notes) exportText += `   Notes: ${t.notes}\n`;
    });

    try {
      await Share.share({
        message: exportText,
        title: `${workspaceName} Tasks`,
      });
      showToast("Tasks summary exported");
    } catch {
      showToast("Export cancelled");
    }
  };

  // Action: Mark All as Done
  const handleMarkAllDone = () => {
    const activeTasks = tasks.filter((t) => t.status !== "Done");
    if (activeTasks.length === 0) {
      Alert.alert("All Tasks Done", "All tasks are already marked completed!");
      return;
    }

    Alert.alert(
      "Complete All Tasks",
      `Are you sure you want to mark all ${activeTasks.length} active task(s) as Done?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark Done",
          style: "default",
          onPress: () => {
            activeTasks.forEach((t) => updateTaskStatus(t.id, "Done"));
            showToast(`Marked ${activeTasks.length} task(s) as Done`);
          },
        },
      ]
    );
  };

  // Action: Clear Completed
  const handleClearCompleted = () => {
    if (completedCount === 0) {
      Alert.alert("No Completed Tasks", "There are no completed tasks to clear.");
      return;
    }

    Alert.alert(
      "Clear Completed Tasks",
      `Are you sure you want to remove ${completedCount} completed task(s)? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            clearCompleted();
            showToast(`Cleared ${completedCount} completed task(s)`);
          },
        },
      ]
    );
  };

  // Action: Reset to Defaults
  const handleResetDefaults = () => {
    Alert.alert(
      "Reset All Tasks",
      "This will restore the original sample tasks and replace any custom tasks. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            resetTasks();
            showToast("Restored original sample tasks");
          },
        },
      ]
    );
  };

  const activeAvatarMeta =
    WORKSPACE_AVATARS.find((a) => a.id === selectedAvatar) ||
    WORKSPACE_AVATARS[0];

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

        <Text style={styles.headerTitle}>Settings</Text>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setTipsModalVisible(true)}
          activeOpacity={0.7}
          accessibilityLabel="Productivity tips"
        >
          <Ionicons
            name="help-circle-outline"
            size={22}
            color={Colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => {
            setTempName(workspaceName);
            setTempRole(userRole);
            setTempAvatar(selectedAvatar);
            setEditProfileVisible(true);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.avatar}>
            <Ionicons
              name={activeAvatarMeta.icon as any}
              size={24}
              color={Colors.primary}
            />
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {workspaceName}
            </Text>
            <View style={styles.profileSubtitleRow}>
              <View style={styles.statusBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.statusBadgeText}>Active</Text>
              </View>
              <Text style={styles.profileSubtitle} numberOfLines={1}>
                {userRole} • {tasks.length} tasks
              </Text>
            </View>
          </View>

          <View style={styles.editPillBtn}>
            <Ionicons name="create-outline" size={14} color={Colors.primary} />
            <Text style={styles.editPillText}>Edit</Text>
          </View>
        </TouchableOpacity>

        {/* Live Workspace Statistics Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{statusCounts.total}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: Colors.statusTodo }]}>
              {statusCounts.todo}
            </Text>
            <Text style={styles.statLabel}>To-do</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: Colors.statusInProgress }]}>
              {statusCounts.inProgress}
            </Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: Colors.statusDone }]}>
              {statusCounts.done}
            </Text>
            <Text style={styles.statLabel}>Done</Text>
          </View>
        </View>

        {/* Daily Goal & Productivity Section */}
        <Text style={styles.sectionHeader}>Daily Productivity Target</Text>
        <View style={styles.sectionCard}>
          <View style={styles.goalHeaderRow}>
            <View style={styles.settingLabelRow}>
              <Ionicons
                name="trophy-outline"
                size={20}
                color={Colors.primary}
              />
              <View>
                <Text style={styles.settingTitle}>Daily Completed Target</Text>
                <Text style={styles.actionSubtitle}>
                  {completedCount} of {dailyGoal} completed today ({goalProgressPercent}%)
                </Text>
              </View>
            </View>
          </View>

          {/* Goal Selector Segmented Row */}
          <View style={styles.segmentedRow}>
            {([3, 5, 8, 10] as DailyGoalOption[]).map((g) => {
              const isSelected = dailyGoal === g;
              return (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.segmentButton,
                    isSelected && styles.segmentButtonActive,
                  ]}
                  onPress={() => {
                    setDailyGoal(g);
                    showToast(`Daily target set to ${g} tasks`);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      isSelected && styles.segmentTextActive,
                    ]}
                  >
                    {g} Tasks
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Target Progress Bar */}
          <View style={styles.goalProgressTrack}>
            <View
              style={[
                styles.goalProgressFill,
                {
                  width: `${goalProgressPercent}%`,
                  backgroundColor:
                    goalProgressPercent === 100
                      ? Colors.statusDone
                      : Colors.primary,
                },
              ]}
            />
          </View>
        </View>

        {/* Workflow & Defaults Section */}
        <Text style={styles.sectionHeader}>Task Creation Defaults</Text>
        <View style={styles.sectionCard}>
          {/* Default Priority */}
          <View style={styles.settingRow}>
            <View style={styles.settingLabelRow}>
              <Ionicons
                name="flame-outline"
                size={20}
                color={Colors.primary}
              />
              <View>
                <Text style={styles.settingTitle}>Default Priority</Text>
                <Text style={styles.actionSubtitle}>
                  Initial urgency for newly created tasks
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.segmentedRow}>
            {(["High", "Medium", "Low"] as TaskPriority[]).map((p) => {
              const isSelected = defaultPriority === p;
              const color =
                p === "High"
                  ? "#EF4444"
                  : p === "Medium"
                    ? "#F59E0B"
                    : "#38BDF8";
              return (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.segmentButton,
                    isSelected && {
                      backgroundColor: `${color}22`,
                      borderColor: color,
                    },
                  ]}
                  onPress={() => {
                    setDefaultPriority(p);
                    showToast(`Default priority set to ${p}`);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      isSelected && { color, fontWeight: "700" },
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.divider} />

          {/* Default Sort Order */}
          <View style={styles.settingRow}>
            <View style={styles.settingLabelRow}>
              <Ionicons
                name="swap-vertical-outline"
                size={20}
                color={Colors.primary}
              />
              <View>
                <Text style={styles.settingTitle}>Default Sort Order</Text>
                <Text style={styles.actionSubtitle}>
                  Sorting applied across your task lists
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.segmentedRow}>
            {(["Deadline", "Priority", "Newest"] as SortPreference[]).map((s) => {
              const isSelected = defaultSort === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.segmentButton,
                    isSelected && styles.segmentButtonActive,
                  ]}
                  onPress={() => {
                    setDefaultSort(s);
                    showToast(`Default sort set to ${s}`);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      isSelected && styles.segmentTextActive,
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notifications & Micro-Interactions */}
        <Text style={styles.sectionHeader}>Alerts & Feedback</Text>
        <View style={styles.sectionCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelRow}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={Colors.primary}
              />
              <View style={styles.textWrap}>
                <Text style={styles.settingTitle}>Task Reminders</Text>
                <Text style={styles.actionSubtitle}>
                  Alert before upcoming deadlines
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(val) => {
                setNotificationsEnabled(val);
                showToast(val ? "Task reminders enabled" : "Task reminders disabled");
              }}
              trackColor={{ false: Colors.surfaceLight, true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLabelRow}>
              <Ionicons
                name="sunny-outline"
                size={20}
                color={Colors.primary}
              />
              <View style={styles.textWrap}>
                <Text style={styles.settingTitle}>Daily Morning Briefing</Text>
                <Text style={styles.actionSubtitle}>
                  Overview of today{"'"}s tasks at 09:00 AM
                </Text>
              </View>
            </View>
            <Switch
              value={dailyBriefingEnabled}
              onValueChange={(val) => {
                setDailyBriefingEnabled(val);
                showToast(val ? "Morning briefing enabled" : "Morning briefing disabled");
              }}
              trackColor={{ false: Colors.surfaceLight, true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLabelRow}>
              <Ionicons
                name="hardware-chip-outline"
                size={20}
                color={Colors.primary}
              />
              <View style={styles.textWrap}>
                <Text style={styles.settingTitle}>Haptic Feedback</Text>
                <Text style={styles.actionSubtitle}>
                  Vibrations on status changes and completions
                </Text>
              </View>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={(val) => {
                setHapticsEnabled(val);
                showToast(val ? "Haptics enabled" : "Haptics disabled");
              }}
              trackColor={{ false: Colors.surfaceLight, true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLabelRow}>
              <Ionicons
                name="volume-medium-outline"
                size={20}
                color={Colors.primary}
              />
              <View style={styles.textWrap}>
                <Text style={styles.settingTitle}>Sound Effects</Text>
                <Text style={styles.actionSubtitle}>
                  Audio chime when marking task done
                </Text>
              </View>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={(val) => {
                setSoundEnabled(val);
                showToast(val ? "Sound effects enabled" : "Sound effects disabled");
              }}
              trackColor={{ false: Colors.surfaceLight, true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Task Management & Bulk Actions */}
        <Text style={styles.sectionHeader}>Data & Actions</Text>
        <View style={styles.sectionCard}>
          {/* Export Tasks Summary */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleExportSummary}
            activeOpacity={0.7}
          >
            <View style={styles.settingLabelRow}>
              <Ionicons
                name="share-outline"
                size={20}
                color={Colors.primary}
              />
              <View style={styles.textWrap}>
                <Text style={styles.settingTitle}>Export Tasks Summary</Text>
                <Text style={styles.actionSubtitle}>
                  Share or backup your current task list
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Mark All as Done */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleMarkAllDone}
            activeOpacity={0.7}
          >
            <View style={styles.settingLabelRow}>
              <Ionicons
                name="checkmark-done-circle-outline"
                size={20}
                color={Colors.statusDone}
              />
              <View style={styles.textWrap}>
                <Text style={styles.settingTitle}>Mark All as Done</Text>
                <Text style={styles.actionSubtitle}>
                  Quickly complete all active tasks
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Clear Completed Tasks */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleClearCompleted}
            activeOpacity={0.7}
          >
            <View style={styles.settingLabelRow}>
              <Ionicons
                name="trash-bin-outline"
                size={20}
                color={Colors.statusInProgress}
              />
              <View style={styles.textWrap}>
                <Text style={styles.settingTitle}>Clear Completed Tasks</Text>
                <Text style={styles.actionSubtitle}>
                  {completedCount} task(s) marked done
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Reset to Defaults */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleResetDefaults}
            activeOpacity={0.7}
          >
            <View style={styles.settingLabelRow}>
              <Ionicons
                name="refresh-outline"
                size={20}
                color="#EF4444"
              />
              <View style={styles.textWrap}>
                <Text style={[styles.settingTitle, { color: "#EF4444" }]}>
                  Reset to Defaults
                </Text>
                <Text style={styles.actionSubtitle}>
                  Restore original 4 sample tasks
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* App Info Section */}
        <Text style={styles.sectionHeader}>About Dayflow</Text>
        <View style={styles.sectionCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Application</Text>
            <Text style={styles.infoValue}>Dayflow</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0 (Build 2026)</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Storage Privacy</Text>
            <View style={styles.privacyTag}>
              <Ionicons name="shield-checkmark" size={12} color={Colors.statusDone} />
              <Text style={styles.privacyTagText}>100% On-Device</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Engine</Text>
            <Text style={styles.infoValue}>Expo SDK 58 • React 19</Text>
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editProfileVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditProfileVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setEditProfileVisible(false)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Workspace Profile</Text>
              <TouchableOpacity
                onPress={() => setEditProfileVisible(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Avatar Selector */}
            <Text style={styles.inputLabel}>CHOOSE AVATAR ICON</Text>
            <View style={styles.avatarPickerRow}>
              {WORKSPACE_AVATARS.map((av) => {
                const isSelected = tempAvatar === av.id;
                return (
                  <TouchableOpacity
                    key={av.id}
                    style={[
                      styles.avatarOption,
                      isSelected && styles.avatarOptionSelected,
                    ]}
                    onPress={() => setTempAvatar(av.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={av.icon as any}
                      size={20}
                      color={isSelected ? "#FFFFFF" : Colors.textSecondary}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Workspace Name Input */}
            <Text style={styles.inputLabel}>WORKSPACE NAME</Text>
            <TextInput
              style={styles.textInput}
              value={tempName}
              onChangeText={setTempName}
              placeholder="e.g. My Workspace"
              placeholderTextColor={Colors.textSecondary}
              maxLength={32}
            />

            {/* Role / Tagline Input */}
            <Text style={styles.inputLabel}>YOUR ROLE / TAGLINE</Text>
            <TextInput
              style={styles.textInput}
              value={tempRole}
              onChangeText={setTempRole}
              placeholder="e.g. Lead Designer"
              placeholderTextColor={Colors.textSecondary}
              maxLength={32}
            />

            {/* Modal Buttons */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditProfileVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveProfile}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Productivity Tips Modal */}
      <Modal
        visible={tipsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTipsModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setTipsModalVisible(false)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={styles.tipHeaderTitleRow}>
                <Ionicons name="sparkles" size={18} color={Colors.primary} />
                <Text style={styles.modalTitle}>Dayflow Productivity Tips</Text>
              </View>
              <TouchableOpacity
                onPress={() => setTipsModalVisible(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <View style={styles.tipIconBox}>
                  <Ionicons name="time" size={16} color={Colors.primary} />
                </View>
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>Realtime Countdown Progress</Text>
                  <Text style={styles.tipDesc}>
                    Every task has a live deadline ticker that shows exact remaining hours and turns amber/red as the deadline nears.
                  </Text>
                </View>
              </View>

              <View style={styles.tipItem}>
                <View style={styles.tipIconBox}>
                  <Ionicons name="swap-vertical" size={16} color={Colors.statusInProgress} />
                </View>
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>Quick Status Toggle</Text>
                  <Text style={styles.tipDesc}>
                    Tap the checkbox on any card to transition from To-do → In Progress → Done instantly.
                  </Text>
                </View>
              </View>

              <View style={styles.tipItem}>
                <View style={styles.tipIconBox}>
                  <Ionicons name="options" size={16} color={Colors.statusTodo} />
                </View>
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>Sort by Urgency</Text>
                  <Text style={styles.tipDesc}>
                    Use the sort button on All Tasks to order by impending deadlines or priority level.
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.tipDoneBtn}
              onPress={() => setTipsModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.tipDoneText}>Got It</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default SettingsScreen;

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
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  toastContainer: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    zIndex: 999,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  profileSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.statusDone,
  },
  profileSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(74, 222, 128, 0.15)",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.statusDone,
  },
  editPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    alignItems: "center",
  },
  statNum: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 22,
  },
  goalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingBottom: 8,
  },
  segmentedRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 10,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  segmentButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  goalProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceLight,
    overflow: "hidden",
    marginTop: 4,
    marginBottom: 12,
  },
  goalProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  settingLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  textWrap: {
    flex: 1,
    marginRight: 8,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  actionSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  privacyTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(74, 222, 128, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  privacyTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.statusDone,
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
  tipHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  avatarPickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  avatarOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  textInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 14,
    marginBottom: 16,
  },
  modalActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  modalSaveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  tipsList: {
    gap: 14,
    marginBottom: 20,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  tipIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  tipDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  tipDoneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  tipDoneText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
