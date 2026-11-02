import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import {
  ActionButton,
  KeyValue,
  SectionCard,
} from "@/components/safe-accept-ui";
import { automationStatus } from "@/lib/automation-status";
import { getNativeStatus } from "@/lib/safe-accept-bridge";
import { useSafeAccept } from "@/lib/safe-accept-context";

type Status = Awaited<ReturnType<typeof getNativeStatus>>;

export default function PanelScreen() {
  const router = useRouter();
  const { settings, isLoading, setArmed, setBehavior } = useSafeAccept();
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const refresh = async () => {
        try {
          const next = await getNativeStatus();
          if (active) {
            setStatus(next);
            setError(false);
          }
        } catch {
          if (active) setError(true);
        }
      };
      void refresh();
      const timer = setInterval(() => {
        if (AppState.currentState === "active") void refresh();
      }, 1000);
      return () => {
        active = false;
        clearInterval(timer);
      };
    }, []),
  );

  async function toggle(enabled: boolean) {
    setBusy(true);
    try {
      const result = await setArmed(enabled);
      setStatus(await getNativeStatus());
      setError(false);
      if (enabled && !result.enabled) {
        const message =
          result.reason === "accessibility_disconnected"
            ? "A permissão está ligada, mas o serviço ainda não conectou. Confira os ajustes de Acessibilidade."
            : "Habilite a Acessibilidade do Toalha Vermelha nos ajustes Android e ligue a chave novamente.";
        Alert.alert("Não foi possível ligar", message, [
          { text: "Voltar", style: "cancel" },
          {
            text: "Abrir permissões",
            onPress: () => router.push("/permissoes"),
          },
        ]);
      }
    } catch {
      setError(true);
      Alert.alert(
        "Não foi possível alterar a chave",
        "Confira o estado exibido e tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (isLoading || !status)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#155EEF" />
        <Text>Carregando estado do Android…</Text>
      </View>
    );
  const summary = automationStatus(status);
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Toalha Vermelha</Text>
      <Text style={styles.subtitle}>
        Aceite automático de corridas do PopMove.
      </Text>
      <SectionCard title="Ativação">
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.switchTitle}>
              {status.armed ? "Ligado" : "Desligado"}
            </Text>
            <Text style={styles.body}>Controle a execução por esta chave.</Text>
          </View>
          <Switch
            accessibilityLabel="Ligar ou desligar Toalha Vermelha"
            value={status.armed}
            onValueChange={(value) => void toggle(value)}
            disabled={busy || !status.nativeModuleAvailable}
            trackColor={{ false: "#D0D5DD", true: "#84ADFF" }}
            thumbColor={status.armed ? "#155EEF" : "#FFFFFF"}
          />
        </View>
        <Text accessibilityLiveRegion="polite" style={styles.state}>
          {summary.title}
        </Text>
        <Text style={styles.body}>{summary.detail}</Text>
        {error ? (
          <Text style={styles.error}>
            Não foi possível atualizar o estado do Android. Aguarde a
            atualização da tela.
          </Text>
        ) : null}
      </SectionCard>
      <SectionCard title="Modo de corridas">
        <ActionButton
          label={`${settings.rideMode === "single" ? "✓ " : ""}Uma por vez`}
          icon="looks-one"
          variant={settings.rideMode === "single" ? "primary" : "secondary"}
          disabled={busy}
          onPress={() => setBehavior({ rideMode: "single" })}
        />
        <ActionButton
          label={`${settings.rideMode === "continuous" ? "✓ " : ""}Simultâneas`}
          icon="repeat"
          variant={settings.rideMode === "continuous" ? "primary" : "secondary"}
          disabled={busy}
          onPress={() => setBehavior({ rideMode: "continuous" })}
        />
        <Text style={styles.body}>
          {settings.rideMode === "single"
            ? "Enquanto estiver em uma corrida, aguarda. Quando voltar à tela de espera do PopMove, aceita a próxima automaticamente. Este modo não rola a tela."
            : "Permite aceitar outras ofertas durante uma corrida. Pode usar rolagem para localizar o cartão da nova oferta."}
        </Text>
      </SectionCard>
      <SectionCard title="Estado do Android">
        <KeyValue
          label="Acessibilidade"
          value={status.serviceConnected ? "Conectada" : "Aguardando conexão"}
        />
        <KeyValue
          label="Notificações"
          value={
            status.notificationListenerEnabled
              ? "Habilitadas"
              : "Aguardando ativação"
          }
        />
        <KeyValue
          label="Último evento"
          value={status.lastNativeEvent?.replace(/^\d+:\s*/, "") ?? "Nenhum"}
          last
        />
      </SectionCard>
      <ActionButton
        label="Permissões Android"
        icon="settings-accessibility"
        variant="secondary"
        onPress={() => router.push("/permissoes")}
      />
      <ActionButton
        label="Relatório"
        icon="description"
        variant="secondary"
        onPress={() => router.push("/diagnostico")}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#F7F9FC",
  },
  content: {
    padding: 20,
    paddingBottom: 36,
    gap: 16,
    backgroundColor: "#F7F9FC",
  },
  title: { fontSize: 32, lineHeight: 39, fontWeight: "800", color: "#101828" },
  subtitle: { fontSize: 16, lineHeight: 23, color: "#475467" },
  body: { fontSize: 14, lineHeight: 21, color: "#475467" },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  switchCopy: { flex: 1, gap: 4 },
  switchTitle: { fontSize: 24, fontWeight: "800", color: "#101828" },
  state: { fontSize: 16, lineHeight: 23, fontWeight: "700", color: "#155EEF" },
  error: { color: "#B42318", fontSize: 14, lineHeight: 21 },
});
