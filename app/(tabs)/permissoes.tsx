import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ActionButton, KeyValue, SectionCard } from "@/components/safe-accept-ui";
import { getNativeStatus, openNativeAccessibilitySettings } from "@/lib/safe-accept-bridge";

export default function PermissionsScreen() {
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState(false);
  const [moduleAvailable, setModuleAvailable] = useState(false);

  const refresh = useCallback(() => {
    getNativeStatus().then((status) => { setIsEnabled(status.serviceEnabled); setModuleAvailable(status.nativeModuleAvailable); }).catch(() => undefined);
  }, []);
  useFocusEffect(refresh);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}><Text style={styles.title}>Permissões Android</Text><Text style={styles.subtitle}>Ative o serviço somente no aparelho de teste. A ativação é feita pela tela do próprio Android.</Text></View>
      <SectionCard title="Estado atual">
        <KeyValue label="Integração Android" value={moduleAvailable ? "Disponível na build" : "Requer APK de teste"} />
        <KeyValue label="Serviço de acessibilidade" value={isEnabled ? "Habilitado" : "Desabilitado"} last />
      </SectionCard>
      <SectionCard title="Como ativar">
        <View style={styles.step}><View style={styles.number}><Text style={styles.numberText}>1</Text></View><Text style={styles.stepText}>Toque em “Abrir ajustes de acessibilidade”.</Text></View>
        <View style={styles.step}><View style={styles.number}><Text style={styles.numberText}>2</Text></View><Text style={styles.stepText}>Localize “PopMove Safe Accept” na lista de serviços instalados.</Text></View>
        <View style={styles.step}><View style={styles.number}><Text style={styles.numberText}>3</Text></View><Text style={styles.stepText}>Habilite o serviço e retorne para confirmar o estado nesta tela.</Text></View>
        <View style={styles.info}><MaterialIcons name="science" color="#155EEF" size={18} /><Text style={styles.infoText}>No primeiro uso, mantenha o modo de teste. Ele não deve enviar um gesto de toque.</Text></View>
      </SectionCard>
      <ActionButton label="Abrir ajustes de acessibilidade" icon="settings-accessibility" onPress={() => openNativeAccessibilitySettings()} disabled={!moduleAvailable} />
      <ActionButton label="Atualizar estado" icon="refresh" variant="secondary" onPress={refresh} />
      <ActionButton label="Voltar ao painel" icon="arrow-back" variant="secondary" onPress={() => router.replace("/")} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 34, gap: 16, backgroundColor: "#F7F9FC" },
  header: { gap: 8, paddingTop: 8 },
  title: { color: "#101828", fontSize: 28, lineHeight: 34, fontWeight: "800", letterSpacing: -0.4 },
  subtitle: { color: "#475467", fontSize: 15, lineHeight: 22 },
  step: { flexDirection: "row", gap: 12, alignItems: "flex-start", paddingVertical: 4 },
  number: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#EFF4FF" },
  numberText: { color: "#155EEF", fontSize: 12, fontWeight: "800" },
  stepText: { flex: 1, color: "#344054", fontSize: 14, lineHeight: 20, paddingTop: 2 },
  info: { flexDirection: "row", gap: 8, padding: 12, borderRadius: 12, backgroundColor: "#EFF4FF", marginTop: 6 },
  infoText: { flex: 1, color: "#1849A9", fontSize: 13, lineHeight: 19 },
});
