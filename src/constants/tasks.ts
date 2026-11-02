export type TaskStatus = "Done" | "In Progress" | "To-do";

export type TaskPriority = "High" | "Medium" | "Low";

export type TaskIcon = {
  name: string;
  backgroundColor: string;
};

export type SubTask = {
  id: string;
  title: string;
  completed: boolean;
};

export type Task = {
  id: string;
  category: string;
  title: string;
  time: string;
  status: TaskStatus;
  icon: TaskIcon;
  date?: string; // YYYY-MM-DD
  deadline?: string;
  createdAt?: number;
  priority?: TaskPriority;
  notes?: string;
  subtasks?: SubTask[];
  estimatedDuration?: string;
};

export const getTodayKey = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getTomorrowKey = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const DEFAULT_TASKS: Task[] = [
  {
    id: "welcome-task",
    category: "Get Started",
    title: "Welcome to Dayflow 👋",
    time: "09:00 AM",
    deadline: "09:00 AM",
    status: "To-do",
    priority: "High",
    icon: { name: "sparkles", backgroundColor: "#F59E0B" },
    date: getTodayKey(),
    estimatedDuration: "15m",
    notes:
      "Welcome to Dayflow! Tap this task card to inspect subtasks, start a Pomodoro focus session, or edit details. Use the + tab below to schedule new tasks.",
    subtasks: [
      { id: "w1", title: "Tap to explore task details & subtasks", completed: false },
      { id: "w2", title: "Launch a Pomodoro focus timer session", completed: false },
      { id: "w3", title: "Tap the + button to create your custom task", completed: false },
    ],
  },
];

export const TASKS: Task[] = DEFAULT_TASKS;

export const FILTER_OPTIONS = [
  "All",
  "To do",
  "In Progress",
  "Completed",
] as const;

export type FilterOptions = (typeof FILTER_OPTIONS)[number];
