import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ActionButton, SectionCard } from "@/components/safe-accept-ui";
import { useSafeAccept } from "@/lib/safe-accept-context";

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, setTuning, addEvent } = useSafeAccept();
  const [duration, setDuration] = useState(
    String(settings.longPressDurationMs),
  );
  const [delay, setDelay] = useState(String(settings.detectionDelayMs));

  function save() {
    const longPressDurationMs = Math.min(
      4000,
      Math.max(500, Number(duration) || 1600),
    );
    const detectionDelayMs = Math.min(3000, Math.max(0, Number(delay) || 0));
    setTuning({
      longPressDurationMs,
      detectionDelayMs,
      acceptMarker: "pressione e segure para atender",
    });
    addEvent(
      "config",
      "Parâmetros atualizados; execução automática mantida.",
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Ajustes</Text>
        <Text style={styles.subtitle}>
          As configurações são salvas somente neste aparelho.
        </Text>
      </View>

      <SectionCard title="Gesto e detecção">
        <View style={styles.field}>
          <Text style={styles.label}>Duração do toque (ms)</Text>
          <TextInput
            value={duration}
            onChangeText={setDuration}
            keyboardType="number-pad"
            style={styles.input}
            maxLength={4}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Atraso após evento (ms)</Text>
          <TextInput
            value={delay}
            onChangeText={setDelay}
            keyboardType="number-pad"
            style={styles.input}
            maxLength={4}
          />
        </View>
        <Text style={styles.helper}>
          A frase observada no Pop Driver é “PRESSIONE E SEGURE PARA ATENDER”.
          Ela é fixa por segurança: sem a frase completa visível, o serviço não
          pressiona. A duração só pode diminuir com respostas confirmadas; falhas
          de leitura nunca aumentam o melhor tempo já aprendido.
        </Text>
      </SectionCard>

      <ActionButton label="Salvar ajustes" icon="save" onPress={save} />
      <ActionButton
        label="Permissões Android"
        icon="settings-accessibility"
        variant="secondary"
        onPress={() => router.push("/permissoes")}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 34,
    gap: 16,
    backgroundColor: "#F7F9FC",
  },
  header: { gap: 8, paddingTop: 8 },
  title: {
    color: "#101828",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  subtitle: { color: "#475467", fontSize: 15, lineHeight: 22 },
  field: { gap: 6, marginTop: 2 },
  label: { color: "#344054", fontSize: 13, fontWeight: "800" },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    backgroundColor: "#FFFFFF",
    color: "#101828",
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  helper: { color: "#667085", fontSize: 13, lineHeight: 19, marginTop: 2 },
});
