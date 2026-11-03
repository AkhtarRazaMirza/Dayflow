# Dayflow

A local-first daily task manager and Pomodoro execution engine for Android and iOS. Built with Expo SDK 58, React Native 0.88, React 19, and Expo Router v58.

Dayflow has zero cloud dependencies. All data—tasks, subtasks, focus sessions, and workspace configurations—is stored strictly on the host device.

---

## Technical Highlights

- **100% Local-First Storage**: Zero cloud database. All data is persisted on-device via `@react-native-async-storage/async-storage` (SQLite on Android, filesystem sandbox on iOS).
- **Atomic Mutex Write Queue**: Storage operations are serialized through a promise-chained write queue (`enqueueWrite`) in [`src/utils/storage.ts`](file:///home/akhtarraza/Documents/Mobile%20devlopnemt/Dayflow/src/utils/storage.ts) to eliminate race conditions during rapid state updates.
- **Runtime Data Sanitization & Healing**: Schema validator (`sanitizeTask`) ensures backward compatibility and gracefully repairs missing or malformed fields on disk reads.
- **Real-Time Deadline Progression Engine**: Calculates percentage elapsed and countdown strings (`Xh Ym left` / overdue) via second-by-second ticker in [`src/utils/deadline.ts`](file:///home/akhtarraza/Documents/Mobile%20devlopnemt/Dayflow/src/utils/deadline.ts).
- **Pomodoro Focus Session State**: Dedicated sprint timer with interval ticking, periodic snapshotting to disk, background elapsed-time recovery, and native completion notifications.
- **Native Android Notification Channels**: Android 8+ notification channel setup (`task-deadlines`, `focus-timer`, `daily-briefing`) with 15-minute advance alerts, deadline alarms, and daily 09:00 AM briefings.
- **Offline Backup & Restore**: Full JSON export and restore engine with validation directly in user settings.
- **Strict Typing & React 19 Compiler Support**: Fully typed TypeScript codebase with zero `any` leaks in core domain models, configured with `typedRoutes` and `reactCompiler`.

---

## Architecture & Directory Layout

The application adheres to Expo Router's file-based routing convention. Screen components live in `src/app/`, while domain logic, components, and storage drivers live outside.

```
dayflow/
├── app.json                     # Native config, plugins (expo-notifications, splash-screen)
├── package.json                 # Expo SDK 58, React 19, React Native 0.88
├── tsconfig.json                # TypeScript config with strict mode & path aliases (@/*)
└── src/
    ├── app/                     # Expo Router navigation routes
    │   ├── _layout.tsx          # Root Tabs navigator & notification response listener
    │   ├── index.tsx            # Home: Watch widget, date strip, active sprint banner, tasks
    │   ├── tasks.tsx            # All Tasks: Search, filter tabs, category chips, sort modal
    │   ├── create.tsx           # Create Task: Real-time preview card, subtasks builder, presets
    │   ├── analytics.tsx        # Analytics: 7-day velocity chart, score meter, deadline audit
    │   └── settings.tsx         # Settings: Workspace profile, targets, JSON backup/restore
    ├── components/              # Modular UI components
    │   ├── DateSelector.tsx     # 14-day horizontal scroller with auto-scroll to today
    │   ├── FilterTabs.tsx       # Filter tabs with dynamic count badges
    │   ├── Header.tsx           # Top navigation bar with notification modal
    │   ├── TaskCard.tsx         # Task item with priority, subtask strip, and deadline bar
    │   └── WatchWidget.tsx      # Ticking analog clock dial + digital readout + progress
    ├── constants/               # Domain models & theme tokens
    │   ├── Colors.ts            # Obsidian dark palette (#09090b, #18181b, #F59E0B)
    │   └── tasks.ts             # Task, TaskStatus, TaskPriority, SubTask types & seed data
    ├── context/                 # Central React Context state
    │   └── TaskContext.tsx      # Task CRUD, Pomodoro timer, notifications sync, persistence
    └── utils/                   # Pure utility functions
        ├── deadline.ts          # Deadline parsing, time-diff math & progress calculations
        ├── notifications.ts     # Android channels, scheduling, cancellations, test alerts
        └── storage.ts           # Thread-safe AsyncStorage persistence, sanitization & backup
```

---

## Data Schema & Storage Keys

All keys use isolated namespace prefixes to avoid key collision:

| Key | Type | Description |
| :--- | :--- | :--- |
| `@dayflow_tasks_v1` | `Task[]` | Serialized array of user tasks and subtasks |
| `@dayflow_focus_session_v1` | `FocusSessionData` | Active Pomodoro timer state and timestamp |
| `@dayflow_user_settings_v1` | `UserSettings` | Workspace name, avatar, targets, and alert toggles |

### Core Task Model

```typescript
export type TaskStatus = "To-do" | "In Progress" | "Done";
export type TaskPriority = "High" | "Medium" | "Low";

export type SubTask = {
  id: string;
  title: string;
  completed: boolean;
};

export type Task = {
  id: string;
  title: string;
  category: string;
  time: string;                  // e.g. "10:00 AM"
  status: TaskStatus;
  priority?: TaskPriority;
  icon: {
    name: string;                // Ionicons glyph name
    backgroundColor: string;     // Hex color
  };
  date?: string;                 // YYYY-MM-DD
  deadline?: string;             // e.g. "11:30 AM"
  createdAt?: number;            // Timestamp (ms)
  notes?: string;
  subtasks?: SubTask[];
  estimatedDuration?: string;    // e.g. "45m", "1h 30m"
};
```

---

## Getting Started

### Prerequisites

- **Node.js**: v18.x or v20.x+ (LTS recommended)
- **Package Manager**: `npm` (or `bun` if preferred)
- **Expo CLI**: bundled via `npx expo`
- **Mobile Environment**:
  - Android Studio + Android SDK / Emulator, or
  - Xcode + iOS Simulator (macOS only), or
  - Physical device with Expo Go / development build

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/dayflow.git
cd dayflow

# Install SDK-compatible dependencies
npm install
```

### Development Server

```bash
# Start Metro bundler
npx expo start

# Run directly on an Android emulator or connected device
npx expo start --android

# Run directly on an iOS simulator
npx expo start --ios
```

### Static Analysis & Verification

Always run type checks and linter before submitting changes:

```bash
# Typecheck with TypeScript
npx tsc --noEmit

# Lint with Expo ESLint rules
npm run lint

# Validate dependencies and config
npx expo-doctor
```

---

## Building Native Binaries (EAS Build)

This project uses **Continuous Native Generation (CNG)**. Do not commit or edit raw `android/` or `ios/` directories manually; configure native properties inside `app.json`.

```bash
# Install EAS CLI globally or run via npx
npx eas-cli@latest login

# Initialize EAS project
npx eas-cli@latest project:init

# Build local preview APK for Android
npx eas-cli@latest build --profile preview --platform android

# Build production release
npx eas-cli@latest build --profile production --platform all
```

---

## Notification Pipeline & Permissions

Android 8.0+ requires explicit notification channels. Dayflow initializes three distinct channels on startup without blocking disk read operations:

1. **`task-deadlines`** (`HIGH` importance): Triggered 15 minutes before task deadline and at the exact deadline timestamp.
2. **`focus-timer`** (`MAX` importance): Immediate heads-up notification with custom vibration pattern when a 25-minute Pomodoro session completes.
3. **`daily-briefing`** (`DEFAULT` importance): Recurring calendar-based schedule triggered daily at 09:00 AM.

Permissions are requested on demand when the user toggles task reminders or daily briefings in **Settings**.

---

## License

This project is licensed under the [MIT License](LICENSE).
