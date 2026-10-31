import { Stack } from "expo-router";

import { SafeAcceptProvider } from "@/lib/safe-accept-context";

export default function RootLayout() {
  return (
    <SafeAcceptProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="diagnostico"
          options={{ headerShown: true, title: "Diagnóstico" }}
        />
      </Stack>
    </SafeAcceptProvider>
  );
}
