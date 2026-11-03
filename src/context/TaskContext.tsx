import { DEFAULT_TASKS, Task, TaskStatus } from "@/constants/tasks";
import {
  cancelAllTaskNotificationsAsync,
  cancelTaskNotificationsAsync,
  scheduleTaskNotificationsAsync,
  sendFocusCompleteNotificationAsync,
  setupNotificationChannelsAsync,
} from "@/utils/notifications";
import {
  loadFocusSessionFromStorage,
  loadTasksFromStorage,
  resetTasksInStorage,
  saveFocusSessionToStorage,
  saveTasksToStorage,
} from "@/utils/storage";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type TaskContextType = {
  tasks: Task[];
  isLoaded: boolean;
  addTask: (task: Omit<Task, "id">) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  toggleTaskStatus: (id: string) => Promise<void>;
  editTask: (id: string, updates: Partial<Task>) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  resetTasks: () => Promise<void>;
  clearCompleted: () => Promise<void>;
  reloadTasks: () => Promise<void>;
  // Focus Session State
  activeFocusTaskId: string | null;
  focusRemainingSeconds: number;
  focusInitialSeconds: number;
  isFocusRunning: boolean;
  startFocusSession: (taskId: string, durationMinutes?: number) => void;
  pauseFocusSession: () => void;
  resumeFocusSession: () => void;
  stopFocusSession: () => void;
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const tasksRef = useRef<Task[]>(tasks);

  // Focus Pomodoro Session
  const [activeFocusTaskId, setActiveFocusTaskId] = useState<string | null>(null);
  const [focusRemainingSeconds, setFocusRemainingSeconds] = useState<number>(0);
  const [focusInitialSeconds, setFocusInitialSeconds] = useState<number>(0);
  const [isFocusRunning, setIsFocusRunning] = useState<boolean>(false);
  const activeFocusTaskIdRef = useRef<string | null>(activeFocusTaskId);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    activeFocusTaskIdRef.current = activeFocusTaskId;
  }, [activeFocusTaskId]);

  // Load persisted tasks from mobile storage on initial mount
  const reloadTasks = useCallback(async () => {
    try {
      const loadedList = await loadTasksFromStorage();
      if (loadedList !== null) {
        setTasks(loadedList);
        tasksRef.current = loadedList;
      }
    } catch (err) {
      console.warn("Failed to reload tasks from storage:", err);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    // Kick off notification channels in background (do not block storage read)
    setupNotificationChannelsAsync().catch((err) => {
      console.warn("Background notification channels setup error:", err);
    });

    const initStorage = async () => {
      try {
        const loadedList = await loadTasksFromStorage();
        if (ignore) return;

        if (loadedList !== null) {
          setTasks(loadedList);
          tasksRef.current = loadedList;

          // Schedule notification alerts for all active tasks
          loadedList.forEach((t) => {
            if (t.status !== "Done") {
              scheduleTaskNotificationsAsync(t);
            }
          });
        } else {
          // First install / blank storage — populate and persist default seed tasks
          setTasks(DEFAULT_TASKS);
          tasksRef.current = DEFAULT_TASKS;
          await saveTasksToStorage(DEFAULT_TASKS);
          DEFAULT_TASKS.forEach((t) => scheduleTaskNotificationsAsync(t));
        }

        // Restore persisted Pomodoro focus session if active
        const savedSession = await loadFocusSessionFromStorage();
        if (ignore) return;

        if (savedSession && savedSession.remainingSeconds > 0) {
          let updatedRemaining = savedSession.remainingSeconds;
          if (savedSession.isRunning) {
            const elapsedSecs = Math.floor((Date.now() - savedSession.lastUpdated) / 1000);
            updatedRemaining = Math.max(0, savedSession.remainingSeconds - elapsedSecs);
          }

          if (updatedRemaining > 0) {
            setActiveFocusTaskId(savedSession.taskId);
            setFocusRemainingSeconds(updatedRemaining);
            setFocusInitialSeconds(savedSession.initialSeconds);
            setIsFocusRunning(savedSession.isRunning && updatedRemaining > 0);
          }
        }
      } catch (err) {
        if (!ignore) {
          console.warn("Failed to load tasks from local storage:", err);
          setTasks(DEFAULT_TASKS);
          tasksRef.current = DEFAULT_TASKS;
        }
      } finally {
        if (!ignore) {
          setIsLoaded(true);
        }
      }
    };

    initStorage();

    return () => {
      ignore = true;
    };
  }, []);

  // Focus ticker
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isFocusRunning && focusRemainingSeconds > 0) {
      interval = setInterval(() => {
        setFocusRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsFocusRunning(false);
            const finishedTaskId = activeFocusTaskIdRef.current;
            const targetTask = tasksRef.current.find((t) => t.id === finishedTaskId);
            sendFocusCompleteNotificationAsync(targetTask?.title);
            saveFocusSessionToStorage(null);
            return 0;
          }
          const next = prev - 1;
          // Periodically sync focus session to storage every 10 seconds
          if (next % 10 === 0 && activeFocusTaskIdRef.current) {
            saveFocusSessionToStorage({
              taskId: activeFocusTaskIdRef.current,
              remainingSeconds: next,
              initialSeconds: focusInitialSeconds,
              isRunning: true,
              lastUpdated: Date.now(),
            });
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isFocusRunning, focusRemainingSeconds, focusInitialSeconds]);

  const startFocusSession = (taskId: string, durationMinutes: number = 25) => {
    const totalSecs = durationMinutes * 60;
    setActiveFocusTaskId(taskId);
    setFocusRemainingSeconds(totalSecs);
    setFocusInitialSeconds(totalSecs);
    setIsFocusRunning(true);

    saveFocusSessionToStorage({
      taskId,
      remainingSeconds: totalSecs,
      initialSeconds: totalSecs,
      isRunning: true,
      lastUpdated: Date.now(),
    });

    // Also mark task as In Progress if it was To-do
    setTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === taskId && t.status === "To-do" ? { ...t, status: "In Progress" as TaskStatus } : t
      );
      saveTasksToStorage(updated);
      return updated;
    });
  };

  const pauseFocusSession = () => {
    setIsFocusRunning(false);
    if (activeFocusTaskId) {
      saveFocusSessionToStorage({
        taskId: activeFocusTaskId,
        remainingSeconds: focusRemainingSeconds,
        initialSeconds: focusInitialSeconds,
        isRunning: false,
        lastUpdated: Date.now(),
      });
    }
  };

  const resumeFocusSession = () => {
    if (focusRemainingSeconds > 0 && activeFocusTaskId) {
      setIsFocusRunning(true);
      saveFocusSessionToStorage({
        taskId: activeFocusTaskId,
        remainingSeconds: focusRemainingSeconds,
        initialSeconds: focusInitialSeconds,
        isRunning: true,
        lastUpdated: Date.now(),
      });
    }
  };

  const stopFocusSession = () => {
    setIsFocusRunning(false);
    setActiveFocusTaskId(null);
    setFocusRemainingSeconds(0);
    setFocusInitialSeconds(0);
    saveFocusSessionToStorage(null);
  };

  // Mutating Action: Add Task
  const addTask = async (taskData: Omit<Task, "id">) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
    };
    const nextTasks = [newTask, ...tasksRef.current];
    setTasks(nextTasks);
    tasksRef.current = nextTasks;
    await saveTasksToStorage(nextTasks);
    scheduleTaskNotificationsAsync(newTask);
  };

  // Mutating Action: Update Task Status
  const updateTaskStatus = async (id: string, status: TaskStatus) => {
    const nextTasks = tasksRef.current.map((t) => (t.id === id ? { ...t, status } : t));
    setTasks(nextTasks);
    tasksRef.current = nextTasks;
    await saveTasksToStorage(nextTasks);

    const target = nextTasks.find((t) => t.id === id);
    if (target) {
      scheduleTaskNotificationsAsync(target);
    }
  };

  // Mutating Action: Toggle Task Status
  const toggleTaskStatus = async (id: string) => {
    const nextTasks = tasksRef.current.map((t) => {
      if (t.id !== id) return t;
      const nextStatus: TaskStatus =
        t.status === "To-do"
          ? "In Progress"
          : t.status === "In Progress"
            ? "Done"
            : "To-do";
      return { ...t, status: nextStatus };
    });
    setTasks(nextTasks);
    tasksRef.current = nextTasks;
    await saveTasksToStorage(nextTasks);

    const target = nextTasks.find((t) => t.id === id);
    if (target) {
      scheduleTaskNotificationsAsync(target);
    }
  };

  // Mutating Action: Edit Task
  const editTask = async (id: string, updates: Partial<Task>) => {
    const nextTasks = tasksRef.current.map((t) => (t.id === id ? { ...t, ...updates } : t));
    setTasks(nextTasks);
    tasksRef.current = nextTasks;
    await saveTasksToStorage(nextTasks);

    const target = nextTasks.find((t) => t.id === id);
    if (target) {
      scheduleTaskNotificationsAsync(target);
    }
  };

  // Mutating Action: Toggle Subtask
  const toggleSubtask = async (taskId: string, subtaskId: string) => {
    const nextTasks = tasksRef.current.map((t) => {
      if (t.id !== taskId || !t.subtasks) return t;
      const updatedSubtasks = t.subtasks.map((st) =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      );
      return { ...t, subtasks: updatedSubtasks };
    });
    setTasks(nextTasks);
    tasksRef.current = nextTasks;
    await saveTasksToStorage(nextTasks);
  };

  // Mutating Action: Delete Task
  const deleteTask = async (id: string) => {
    if (activeFocusTaskId === id) {
      stopFocusSession();
    }
    cancelTaskNotificationsAsync(id);
    const nextTasks = tasksRef.current.filter((t) => t.id !== id);
    setTasks(nextTasks);
    tasksRef.current = nextTasks;
    await saveTasksToStorage(nextTasks);
  };

  // Mutating Action: Reset Tasks to Defaults
  const resetTasks = async () => {
    stopFocusSession();
    cancelAllTaskNotificationsAsync();
    setTasks(DEFAULT_TASKS);
    tasksRef.current = DEFAULT_TASKS;
    await resetTasksInStorage(DEFAULT_TASKS);
    DEFAULT_TASKS.forEach((t) => scheduleTaskNotificationsAsync(t));
  };

  // Mutating Action: Clear Completed
  const clearCompleted = async () => {
    const completed = tasksRef.current.filter((t) => t.status === "Done");
    completed.forEach((c) => cancelTaskNotificationsAsync(c.id));
    const nextTasks = tasksRef.current.filter((t) => t.status !== "Done");
    setTasks(nextTasks);
    tasksRef.current = nextTasks;
    await saveTasksToStorage(nextTasks);
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        isLoaded,
        addTask,
        updateTaskStatus,
        toggleTaskStatus,
        editTask,
        toggleSubtask,
        deleteTask,
        resetTasks,
        clearCompleted,
        reloadTasks,
        activeFocusTaskId,
        focusRemainingSeconds,
        focusInitialSeconds,
        isFocusRunning,
        startFocusSession,
        pauseFocusSession,
        resumeFocusSession,
        stopFocusSession,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTasks must be used within a TaskProvider");
  }
  return context;
};
