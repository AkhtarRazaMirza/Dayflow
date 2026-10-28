import Colors from "@/constants/Colors";
import { useTasks } from "@/context/TaskContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tasks, resetTasks, clearCompleted } = useTasks();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const completedCount = tasks.filter((t) => t.status === "Done").length;

  const handleClearCompleted = () => {
    if (completedCount === 0) {
      Alert.alert("No Completed Tasks", "There are no completed tasks to clear.");
      return;
    }

    Alert.alert(
      "Clear Completed Tasks",
      `Are you sure you want to remove ${completedCount} completed task(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            clearCompleted();
            Alert.alert("Success", "Completed tasks have been cleared.");
          },
        },
      ]
    );
  };

  const handleResetDefaults = () => {
    Alert.alert(
      "Reset All Tasks",
      "This will restore the original 4 sample tasks. Any tasks you created will be replaced.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            resetTasks();
            Alert.alert("Reset Complete", "Tasks restored to default.");
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/")}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Settings</Text>

        <View style={styles.iconButtonPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>D</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Personal Workspace</Text>
            <Text style={styles.profileSubtitle}>
              {tasks.length} active tasks scheduled
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>Active</Text>
          </View>
        </View>

        {/* Preferences Section */}
        <Text style={styles.sectionHeader}>Preferences</Text>
        <View style={styles.sectionCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelRow}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.settingTitle}>Task Reminders</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: Colors.surfaceLight, true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLabelRow}>
              <Ionicons
                name="hardware-chip-outline"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.settingTitle}>Haptic Feedback</Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{ false: Colors.surfaceLight, true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLabelRow}>
              <Ionicons
                name="volume-medium-outline"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.settingTitle}>Sound Effects</Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: Colors.surfaceLight, true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Data & Storage Section */}
        <Text style={styles.sectionHeader}>Task Management</Text>
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleClearCompleted}
            activeOpacity={0.7}
          >
            <View style={styles.settingLabelRow}>
              <Ionicons
                name="trash-bin-outline"
                size={20}
                color={Colors.statusInProgress}
              />
              <View>
                <Text style={styles.settingTitle}>Clear Completed Tasks</Text>
                <Text style={styles.actionSubtitle}>
                  {completedCount} task(s) marked done
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleResetDefaults}
            activeOpacity={0.7}
          >
            <View style={styles.settingLabelRow}>
              <Ionicons
                name="refresh-outline"
                size={20}
                color={Colors.primary}
              />
              <View>
                <Text style={styles.settingTitle}>Reset to Defaults</Text>
                <Text style={styles.actionSubtitle}>
                  Restore original sample tasks
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* App Info Section */}
        <Text style={styles.sectionHeader}>About</Text>
        <View style={styles.sectionCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Application</Text>
            <Text style={styles.infoValue}>Dayflow</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Framework</Text>
            <Text style={styles.infoValue}>Expo SDK 58 / React Native</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  iconButtonPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  profileSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "rgba(74, 222, 128, 0.15)",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.statusDone,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    marginBottom: 22,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  settingLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  actionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
});
