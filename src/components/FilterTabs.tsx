import Colors from "@/constants/Colors";
import { FILTER_OPTIONS, FilterOptions } from "@/constants/tasks";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type FilterTabsProps = {
  selected: FilterOptions;
  onSelect: (filter: FilterOptions) => void;
  counts?: Record<FilterOptions, number>;
};

const FilterTabs = ({ selected, onSelect, counts }: FilterTabsProps) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FILTER_OPTIONS.map((item) => {
        const isSelected = item === selected;
        const count = counts?.[item];

        return (
          <TouchableOpacity
            key={item}
            style={[styles.tab, isSelected && styles.tabSelected]}
            onPress={() => onSelect(item)}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              <Text
                style={[styles.tabText, isSelected && styles.tabTextSelected]}
              >
                {item}
              </Text>
              {count !== undefined && (
                <View
                  style={[
                    styles.countBadge,
                    isSelected && styles.countBadgeSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      isSelected && styles.countTextSelected,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

export default FilterTabs;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 10,
    paddingVertical: 12,
  },
  tab: {
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  tabTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  countBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 18,
    alignItems: "center",
  },
  countBadgeSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  countText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  countTextSelected: {
    color: "#FFFFFF",
  },
});
