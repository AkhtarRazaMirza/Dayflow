export type TaskStatus = "Done" | "In Progress" | "To-do";

export type TaskPriority = "High" | "Medium" | "Low";

export type TaskIcon = {
  name: string;
  backgroundColor: string;
};

export type Task = {
  id: string;
  category: string;
  title: string;
  time: string;
  status: TaskStatus;
  icon: TaskIcon;
  date?: string;
  deadline?: string;
  createdAt?: number;
  priority?: TaskPriority;
  notes?: string;
};

export const TASKS: Task[] = [
  {
    id: "1",
    category: "Grocery shopping app design",
    title: "Market Research",
    time: "10:00 AM",
    deadline: "10:00 AM",
    status: "Done",
    priority: "High",
    icon: { name: "grid", backgroundColor: "#FF6B8A" },
  },
  {
    id: "2",
    category: "Grocery shopping app design",
    title: "Competitive Analysis",
    time: "12:00 PM",
    deadline: "12:00 PM",
    status: "In Progress",
    priority: "High",
    icon: { name: "grid", backgroundColor: "#FF6B8A" },
  },
  {
    id: "3",
    category: "Uber Eats redesign challenge",
    title: "Create Low-fidelity Wireframe",
    time: "07:00 PM",
    deadline: "07:00 PM",
    status: "To-do",
    priority: "Medium",
    icon: { name: "arrow-down-circle", backgroundColor: "#4ADE80" },
  },
  {
    id: "4",
    category: "About design sprint",
    title: "How to pitch a Design Sprint",
    time: "09:00 PM",
    deadline: "09:00 PM",
    status: "To-do",
    priority: "Low",
    icon: { name: "bookmark", backgroundColor: "#FBBF24" },
  },
];

export const FILTER_OPTIONS = [
  "All",
  "To do",
  "In Progress",
  "Completed",
] as const;

export type FilterOptions = (typeof FILTER_OPTIONS)[number];
