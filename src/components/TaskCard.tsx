import Colors from "@/constants/Colors";
import { Task, TaskPriority } from "@/constants/tasks";
import { getDeadlineProgress } from "@/utils/deadline";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const STATUS_CONFIG = {
  Done: {
    color: Colors.statusDone,
    bg: "rgba(74, 222, 128, 0.12)",
    icon: "checkmark-circle" as const,
  },
  "In Progress": {
    color: Colors.statusInProgress,
    bg: "rgba(251, 191, 36, 0.12)",
    icon: "time" as const,
  },
  "To-do": {
    color: Colors.statusTodo,
    bg: "rgba(56, 189, 248, 0.12)",
    icon: "ellipse-outline" as const,
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

type TaskCardProps = {
  task: Task;
  onPress?: () => void;
  onToggleStatus?: () => void;
};

const TaskCard = ({ task, onPress, onToggleStatus }: TaskCardProps) => {
  const [now, setNow] = useState(() => new Date());

  // Realtime clock ticker for deadline progress bar
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const deadlineInfo = getDeadlineProgress(task, now);
  const statusMeta = STATUS_CONFIG[task.status];
  const isDone = task.status === "Done";
  const priorityMeta = task.priority ? PRIORITY_META[task.priority] : null;

  const totalSubtasks = task.subtasks?.length ?? 0;
  const completedSubtasks =
    task.subtasks?.filter((st) => st.completed).length ?? 0;
  const subtasksPercent =
    totalSubtasks > 0
      ? Math.round((completedSubtasks / totalSubtasks) * 100)
      : 0;

  const handleCheckboxToggle = (e: any) => {
    e?.stopPropagation?.();
    if (onToggleStatus) {
      onToggleStatus();
    } else if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, isDone && styles.cardDone]}
      onPress={onPress}
      activeOpacity={0.78}
    >
      <View style={styles.content}>
        {/* Top Header: Checkbox + Category + Priority + Right Icon Badge */}
        <View style={styles.topHeader}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={handleCheckboxToggle}
              style={styles.checkboxTouch}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={statusMeta.icon}
                size={22}
                color={statusMeta.color}
              />
            </TouchableOpacity>

            <View style={styles.categoryPill}>
              <Text style={styles.categoryText} numberOfLines={1}>
                {task.category}
              </Text>
            </View>

            {priorityMeta && (
              <View
                style={[
                  styles.priorityTag,
                  { backgroundColor: priorityMeta.bg },
                ]}
              >
                <Ionicons
                  name={priorityMeta.icon}
                  size={10}
                  color={priorityMeta.color}
                />
                <Text
                  style={[
                    styles.priorityTagText,
                    { color: priorityMeta.color },
                  ]}
                >
                  {task.priority}
                </Text>
              </View>
            )}
          </View>

          <View
            style={[
              styles.iconBadge,
              { backgroundColor: task.icon.backgroundColor },
            ]}
          >
            <Ionicons
              name={task.icon.name as any}
              size={18}
              color={"#ffffff"}
            />
          </View>
        </View>

        {/* Task Title */}
        <Text style={[styles.title, isDone && styles.titleDone]}>
          {task.title}
        </Text>

        {/* Optional Notes Preview */}
        {task.notes ? (
          <Text style={styles.notesPreview} numberOfLines={1}>
            {task.notes}
          </Text>
        ) : null}

        {/* Subtasks Progress Strip if available */}
        {totalSubtasks > 0 && (
          <View style={styles.subtasksStrip}>
            <View style={styles.subtasksHeaderRow}>
              <View style={styles.subtasksLabelWrap}>
                <Ionicons
                  name="checkbox-outline"
                  size={11}
                  color={Colors.textSecondary}
                />
                <Text style={styles.subtasksCountText}>
                  {completedSubtasks}/{totalSubtasks} subtasks
                </Text>
              </View>
              <Text style={styles.subtasksPercentText}>
                {subtasksPercent}%
              </Text>
            </View>
            <View style={styles.subtasksTrack}>
              <View
                style={[
                  styles.subtasksFill,
                  {
                    width: `${subtasksPercent}%`,
                    backgroundColor:
                      subtasksPercent === 100
                        ? Colors.statusDone
                        : Colors.primary,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Meta Footer: Time + Duration + Status Badge */}
        <View style={styles.footer}>
          <View style={styles.metaLeftGroup}>
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={13} color={Colors.primary} />
              <Text style={styles.time}>{task.time}</Text>
            </View>

            {task.estimatedDuration && (
              <View style={styles.durationPill}>
                <Ionicons
                  name="hourglass-outline"
                  size={10}
                  color={Colors.textSecondary}
                />
                <Text style={styles.durationText}>
                  {task.estimatedDuration}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}
            onPress={handleCheckboxToggle}
            activeOpacity={0.7}
          >
            <Text style={[styles.statusText, { color: statusMeta.color }]}>
              {task.status}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Realtime Deadline Progress Bar at the Bottom */}
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
                size={12}
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
};

export default TaskCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  cardDone: {
    opacity: 0.85,
    borderColor: "rgba(74, 222, 128, 0.25)",
  },
  content: {
    flex: 1,
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 10,
  },
  checkboxTouch: {
    padding: 1,
  },
  categoryPill: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    maxWidth: "50%",
  },
  categoryText: {
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
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
    lineHeight: 22,
  },
  titleDone: {
    textDecorationLine: "line-through",
    color: Colors.textSecondary,
  },
  notesPreview: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 10,
    lineHeight: 16,
  },
  subtasksStrip: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  subtasksHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  subtasksLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  subtasksCountText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  subtasksPercentText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.primary,
  },
  subtasksTrack: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  subtasksFill: {
    height: "100%",
    borderRadius: 1.5,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  metaLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  time: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
  },
  durationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  durationText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  deadlineSection: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  deadlineMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  deadlineLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
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
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.surfaceLight,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2.5,
  },
});
