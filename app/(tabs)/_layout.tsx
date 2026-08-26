import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#155EEF",
        tabBarInactiveTintColor: "#667085",
        tabBarStyle: { height: Platform.select({ ios: 82, default: 66 }), paddingTop: 8, backgroundColor: "#FFFFFF", borderTopColor: "#EAECF0" },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Painel", tabBarIcon: ({ color }) => <MaterialIcons name="dashboard" size={22} color={color} /> }} />
      <Tabs.Screen name="calibrar" options={{ title: "Calibrar", tabBarIcon: ({ color }) => <MaterialIcons name="my-location" size={22} color={color} /> }} />
      <Tabs.Screen name="registro" options={{ title: "Registro", tabBarIcon: ({ color }) => <MaterialIcons name="history" size={22} color={color} /> }} />
      <Tabs.Screen name="ajustes" options={{ title: "Ajustes", tabBarIcon: ({ color }) => <MaterialIcons name="tune" size={22} color={color} /> }} />
      <Tabs.Screen name="permissoes" options={{ href: null }} />
    </Tabs>
  );
}
