import Colors from "@/constants/Colors";
import { SubTask, TaskIcon, TaskPriority, TaskStatus } from "@/constants/tasks";
import { useTasks } from "@/context/TaskContext";
import { getDeadlineProgress } from "@/utils/deadline";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ICON_OPTIONS: TaskIcon[] = [
  { name: "grid", backgroundColor: "#FF6B8A" },
  { name: "arrow-down-circle", backgroundColor: "#4ADE80" },
  { name: "bookmark", backgroundColor: "#FBBF24" },
  { name: "checkmark-circle", backgroundColor: "#38BDF8" },
  { name: "star", backgroundColor: "#A855F7" },
  { name: "time", backgroundColor: "#F97316" },
  { name: "code-slash", backgroundColor: "#06B6D4" },
  { name: "briefcase", backgroundColor: "#EC4899" },
  { name: "cart", backgroundColor: "#84CC16" },
  { name: "fitness", backgroundColor: "#E11D48" },
];

const PRESET_CATEGORIES = [
  "Work",
  "Personal",
  "Design",
  "Development",
  "Health",
  "Study",
];

const QUICK_TEMPLATES = [
  {
    title: "Weekly Planning & Team Sync",
    category: "Work",
    time: "10:00 AM",
    deadline: "11:00 AM",
    priority: "High" as TaskPriority,
    duration: "1h",
    icon: ICON_OPTIONS[7],
    subtasks: [
      { id: "1", title: "Review top objectives for the week", completed: false },
      { id: "2", title: "Sync with stakeholders & align dates", completed: false },
    ],
  },
  {
    title: "Deep Work Focus Block",
    category: "Development",
    time: "02:00 PM",
    deadline: "04:00 PM",
    priority: "High" as TaskPriority,
    duration: "2h",
    icon: ICON_OPTIONS[6],
    subtasks: [
      { id: "1", title: "Mute non-essential notifications", completed: false },
      { id: "2", title: "Execute core feature implementation", completed: false },
    ],
  },
  {
    title: "UI / UX Design Polish",
    category: "Design",
    time: "04:30 PM",
    deadline: "05:30 PM",
    priority: "Medium" as TaskPriority,
    duration: "1h",
    icon: ICON_OPTIONS[0],
    subtasks: [
      { id: "1", title: "Check typography hierarchy & margins", completed: false },
      { id: "2", title: "Verify high contrast dark theme colors", completed: false },
    ],
  },
  {
    title: "Workout & Wellness Session",
    category: "Health",
    time: "06:30 PM",
    deadline: "07:30 PM",
    priority: "Low" as TaskPriority,
    duration: "45m",
    icon: ICON_OPTIONS[9],
    subtasks: [
      { id: "1", title: "Warm up & cardio exercise", completed: false },
      { id: "2", title: "Core recovery stretching", completed: false },
    ],
  },
];

const PRESET_TIMES = [
  "09:00 AM",
  "11:00 AM",
  "01:00 PM",
  "03:00 PM",
  "05:00 PM",
  "07:00 PM",
  "09:00 PM",
];

const DURATION_PRESETS = ["15m", "30m", "45m", "1h", "1h 30m", "2h"];

const STATUS_OPTIONS: TaskStatus[] = ["To-do", "In Progress", "Done"];

const PRIORITY_CONFIG: Record<
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

const formatDateKey = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const generateDatePresets = () => {
  const now = new Date();
  const items = [];
  for (let i = 0; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const key = formatDateKey(d);
    let label = "";
    if (i === 0) label = "Today";
    else if (i === 1) label = "Tomorrow";
    else
      label = `${d.toLocaleDateString("en-US", { weekday: "short" })}, ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    items.push({ key, label });
  }
  return items;
};

const getRelativeTimeString = (hoursAhead: number): string => {
  const d = new Date();
  d.setHours(d.getHours() + hoursAhead);
  let hours = d.getHours();
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${String(hours).padStart(2, "0")}:${minutes} ${period}`;
};

const CreateTask = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addTask } = useTasks();

  const datePresets = useMemo(() => generateDatePresets(), []);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState(PRESET_CATEGORIES[0]);
  const [selectedDate, setSelectedDate] = useState(datePresets[0].key);
  const [time, setTime] = useState(PRESET_TIMES[0]);
  const [deadline, setDeadline] = useState(PRESET_TIMES[2]);
  const [priority, setPriority] = useState<TaskPriority>("High");
  const [status, setStatus] = useState<TaskStatus>("To-do");
  const [duration, setDuration] = useState("45m");
  const [selectedIcon, setSelectedIcon] = useState<TaskIcon>(ICON_OPTIONS[0]);

  // Subtasks list state
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [subtaskInput, setSubtaskInput] = useState("");

  const [previewCreatedTime] = useState(() => Date.now() - 45 * 60 * 1000);

  const handleApplyTemplate = (tpl: (typeof QUICK_TEMPLATES)[0]) => {
    setTitle(tpl.title);
    setCategory(tpl.category);
    setTime(tpl.time);
    setDeadline(tpl.deadline);
    setPriority(tpl.priority);
    setDuration(tpl.duration);
    setSelectedIcon(tpl.icon);
    setSubtasks(tpl.subtasks || []);
  };

  const handleAddSubtask = () => {
    if (!subtaskInput.trim()) return;
    const newSt: SubTask = {
      id: Date.now().toString(),
      title: subtaskInput.trim(),
      completed: false,
    };
    setSubtasks((prev) => [...prev, newSt]);
    setSubtaskInput("");
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((st) => st.id !== id));
  };

  const handleReset = () => {
    setTitle("");
    setNotes("");
    setCategory(PRESET_CATEGORIES[0]);
    setSelectedDate(datePresets[0].key);
    setTime(PRESET_TIMES[0]);
    setDeadline(PRESET_TIMES[2]);
    setPriority("High");
    setStatus("To-do");
    setDuration("45m");
    setSelectedIcon(ICON_OPTIONS[0]);
    setSubtasks([]);
    setSubtaskInput("");
  };

  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert("Missing Title", "Please enter a title for your task.");
      return;
    }

    if (!category.trim()) {
      Alert.alert("Missing Category", "Please enter or select a category.");
      return;
    }

    const finalDeadline = deadline.trim() || time;

    addTask({
      title: title.trim(),
      category: category.trim(),
      date: selectedDate,
      time,
      deadline: finalDeadline,
      createdAt: Date.now(),
      status,
      icon: selectedIcon,
      priority,
      estimatedDuration: duration,
      notes: notes.trim() || undefined,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
    });

    handleReset();
    router.push("/");
  };

  // Realtime preview calculation
  const previewTask = useMemo(() => {
    return {
      id: "preview",
      title: title.trim() || "Task Title Preview",
      category: category.trim() || "Category Name",
      date: selectedDate,
      time,
      deadline: deadline.trim() || time,
      createdAt: previewCreatedTime,
      status,
      icon: selectedIcon,
      priority,
      estimatedDuration: duration,
      subtasks,
    };
  }, [
    title,
    category,
    selectedDate,
    time,
    deadline,
    status,
    selectedIcon,
    priority,
    duration,
    subtasks,
    previewCreatedTime,
  ]);

  const previewDeadline = useMemo(() => {
    return getDeadlineProgress(previewTask);
  }, [previewTask]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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

        <Text style={styles.headerTitle}>Create Task</Text>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleReset}
          activeOpacity={0.7}
        >
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Live Card Preview Hero */}
        <View style={styles.previewSection}>
          <View style={styles.previewHeaderRow}>
            <Text style={styles.previewLabel}>Live Card Preview</Text>
            <View style={styles.previewLivePill}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveText}>Interactive</Text>
            </View>
          </View>

          <View style={styles.previewCard}>
            <View style={styles.previewTopRow}>
              <View style={styles.previewLeft}>
                <View style={styles.previewCategoryPill}>
                  <Text style={styles.previewCategoryText} numberOfLines={1}>
                    {previewTask.category}
                  </Text>
                </View>

                {/* Priority Tag */}
                <View
                  style={[
                    styles.priorityTag,
                    { backgroundColor: PRIORITY_CONFIG[priority].bg },
                  ]}
                >
                  <Ionicons
                    name={PRIORITY_CONFIG[priority].icon}
                    size={11}
                    color={PRIORITY_CONFIG[priority].color}
                  />
                  <Text
                    style={[
                      styles.priorityTagText,
                      { color: PRIORITY_CONFIG[priority].color },
                    ]}
                  >
                    {priority}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.previewIconBadge,
                  { backgroundColor: selectedIcon.backgroundColor },
                ]}
              >
                <Ionicons
                  name={selectedIcon.name as any}
                  size={18}
                  color="#FFFFFF"
                />
              </View>
            </View>

            <Text style={styles.previewTitle} numberOfLines={2}>
              {previewTask.title}
            </Text>

            {notes ? (
              <Text style={styles.previewNotes} numberOfLines={1}>
                {notes}
              </Text>
            ) : null}

            {subtasks.length > 0 && (
              <View style={styles.previewSubtasksStrip}>
                <Ionicons
                  name="checkbox-outline"
                  size={11}
                  color={Colors.primary}
                />
                <Text style={styles.previewSubtasksText}>
                  {subtasks.length} subtask{subtasks.length === 1 ? "" : "s"} planned
                </Text>
              </View>
            )}

            <View style={styles.previewFooterRow}>
              <View style={styles.timeGroup}>
                <View style={styles.timeRow}>
                  <Ionicons
                    name="time-outline"
                    size={13}
                    color={Colors.primary}
                  />
                  <Text style={styles.previewTime}>{previewTask.time}</Text>
                </View>

                <View style={styles.previewDurationPill}>
                  <Ionicons
                    name="hourglass-outline"
                    size={10}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.previewDurationText}>{duration}</Text>
                </View>
              </View>

              <View style={styles.previewStatusPill}>
                <Text style={styles.previewStatusText}>
                  {previewTask.status}
                </Text>
              </View>
            </View>

            {/* Deadline Progress Bar Preview */}
            <View style={styles.previewDeadlineSection}>
              <View style={styles.previewDeadlineMeta}>
                <View style={styles.previewDeadlineLeft}>
                  <Ionicons
                    name={
                      previewDeadline.isDone
                        ? "checkmark-circle"
                        : "hourglass-outline"
                    }
                    size={11}
                    color={previewDeadline.color}
                  />
                  <Text
                    style={[
                      styles.previewDeadlineLabel,
                      { color: previewDeadline.color },
                    ]}
                  >
                    {previewDeadline.label}
                  </Text>
                </View>
                <Text style={styles.previewDeadlinePercent}>
                  {previewDeadline.percent}%
                </Text>
              </View>

              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${previewDeadline.percent}%`,
                      backgroundColor: previewDeadline.color,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Quick Fast-Fill Templates */}
        <View style={styles.fieldGroup}>
          <Text style={styles.sectionLabel}>Quick Templates</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.templateChipsRow}
          >
            {QUICK_TEMPLATES.map((tpl) => (
              <TouchableOpacity
                key={tpl.title}
                style={styles.templateChip}
                onPress={() => handleApplyTemplate(tpl)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.templateDot,
                    { backgroundColor: tpl.icon.backgroundColor },
                  ]}
                />
                <Text style={styles.templateText}>{tpl.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Task Title */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Task Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Wireframe Interaction Flow"
            placeholderTextColor={Colors.textSecondary}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Optional Notes / Description */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelWithHintRow}>
            <Text style={styles.label}>Notes / Description</Text>
            <Text style={styles.labelHint}>Optional</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Key deliverables, design links, or reminders..."
            placeholderTextColor={Colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Scheduled Date Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Scheduled Date</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {datePresets.map((dp) => {
              const isSelected = selectedDate === dp.key;
              return (
                <TouchableOpacity
                  key={dp.key}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => setSelectedDate(dp.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={13}
                    color={isSelected ? "#FFFFFF" : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                    ]}
                  >
                    {dp.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Subtasks / Checklist Builder */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelWithHintRow}>
            <Text style={styles.label}>Subtasks & Deliverables</Text>
            <Text style={styles.labelHint}>{subtasks.length} added</Text>
          </View>

          <View style={styles.subtaskInputRow}>
            <TextInput
              style={styles.subtaskTextInput}
              placeholder="Add actionable subtask step..."
              placeholderTextColor={Colors.textSecondary}
              value={subtaskInput}
              onChangeText={setSubtaskInput}
              onSubmitEditing={handleAddSubtask}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={styles.subtaskAddBtn}
              onPress={handleAddSubtask}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {subtasks.length > 0 && (
            <View style={styles.subtasksListContainer}>
              {subtasks.map((st, idx) => (
                <View key={st.id} style={styles.subtaskRow}>
                  <View style={styles.subtaskRowLeft}>
                    <Text style={styles.subtaskNumber}>{idx + 1}.</Text>
                    <Text style={styles.subtaskTitle} numberOfLines={1}>
                      {st.title}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveSubtask(st.id)}
                    style={styles.subtaskDeleteBtn}
                  >
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={Colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Category Input & Quick Presets */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Category</Text>
          <TextInput
            style={styles.input}
            placeholder="Select or enter category"
            placeholderTextColor={Colors.textSecondary}
            value={category}
            onChangeText={setCategory}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {PRESET_CATEGORIES.map((cat) => {
              const isSelected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Priority Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Priority Level</Text>
          <View style={styles.priorityRow}>
            {(["High", "Medium", "Low"] as TaskPriority[]).map((p) => {
              const isSelected = priority === p;
              const cfg = PRIORITY_CONFIG[p];
              return (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityPill,
                    isSelected && {
                      backgroundColor: cfg.bg,
                      borderColor: cfg.color,
                    },
                  ]}
                  onPress={() => setPriority(p)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={cfg.icon}
                    size={15}
                    color={isSelected ? cfg.color : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.priorityPillText,
                      isSelected && { color: cfg.color, fontWeight: "700" },
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Estimated Duration Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Estimated Duration</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {DURATION_PRESETS.map((d) => {
              const isSelected = duration === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => setDuration(d)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="hourglass-outline"
                    size={13}
                    color={isSelected ? "#FFFFFF" : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                    ]}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Scheduled Start Time Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Scheduled Start Time</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {PRESET_TIMES.map((t) => {
              const isSelected = time === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => setTime(t)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={isSelected ? "#FFFFFF" : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Task Deadline Selector */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelWithHintRow}>
            <Text style={styles.label}>Task Deadline</Text>
            <Text style={styles.labelHint}>Progress fills as deadline nears</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="e.g., 05:00 PM"
            placeholderTextColor={Colors.textSecondary}
            value={deadline}
            onChangeText={setDeadline}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {[
              { label: "+1 Hour", value: getRelativeTimeString(1) },
              { label: "+2 Hours", value: getRelativeTimeString(2) },
              { label: "+4 Hours", value: getRelativeTimeString(4) },
              { label: "05:00 PM", value: "05:00 PM" },
              { label: "08:00 PM", value: "08:00 PM" },
              { label: "10:00 PM", value: "10:00 PM" },
            ].map((preset) => {
              const isSelected = deadline === preset.value;
              return (
                <TouchableOpacity
                  key={preset.label}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => setDeadline(preset.value)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="hourglass-outline"
                    size={13}
                    color={isSelected ? "#FFFFFF" : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Initial Status Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Initial Status</Text>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((s) => {
              const isSelected = status === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.statusPill,
                    isSelected && styles.statusPillSelected,
                  ]}
                  onPress={() => setStatus(s)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      isSelected && styles.statusPillTextSelected,
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Curated 10-Icon Badge Palette */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Icon Badge & Accent Color</Text>
          <View style={styles.iconsGrid}>
            {ICON_OPTIONS.map((iconOpt) => {
              const isSelected =
                selectedIcon.name === iconOpt.name &&
                selectedIcon.backgroundColor === iconOpt.backgroundColor;
              return (
                <TouchableOpacity
                  key={iconOpt.name + iconOpt.backgroundColor}
                  style={[
                    styles.iconOption,
                    { backgroundColor: iconOpt.backgroundColor },
                    isSelected && styles.iconOptionSelected,
                  ]}
                  onPress={() => setSelectedIcon(iconOpt)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={iconOpt.name as any}
                    size={20}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Create Task Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleCreate}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>Create Task</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreateTask;

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
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  previewSection: {
    marginBottom: 20,
  },
  previewHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  previewLivePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  liveText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.primary,
  },
  previewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  previewLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 10,
  },
  previewCategoryPill: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    maxWidth: "55%",
  },
  previewCategoryText: {
    fontSize: 11,
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
  previewIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
    lineHeight: 22,
  },
  previewNotes: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  previewSubtasksStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  previewSubtasksText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  previewFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  timeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  previewTime: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
  },
  previewDurationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  previewDurationText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  previewStatusPill: {
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  previewStatusText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.statusTodo,
  },
  previewDeadlineSection: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  previewDeadlineMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  previewDeadlineLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  previewDeadlineLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  previewDeadlinePercent: {
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
  fieldGroup: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  templateChipsRow: {
    gap: 8,
  },
  templateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  templateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  templateText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  labelWithHintRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  labelHint: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  textArea: {
    minHeight: 70,
  },
  subtaskInputRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  subtaskTextInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  subtaskAddBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  subtasksListContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
    gap: 8,
  },
  subtaskRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  subtaskRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  subtaskNumber: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
  },
  subtaskTitle: {
    fontSize: 13,
    color: Colors.textPrimary,
    flex: 1,
  },
  subtaskDeleteBtn: {
    padding: 2,
  },
  chipsRow: {
    gap: 8,
    marginTop: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  priorityRow: {
    flexDirection: "row",
    gap: 8,
  },
  priorityPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priorityPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  statusRow: {
    flexDirection: "row",
    gap: 8,
  },
  statusPill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusPillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  statusPillTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  iconsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  iconOptionSelected: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
