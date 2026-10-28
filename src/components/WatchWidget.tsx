import Colors from "@/constants/Colors";
import { useTasks } from "@/context/TaskContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

const WatchWidget = () => {
  const { tasks } = useTasks();
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  // Analog clock hand rotations
  const hourDeg = ((hours % 12) + minutes / 60) * 30;
  const minuteDeg = (minutes + seconds / 60) * 6;
  const secondDeg = seconds * 6;

  // Digital time components
  const displayHours = String(hours % 12 || 12).padStart(2, "0");
  const displayMinutes = String(minutes).padStart(2, "0");
  const displaySeconds = String(seconds).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  const greeting =
    hours < 12
      ? "Good Morning"
      : hours < 17
        ? "Good Afternoon"
        : "Good Evening";

  const formattedDate = time.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  // Task statistics
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === "Done").length;
  const inProgressCount = tasks.filter((t) => t.status === "In Progress").length;
  const pendingCount = tasks.filter((t) => t.status === "To-do").length;
  const progressRatio = totalCount > 0 ? completedCount / totalCount : 0;
  const progressPercent = Math.round(progressRatio * 100);

  // Next active task
  const nextTask = tasks.find(
    (t) => t.status === "In Progress" || t.status === "To-do"
  );

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        {/* Left Side: Greeting, Digital Watch & Date */}
        <View style={styles.digitalCol}>
          <View style={styles.greetingRow}>
            <Ionicons
              name={
                hours >= 6 && hours < 18 ? "sunny-outline" : "moon-outline"
              }
              size={14}
              color={Colors.primary}
            />
            <Text style={styles.greetingText}>{greeting}</Text>
          </View>

          {/* Digital Time Readout */}
          <View style={styles.timeRow}>
            <Text style={styles.timeMain}>
              {displayHours}:{displayMinutes}
            </Text>
            <Text style={styles.timeSeconds}>:{displaySeconds}</Text>
            <View style={styles.ampmBadge}>
              <Text style={styles.ampmText}>{ampm}</Text>
            </View>
          </View>

          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>

        {/* Right Side: Working Analog Watch Dial */}
        <View style={styles.analogContainer}>
          <View style={styles.clockDial}>
            {/* Cardinal Tick Marks */}
            <View style={[styles.tickMark, styles.tickTop]} />
            <View style={[styles.tickMark, styles.tickBottom]} />
            <View style={[styles.tickMark, styles.tickLeft]} />
            <View style={[styles.tickMark, styles.tickRight]} />

            {/* Hour Hand */}
            <View
              style={[
                styles.handContainer,
                { transform: [{ rotate: `${hourDeg}deg` }] },
              ]}
            >
              <View style={styles.hourHand} />
            </View>

            {/* Minute Hand */}
            <View
              style={[
                styles.handContainer,
                { transform: [{ rotate: `${minuteDeg}deg` }] },
              ]}
            >
              <View style={styles.minuteHand} />
            </View>

            {/* Second Hand (Ticking in Primary Accent Color) */}
            <View
              style={[
                styles.handContainer,
                { transform: [{ rotate: `${secondDeg}deg` }] },
              ]}
            >
              <View style={styles.secondHand} />
            </View>

            {/* Center Pin */}
            <View style={styles.centerPin} />
          </View>
        </View>
      </View>

      {/* Up Next Task Strip */}
      {nextTask ? (
        <View style={styles.upNextStrip}>
          <View style={styles.upNextLeft}>
            <View
              style={[
                styles.statusIndicatorDot,
                {
                  backgroundColor:
                    nextTask.status === "In Progress"
                      ? Colors.statusInProgress
                      : Colors.statusTodo,
                },
              ]}
            />
            <Text style={styles.upNextPrefix}>Up Next:</Text>
            <Text style={styles.upNextTitle} numberOfLines={1}>
              {nextTask.title}
            </Text>
          </View>
          <Text style={styles.upNextTime}>{nextTask.time}</Text>
        </View>
      ) : totalCount > 0 ? (
        <View style={styles.allDoneStrip}>
          <Ionicons
            name="checkmark-circle"
            size={14}
            color={Colors.statusDone}
          />
          <Text style={styles.allDoneText}>
            {"All tasks completed! Great work today."}
          </Text>
        </View>
      ) : null}

      {/* Bottom Progress Bar & Summary */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <View style={styles.progressLabelGroup}>
            <Text style={styles.progressLabel}>{"Today's Progress"}</Text>
            <View style={styles.statPillsRow}>
              {inProgressCount > 0 && (
                <View style={styles.statPill}>
                  <Text style={styles.statPillText}>
                    {inProgressCount} active
                  </Text>
                </View>
              )}
              {pendingCount > 0 && (
                <View style={styles.statPill}>
                  <Text style={styles.statPillText}>
                    {pendingCount} to do
                  </Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.progressStat}>
            {completedCount}/{totalCount} ({progressPercent}%)
          </Text>
        </View>

        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progressPercent}%`,
                backgroundColor:
                  progressPercent === 100
                    ? Colors.statusDone
                    : Colors.primary,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

export default WatchWidget;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 10,
    marginTop: 4,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  digitalCol: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  greetingText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
    letterSpacing: 0.2,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    marginBottom: 4,
  },
  timeMain: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  timeSeconds: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },
  ampmBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
    alignSelf: "center",
  },
  ampmText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  dateText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  analogContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 16,
  },
  clockDial: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: Colors.border,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  tickMark: {
    position: "absolute",
    backgroundColor: Colors.border,
  },
  tickTop: {
    top: 4,
    left: 37,
    width: 2,
    height: 5,
    borderRadius: 1,
  },
  tickBottom: {
    bottom: 4,
    left: 37,
    width: 2,
    height: 5,
    borderRadius: 1,
  },
  tickLeft: {
    left: 4,
    top: 37,
    width: 5,
    height: 2,
    borderRadius: 1,
  },
  tickRight: {
    right: 4,
    top: 37,
    width: 5,
    height: 2,
    borderRadius: 1,
  },
  handContainer: {
    position: "absolute",
    width: 76,
    height: 76,
    top: 0,
    left: 0,
    alignItems: "center",
  },
  hourHand: {
    width: 3.5,
    height: 20,
    marginTop: 18,
    borderRadius: 2,
    backgroundColor: Colors.textPrimary,
  },
  minuteHand: {
    width: 2.5,
    height: 26,
    marginTop: 12,
    borderRadius: 1.5,
    backgroundColor: Colors.textPrimary,
  },
  secondHand: {
    width: 1.5,
    height: 31,
    marginTop: 7,
    borderRadius: 1,
    backgroundColor: Colors.primary,
  },
  centerPin: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    top: 34,
    left: 34,
    zIndex: 10,
  },
  upNextStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 14,
  },
  upNextLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  statusIndicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  upNextPrefix: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  upNextTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  upNextTime: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.primary,
  },
  allDoneStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(74, 222, 128, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 14,
  },
  allDoneText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.statusDone,
  },
  progressSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  statPillsRow: {
    flexDirection: "row",
    gap: 4,
  },
  statPill: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  statPillText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  progressStat: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceLight,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
});
