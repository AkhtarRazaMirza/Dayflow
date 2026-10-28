import Colors from "@/constants/Colors";
import { TaskIcon, TaskStatus } from "@/constants/tasks";
import { useTasks } from "@/context/TaskContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
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
];

const PRESET_CATEGORIES = [
  "Grocery shopping app design",
  "Uber Eats redesign challenge",
  "About design sprint",
  "Product Architecture",
];

const PRESET_TIMES = [
  "09:00 AM",
  "12:00 PM",
  "03:00 PM",
  "07:00 PM",
  "09:00 PM",
];

const getRelativeTimeString = (hoursAhead: number): string => {
  const d = new Date();
  d.setHours(d.getHours() + hoursAhead);
  let hours = d.getHours();
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${String(hours).padStart(2, "0")}:${minutes} ${period}`;
};

const STATUS_OPTIONS: TaskStatus[] = ["To-do", "In Progress", "Done"];

const CreateTask = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addTask } = useTasks();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(PRESET_CATEGORIES[0]);
  const [time, setTime] = useState(PRESET_TIMES[0]);
  const [deadline, setDeadline] = useState(PRESET_TIMES[1]);
  const [status, setStatus] = useState<TaskStatus>("To-do");
  const [selectedIcon, setSelectedIcon] = useState<TaskIcon>(ICON_OPTIONS[0]);

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
      time,
      deadline: finalDeadline,
      createdAt: Date.now(),
      status,
      icon: selectedIcon,
    });

    setTitle("");
    router.push("/");
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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

        <Text style={styles.headerTitle}>Create Task</Text>

        <View style={styles.iconButtonPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Input */}
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

        {/* Category Input & Quick Chips */}
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

        {/* Status Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Status</Text>
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

        {/* Icon & Color Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Icon Badge</Text>
          <View style={styles.iconsRow}>
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

        {/* Create Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleCreate}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
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
    paddingBottom: 36,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
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
    color: Colors.primary,
    fontWeight: "500",
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  chipsRow: {
    gap: 8,
    paddingTop: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  chipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  statusRow: {
    flexDirection: "row",
    gap: 10,
  },
  statusPill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  statusPillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  statusPillTextSelected: {
    color: "#FFFFFF",
  },
  iconsRow: {
    flexDirection: "row",
    gap: 12,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 14,
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
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
