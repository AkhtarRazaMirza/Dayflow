import Colors from "@/constants/Colors";
import { Task } from "@/constants/tasks";
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

type TaskCardProps = {
  task: Task;
  onPress?: () => void;
};

const TaskCard = ({ task, onPress }: TaskCardProps) => {
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

  return (
    <TouchableOpacity
      style={[styles.card, isDone && styles.cardDone]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.content}>
        {/* Top Header: Checkbox + Category Tag + Right Icon Badge */}
        <View style={styles.topHeader}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={onPress}
              style={styles.checkboxTouch}
              activeOpacity={0.7}
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

        {/* Meta Footer: Time + Status Badge */}
        <View style={styles.footer}>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={14} color={Colors.primary} />
            <Text style={styles.time}>{task.time}</Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
            <Text style={[styles.statusText, { color: statusMeta.color }]}>
              {task.status}
            </Text>
          </View>
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
    maxWidth: "80%",
  },
  categoryText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
    lineHeight: 22,
  },
  titleDone: {
    textDecorationLine: "line-through",
    color: Colors.textSecondary,
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
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  time: {
    fontSize: 12,
    color: Colors.primary,
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
