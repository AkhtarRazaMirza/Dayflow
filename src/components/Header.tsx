import Colors from "@/constants/Colors";
import { useTasks } from "@/context/TaskContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const STATUS_COLOR = {
  Done: Colors.statusDone,
  "In Progress": Colors.statusInProgress,
  "To-do": Colors.statusTodo,
};

type HeaderProps = {
  title?: string;
  onBack?: () => void;
};

const Header = ({ title = "Today's Task", onBack }: HeaderProps) => {
  const router = useRouter();
  const { tasks } = useTasks();
  const [modalVisible, setModalVisible] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const unreadCount = tasks.filter(
    (t) => t.status !== "Done" && !readIds.has(t.id)
  ).length;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      Alert.alert("Dayflow", "You are on the Home screen.");
    }
  };

  const handleOpenNotifications = () => {
    setModalVisible(true);
  };

  const handleMarkAllAsRead = () => {
    setReadIds(new Set(tasks.map((t) => t.id)));
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleBack}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.title}>{title}</Text>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleOpenNotifications}
          activeOpacity={0.7}
          accessibilityLabel="Notifications"
        >
          <Ionicons
            name="notifications-outline"
            size={22}
            color={Colors.textPrimary}
          />
          {unreadCount > 0 && <View style={styles.badge} />}
        </TouchableOpacity>
      </View>

      {/* Notifications Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons
                  name="notifications"
                  size={20}
                  color={Colors.primary}
                />
                <Text style={styles.modalTitle}>Notifications</Text>
                {unreadCount > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{unreadCount}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
                activeOpacity={0.7}
                accessibilityLabel="Close notifications"
              >
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Notification items */}
            <ScrollView
              style={styles.notifList}
              showsVerticalScrollIndicator={false}
            >
              {tasks.length === 0 ? (
                <Text style={styles.emptyText}>No active notifications</Text>
              ) : (
                tasks.map((item) => {
                  const isRead = item.status === "Done" || readIds.has(item.id);
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.notifItem,
                        !isRead && styles.notifItemUnread,
                      ]}
                    >
                      <View style={styles.notifHeader}>
                        <Text style={styles.notifCategory}>
                          {item.category}
                        </Text>
                        <Text
                          style={[
                            styles.notifStatus,
                            {
                              color:
                                STATUS_COLOR[
                                  item.status as keyof typeof STATUS_COLOR
                                ],
                            },
                          ]}
                        >
                          {item.status}
                        </Text>
                      </View>

                      <Text style={styles.notifItemTitle}>{item.title}</Text>

                      <View style={styles.notifFooter}>
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color={Colors.primary}
                        />
                        <Text style={styles.notifTime}>{item.time}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  style={styles.markReadBtn}
                  onPress={handleMarkAllAsRead}
                  activeOpacity={0.7}
                >
                  <Text style={styles.markReadText}>Mark all as read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.doneBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
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
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  countBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
  },
  notifList: {
    paddingVertical: 12,
  },
  notifItem: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notifItemUnread: {
    borderColor: Colors.primary,
  },
  notifHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  notifCategory: {
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
  },
  notifStatus: {
    fontSize: 11,
    fontWeight: "600",
  },
  notifItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  notifFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  notifTime: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "500",
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: "center",
    paddingVertical: 20,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  markReadBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primaryMuted,
  },
  markReadText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },
  doneBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
  },
  doneBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
});
