import { MaterialIcons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type IconName = ComponentProps<typeof MaterialIcons>["name"];

export function ActionButton({
  label,
  icon,
  onPress,
  variant = "primary",
  disabled = false,
}: {
  label: string;
  icon: IconName;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        (pressed || disabled) && styles.buttonPressed,
        disabled && styles.disabled,
      ]}
    >
      <MaterialIcons
        color={variant === "secondary" ? "#155EEF" : "#FFFFFF"}
        name={icon}
        size={20}
      />
      <Text
        style={[
          styles.buttonText,
          variant === "secondary" && styles.buttonTextSecondary,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function SectionCard({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

export function KeyValue({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 18,
  },
  primary: { backgroundColor: "#155EEF" },
  secondary: {
    backgroundColor: "#EFF4FF",
    borderWidth: 1,
    borderColor: "#B2CCFF",
  },
  danger: { backgroundColor: "#D92D20" },
  buttonPressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.42 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  buttonTextSecondary: { color: "#155EEF" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E4E7EC",
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitle: { color: "#101828", fontSize: 16, fontWeight: "800" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EAECF0",
  },
  rowLabel: { color: "#475467", fontSize: 14, flex: 1 },
  rowValue: {
    color: "#101828",
    fontSize: 14,
    fontWeight: "700",
    maxWidth: "56%",
    textAlign: "right",
  },
});
