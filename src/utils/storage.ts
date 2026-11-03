import { DEFAULT_TASKS, getTodayKey, SubTask, Task, TaskPriority, TaskStatus } from "@/constants/tasks";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORAGE_KEYS = {
  TASKS: "@dayflow_tasks_v1",
  SETTINGS: "@dayflow_user_settings_v1",
  FOCUS_SESSION: "@dayflow_focus_session_v1",
} as const;

export type FocusSessionData = {
  taskId: string;
  remainingSeconds: number;
  initialSeconds: number;
  isRunning: boolean;
  lastUpdated: number;
};

/**
 * Validates and heals a single task item to guarantee runtime data integrity.
 */
export function sanitizeTask(raw: any): Task | null {
  if (!raw || typeof raw !== "object") return null;

  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : Date.now().toString();
  const title = typeof raw.title === "string" ? raw.title.trim() : "Untitled Task";
  const category = typeof raw.category === "string" && raw.category.trim() ? raw.category.trim() : "General";
  const time = typeof raw.time === "string" && raw.time.trim() ? raw.time.trim() : "09:00 AM";

  const validStatuses: TaskStatus[] = ["To-do", "In Progress", "Done"];
  const status: TaskStatus = validStatuses.includes(raw.status) ? raw.status : "To-do";

  const validPriorities: TaskPriority[] = ["High", "Medium", "Low"];
  const priority: TaskPriority = validPriorities.includes(raw.priority) ? raw.priority : "Medium";

  const iconName = raw.icon?.name && typeof raw.icon.name === "string" ? raw.icon.name : "checkbox-outline";
  const iconBg = raw.icon?.backgroundColor && typeof raw.icon.backgroundColor === "string" ? raw.icon.backgroundColor : "#F59E0B";

  const date = typeof raw.date === "string" && raw.date.trim() ? raw.date.trim() : getTodayKey();
  const deadline = typeof raw.deadline === "string" && raw.deadline.trim() ? raw.deadline.trim() : time;
  const createdAt = typeof raw.createdAt === "number" ? raw.createdAt : Date.now();
  const notes = typeof raw.notes === "string" && raw.notes.trim() ? raw.notes.trim() : undefined;
  const estimatedDuration = typeof raw.estimatedDuration === "string" && raw.estimatedDuration.trim() ? raw.estimatedDuration.trim() : undefined;

  let subtasks: SubTask[] | undefined = undefined;
  if (Array.isArray(raw.subtasks)) {
    subtasks = raw.subtasks
      .filter((st: any) => st && typeof st === "object" && typeof st.title === "string")
      .map((st: any, idx: number) => ({
        id: typeof st.id === "string" && st.id ? st.id : `st-${idx}-${Date.now()}`,
        title: st.title.trim(),
        completed: Boolean(st.completed),
      }));
  }

  return {
    id,
    title,
    category,
    time,
    status,
    priority,
    icon: { name: iconName, backgroundColor: iconBg },
    date,
    deadline,
    createdAt,
    notes,
    subtasks,
    estimatedDuration,
  };
}

/**
 * Thread-safe write queue to prevent race conditions during rapid writes.
 */
let writeQueue: Promise<any> = Promise.resolve();

function enqueueWrite<T>(op: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(op, op);
  writeQueue = result.catch(() => {});
  return result;
}

/**
 * Loads tasks directly from device local storage.
 * Returns null if no record exists (first install), or the validated Task array.
 */
export async function loadTasksFromStorage(): Promise<Task[] | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
    if (raw === null) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn("Storage contained non-array tasks data, resetting to fallback.");
      return null;
    }

    const sanitizedTasks: Task[] = [];
    for (const item of parsed) {
      const task = sanitizeTask(item);
      if (task) {
        sanitizedTasks.push(task);
      }
    }

    return sanitizedTasks;
  } catch (error) {
    console.warn("Failed to load tasks from AsyncStorage:", error);
    return null;
  }
}

/**
 * Persists tasks array directly into mobile storage with atomic queueing.
 */
export async function saveTasksToStorage(tasks: Task[]): Promise<boolean> {
  return enqueueWrite(async () => {
    try {
      const serialized = JSON.stringify(tasks);
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, serialized);
      return true;
    } catch (error) {
      console.warn("Failed to save tasks to AsyncStorage:", error);
      return false;
    }
  });
}

/**
 * Resets tasks in mobile storage to defaults or empty.
 */
export async function resetTasksInStorage(tasks: Task[] = DEFAULT_TASKS): Promise<boolean> {
  return enqueueWrite(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      return true;
    } catch (error) {
      console.warn("Failed to reset tasks in AsyncStorage:", error);
      return false;
    }
  });
}

/**
 * Persists active Pomodoro focus session state to mobile storage.
 */
export async function saveFocusSessionToStorage(session: FocusSessionData | null): Promise<void> {
  return enqueueWrite(async () => {
    try {
      if (session === null) {
        await AsyncStorage.removeItem(STORAGE_KEYS.FOCUS_SESSION);
      } else {
        await AsyncStorage.setItem(STORAGE_KEYS.FOCUS_SESSION, JSON.stringify(session));
      }
    } catch (error) {
      console.warn("Failed to persist focus session:", error);
    }
  });
}

/**
 * Restores active Pomodoro focus session state from mobile storage.
 */
export async function loadFocusSessionFromStorage(): Promise<FocusSessionData | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.FOCUS_SESSION);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.taskId === "string" && typeof parsed.remainingSeconds === "number") {
      return parsed;
    }
    return null;
  } catch (error) {
    console.warn("Failed to load focus session from storage:", error);
    return null;
  }
}

/**
 * Creates a complete JSON backup export of local data.
 */
export async function exportAllDataAsJSON(): Promise<string> {
  try {
    const tasksRaw = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
    const settingsRaw = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);

    const backup = {
      version: 1,
      appName: "Dayflow",
      exportedAt: new Date().toISOString(),
      tasks: tasksRaw ? JSON.parse(tasksRaw) : [],
      settings: settingsRaw ? JSON.parse(settingsRaw) : {},
    };

    return JSON.stringify(backup, null, 2);
  } catch (error) {
    console.warn("Failed to generate data backup JSON:", error);
    throw new Error("Could not export backup data");
  }
}

/**
 * Validates and restores tasks from a JSON backup string.
 */
export async function restoreDataFromBackup(jsonString: string): Promise<{ tasks: Task[]; count: number }> {
  try {
    const parsed = JSON.parse(jsonString);
    const rawTasks = Array.isArray(parsed) ? parsed : Array.isArray(parsed.tasks) ? parsed.tasks : null;

    if (!rawTasks) {
      throw new Error("Invalid backup format: No tasks array found");
    }

    const validTasks: Task[] = [];
    for (const item of rawTasks) {
      const task = sanitizeTask(item);
      if (task) validTasks.push(task);
    }

    await saveTasksToStorage(validTasks);

    if (parsed.settings && typeof parsed.settings === "object") {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed.settings));
    }

    return { tasks: validTasks, count: validTasks.length };
  } catch (error) {
    console.warn("Failed to restore data from backup:", error);
    throw error;
  }
}
