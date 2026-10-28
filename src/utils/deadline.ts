import Colors from "@/constants/Colors";
import { Task } from "@/constants/tasks";

/**
 * Parses time strings like "10:00 AM", "12:00 PM", "07:30 PM" into a Date object on baseDate.
 */
export const parseTimeStringToDate = (
  timeStr: string,
  baseDate: Date = new Date()
): Date => {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return new Date(baseDate);

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();

  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  const target = new Date(baseDate);
  target.setHours(hours, minutes, 0, 0);
  return target;
};

export type DeadlineProgress = {
  progress: number; // 0 to 1
  percent: number; // 0 to 100
  label: string;
  isOverdue: boolean;
  isDone: boolean;
  color: string;
};

/**
 * Calculates realtime deadline progress and countdown text.
 */
export const getDeadlineProgress = (
  task: Task,
  now: Date = new Date()
): DeadlineProgress => {
  if (task.status === "Done") {
    return {
      progress: 1,
      percent: 100,
      label: "Completed",
      isOverdue: false,
      isDone: true,
      color: Colors.statusDone,
    };
  }

  const deadlineStr = task.deadline || task.time;
  const deadlineDate = parseTimeStringToDate(deadlineStr, now);

  // If task has explicit createdAt timestamp, use it as start; otherwise default to 4 hours prior to deadline
  const startMs = task.createdAt
    ? Math.min(task.createdAt, deadlineDate.getTime() - 60000)
    : deadlineDate.getTime() - 4 * 60 * 60 * 1000;

  const totalDuration = deadlineDate.getTime() - startMs;
  const currentElapsed = now.getTime() - startMs;

  const diffMs = deadlineDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      progress: 1,
      percent: 100,
      label: "Deadline passed",
      isOverdue: true,
      isDone: false,
      color: "#EF4444",
    };
  }

  const rawProgress = totalDuration > 0 ? currentElapsed / totalDuration : 0;
  const progress = Math.min(1, Math.max(0, rawProgress));
  const percent = Math.round(progress * 100);

  // Format countdown string
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let label = "";
  if (hours > 0) {
    label = `${hours}h ${minutes}m left`;
  } else if (minutes > 0) {
    label = `${minutes}m ${seconds}s left`;
  } else {
    label = `${seconds}s left`;
  }

  // Color gradient from primary amber to alert yellow/amber as deadline approaches
  let color = Colors.primary as string;
  if (progress >= 0.85) {
    color = Colors.statusInProgress;
  }

  return {
    progress,
    percent,
    label,
    isOverdue: false,
    isDone: false,
    color,
  };
};
