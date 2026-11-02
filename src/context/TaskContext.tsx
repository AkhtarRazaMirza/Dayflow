import { DEFAULT_TASKS, Task, TaskStatus } from "@/constants/tasks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

const TASKS_STORAGE_KEY = "@dayflow_tasks_v1";

type TaskContextType = {
  tasks: Task[];
  isLoaded: boolean;
  addTask: (task: Omit<Task, "id">) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  toggleTaskStatus: (id: string) => void;
  editTask: (id: string, updates: Partial<Task>) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteTask: (id: string) => void;
  resetTasks: () => void;
  clearCompleted: () => void;
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
  const [tasks, setTasks] = useState<Task[]>(DEFAULT_TASKS);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Focus Pomodoro Session
  const [activeFocusTaskId, setActiveFocusTaskId] = useState<string | null>(null);
  const [focusRemainingSeconds, setFocusRemainingSeconds] = useState<number>(0);
  const [focusInitialSeconds, setFocusInitialSeconds] = useState<number>(0);
  const [isFocusRunning, setIsFocusRunning] = useState<boolean>(false);

  // Load persisted tasks from AsyncStorage on mount
  useEffect(() => {
    let isMounted = true;
    const loadPersistedTasks = async () => {
      try {
        const stored = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
        if (!isMounted) return;
        if (stored !== null) {
          const parsed = JSON.parse(stored);
          setTasks(Array.isArray(parsed) ? parsed : DEFAULT_TASKS);
        } else {
          setTasks(DEFAULT_TASKS);
          await AsyncStorage.setItem(
            TASKS_STORAGE_KEY,
            JSON.stringify(DEFAULT_TASKS)
          );
        }
      } catch (err) {
        console.warn("Failed to load tasks from AsyncStorage:", err);
        if (isMounted) setTasks(DEFAULT_TASKS);
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    };

    loadPersistedTasks();
    return () => {
      isMounted = false;
    };
  }, []);

  // Persist tasks whenever changed (only after initial load completes)
  useEffect(() => {
    if (!isLoaded) return;
    const persistTasks = async () => {
      try {
        await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
      } catch (err) {
        console.warn("Failed to persist tasks:", err);
      }
    };
    persistTasks();
  }, [tasks, isLoaded]);

  // Focus ticker
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isFocusRunning && focusRemainingSeconds > 0) {
      interval = setInterval(() => {
        setFocusRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsFocusRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isFocusRunning, focusRemainingSeconds]);

  const startFocusSession = (taskId: string, durationMinutes: number = 25) => {
    const totalSecs = durationMinutes * 60;
    setActiveFocusTaskId(taskId);
    setFocusRemainingSeconds(totalSecs);
    setFocusInitialSeconds(totalSecs);
    setIsFocusRunning(true);

    // Also mark task as In Progress if it was To-do
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId && t.status === "To-do"
          ? { ...t, status: "In Progress" }
          : t
      )
    );
  };

  const pauseFocusSession = () => {
    setIsFocusRunning(false);
  };

  const resumeFocusSession = () => {
    if (focusRemainingSeconds > 0) {
      setIsFocusRunning(true);
    }
  };

  const stopFocusSession = () => {
    setIsFocusRunning(false);
    setActiveFocusTaskId(null);
    setFocusRemainingSeconds(0);
    setFocusInitialSeconds(0);
  };

  const addTask = (taskData: Omit<Task, "id">) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
  };

  const toggleTaskStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const nextStatus: TaskStatus =
          t.status === "To-do"
            ? "In Progress"
            : t.status === "In Progress"
              ? "Done"
              : "To-do";
        return { ...t, status: nextStatus };
      })
    );
  };

  const editTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId || !t.subtasks) return t;
        const updatedSubtasks = t.subtasks.map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        return { ...t, subtasks: updatedSubtasks };
      })
    );
  };

  const deleteTask = (id: string) => {
    if (activeFocusTaskId === id) {
      stopFocusSession();
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const resetTasks = () => {
    stopFocusSession();
    setTasks(DEFAULT_TASKS);
  };

  const clearCompleted = () => {
    setTasks((prev) => prev.filter((t) => t.status !== "Done"));
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
