import { Task, TASKS, TaskStatus } from "@/constants/tasks";
import React, { createContext, ReactNode, useContext, useState } from "react";

type TaskContextType = {
  tasks: Task[];
  addTask: (task: Omit<Task, "id">) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  toggleTaskStatus: (id: string) => void;
  deleteTask: (id: string) => void;
  resetTasks: () => void;
  clearCompleted: () => void;
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>(TASKS);

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

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const resetTasks = () => {
    setTasks(TASKS);
  };

  const clearCompleted = () => {
    setTasks((prev) => prev.filter((t) => t.status !== "Done"));
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        addTask,
        updateTaskStatus,
        toggleTaskStatus,
        deleteTask,
        resetTasks,
        clearCompleted,
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
