import { Stack } from "expo-router";

import "../global.css";
import { SafeAcceptProvider } from "@/lib/safe-accept-context";

export default function RootLayout() {
  return (
    <SafeAcceptProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAcceptProvider>
  );
}
