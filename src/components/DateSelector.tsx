import Colors from "@/constants/Colors";
import React, { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type DateItem = {
  month: string;
  day: number;
  weekday: string;
  key: string;
  isToday: boolean;
};

export const formatDateKey = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const generateRealtimeDates = (): {
  dates: DateItem[];
  todayKey: string;
} => {
  const now = new Date();
  const todayKey = formatDateKey(now);
  const dates: DateItem[] = [];

  // Generate 14 days: 3 past days, today, and 10 future days
  for (let i = -3; i <= 10; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    dates.push({
      month: d.toLocaleDateString("en-US", { month: "short" }),
      day: d.getDate(),
      weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
      key: formatDateKey(d),
      isToday: i === 0,
    });
  }

  return { dates, todayKey };
};

type DateSelectorProps = {
  selectedDate?: string;
  onSelectDate?: (dateKey: string) => void;
};

const DateSelector = ({
  selectedDate: controlledDate,
  onSelectDate,
}: DateSelectorProps) => {
  const [{ dates, todayKey }] = useState(generateRealtimeDates);
  const [internalDate, setInternalDate] = useState(todayKey);
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  const selectedDate = controlledDate ?? internalDate;

  // Center today in view on initial render
  useEffect(() => {
    const todayIndex = dates.findIndex((d) => d.isToday);
    if (todayIndex > 0 && scrollViewRef.current) {
      const itemWidth = 80;
      const scrollX = Math.max(0, todayIndex * itemWidth - 16);
      scrollViewRef.current.scrollTo({ x: scrollX, animated: false });
    }
  }, [dates]);

  const handleSelect = (key: string) => {
    setInternalDate(key);
    onSelectDate?.(key);
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {dates.map((item) => {
        const isSelected = item.key === selectedDate;

        return (
          <TouchableOpacity
            key={item.key}
            style={[styles.dateItem, isSelected && styles.dateItemSelected]}
            onPress={() => handleSelect(item.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.month, isSelected && styles.selectedText]}>
              {item.month}
            </Text>

            <Text style={[styles.day, isSelected && styles.selectedText]}>
              {item.day}
            </Text>

            <Text style={[styles.weekday, isSelected && styles.selectedText]}>
              {item.weekday}
            </Text>

            {/* Subtle "Today" indicator dot when viewing other days */}
            {item.isToday && !isSelected && (
              <View style={styles.todayIndicatorDot} />
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

export default DateSelector;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 10,
  },
  dateItem: {
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 64,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    position: "relative",
  },
  dateItemSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  month: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  day: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  weekday: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  selectedText: {
    color: "#FFFFFF",
  },
  todayIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 4,
  },
});
