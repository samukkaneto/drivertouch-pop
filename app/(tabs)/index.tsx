import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { getReadiness } from "@/lib/calibration";
import {
  endDiagnostics,
  getNativeStatus,
  resumeSingleRide,
  setNativeInputMethod,
} from "@/lib/safe-accept-bridge";
import { useSafeAccept } from "@/lib/safe-accept-context";

export default function PanelScreen() {
  const router = useRouter();
  const { settings, isLoading, setArmed, disableNow, setBehavior } =
    useSafeAccept();
  const [singlePaused, setSinglePaused] = useState(false);
  const [nativeEnabled, setNativeEnabled] = useState(false);
  const [diagnosticMode, setDiagnosticMode] = useState(true);
  const [inputMethod, setInputMethod] = useState<"control" | "gesture">(
    "control",
  );
  const [changingMethod, setChangingMethod] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [effectiveDuration, setEffectiveDuration] = useState(
    settings.longPressDurationMs,
  );
  const [lastNativeEvent, setLastNativeEvent] = useState<string | null>(null);
  const readiness = getReadiness(settings);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const refresh = () =>
        getNativeStatus()
          .then((status) => {
            if (!mounted) return;
            setSinglePaused(status.singlePaused);
            setNativeEnabled(status.serviceEnabled);
            setDiagnosticMode(status.diagnosticMode);
            setInputMethod(status.inputMethod);
            setNotificationEnabled(status.notificationListenerEnabled);
            setEffectiveDuration(status.effectiveDurationMs);
            setLastNativeEvent(status.lastNativeEvent);
          })
          .catch(() => {
            if (!mounted) return;
            setNativeEnabled(false);
            setNotificationEnabled(false);
            setEffectiveDuration(settings.longPressDurationMs);
            setLastNativeEvent(null);
          });
      void refresh();
      const timer = setInterval(refresh, 1000);
      return () => {
        mounted = false;
        clearInterval(timer);
      };
    }, [settings.longPressDurationMs]),
  );

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color="#155EEF" size="large" />
      </View>
    );
  }

  const paused = settings.rideMode === "single" && singlePaused;
  const isActive =
    !diagnosticMode && settings.isArmed && settings.mode !== "off" && !paused;
  const statusColor = diagnosticMode
    ? "#B54708"
    : readiness.tone === "active"
      ? "#12B76A"
      : readiness.tone === "ready"
        ? "#155EEF"
        : "#667085";

  async function changeMethod(method: "control" | "gesture") {
    setChangingMethod(true);
    try {
      await disableNow();
      if (!(await setNativeInputMethod(method))) {
        Alert.alert(
          "Aguarde a tentativa atual",
          "Tente mudar o método novamente após a execução terminar.",
        );
        return;
      }
      setInputMethod(method);
    } catch {
      Alert.alert("Método não alterado", "Tente novamente.");
    } finally {
      setChangingMethod(false);
    }
  }

  async function handleArmedChange(armed: boolean, confirmed = false) {
    if (!armed) {
      disableNow();
      return;
    }
    if (!nativeEnabled) {
      Alert.alert(
        "Serviço Android desabilitado",
        "Ative o serviço de acessibilidade antes de armar a automação.",
      );
      return;
    }
    if (diagnosticMode && !confirmed) {
      Alert.alert(
        "Encerrar diagnóstico e ativar a automação?",
        inputMethod === "control"
          ? "O teste tentará o comando de pressionamento longo oferecido pelo cartão visível. Se não houver esse comando, encerrará a tentativa. Ainda precisa ser validado no PopMove."
          : "Isso volta a permitir os toques automáticos da versão anterior.",
        [
          { text: "Manter diagnóstico", style: "cancel" },
          {
            text: "Ativar automação",
            onPress: () => void handleArmedChange(true, true),
          },
        ],
      );
      return;
    }
    if (diagnosticMode) {
      const ended = await endDiagnostics().catch(() => false);
      if (!ended) return;
      setDiagnosticMode(false);
    }
    if (paused) {
      const resumed = await resumeSingleRide().catch(() => false);
      if (!resumed) {
        Alert.alert(
          "Aguarde a tentativa atual terminar",
          "Tente liberar novamente em alguns segundos.",
        );
        return;
      }
      setSinglePaused(false);
    }
    setArmed(true);
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.eyebrow}>
          <MaterialIcons name="shield" color="#155EEF" size={16} />
          <Text style={styles.eyebrowText}>POP DRIVER · CONTROLE LOCAL</Text>
        </View>
        <Text style={styles.title}>Toalha Vermelha</Text>
        <Text style={styles.subtitle}>
          Reconhece novas viagens do PopMove e executa o método de aceite
          selecionado.
        </Text>
      </View>

      <View style={[styles.statusCard, { borderColor: `${statusColor}55` }]}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <View style={styles.statusCopy}>
          <Text style={styles.statusTitle}>
            {diagnosticMode
              ? "Diagnóstico ativo"
              : paused
                ? "Uma corrida: pausado"
                : readiness.label}
          </Text>
          <Text style={styles.statusDetail}>
            {diagnosticMode
              ? "Execução pausada para observar as notificações e o aviso do PopMove."
              : paused
                ? "Libere a próxima oferta quando desejar."
                : readiness.detail}
          </Text>
        </View>
      </View>

      <SectionCard title="Método de aceite">
        <ActionButton
          label={`${inputMethod === "control" ? "✓ " : ""}Comando do cartão · teste`}
          icon="science"
          variant={inputMethod === "control" ? "primary" : "secondary"}
          disabled={changingMethod}
          onPress={() => void changeMethod("control")}
        />
        <ActionButton
          label={`${inputMethod === "gesture" ? "✓ " : ""}Toque anterior`}
          icon="touch-app"
          variant={inputMethod === "gesture" ? "primary" : "secondary"}
          disabled={changingMethod}
          onPress={() => void changeMethod("gesture")}
        />
        <Text style={styles.modeText}>
          {inputMethod === "control"
            ? "Teste: usa o pressionamento longo oferecido pelo cartão. Mantenha a oferta visível no PopMove. Se o comando não existir, registra o motivo e encerra; este método não rola a tela."
            : "Usa o toque prolongado da versão anterior e a rolagem para procurar a oferta."}
        </Text>
      </SectionCard>

      <SectionCard title="Resultado do teste">
        <Text style={styles.modeText}>
          Após a tentativa, registre se o aviso apareceu e compartilhe o
          relatório.
        </Text>
        <ActionButton
          label="Abrir diagnóstico"
          icon="science"
          onPress={() => router.push("/diagnostico")}
        />
      </SectionCard>

      <SectionCard title="Modo de corridas">
        <ActionButton
          label={
            settings.rideMode === "single" ? "✓ Uma corrida" : "Uma corrida"
          }
          icon="looks-one"
          variant={settings.rideMode === "single" ? "primary" : "secondary"}
          onPress={() => setBehavior({ rideMode: "single" })}
        />
        <ActionButton
          label={
            settings.rideMode === "continuous"
              ? "✓ Corridas seguidas"
              : "Corridas seguidas"
          }
          icon="repeat"
          variant={settings.rideMode === "continuous" ? "primary" : "secondary"}
          onPress={() => setBehavior({ rideMode: "continuous" })}
        />
        <Text style={styles.modeText}>
          {settings.rideMode === "single"
            ? "Processa uma oferta e pausa, mesmo se o comando estiver indisponível. Libere a próxima pelo painel."
            : inputMethod === "control"
              ? "Processa novas ofertas que estejam visíveis, inclusive durante uma corrida em andamento."
              : "Continua procurando ofertas, inclusive durante uma corrida em andamento."}
        </Text>
        {paused ? (
          <ActionButton
            label="Liberar próxima corrida"
            icon="play-arrow"
            onPress={() => handleArmedChange(true)}
          />
        ) : null}
      </SectionCard>

      <SectionCard title="Execução automática">
        <View style={styles.modeWrap}>
          <Text style={styles.modeTitle}>
            {diagnosticMode
              ? "Pausada para diagnóstico"
              : paused
                ? "Pausada após uma oferta"
                : isActive
                  ? "Ativa"
                  : "Desligada"}
          </Text>
          <Text style={styles.modeText}>
            {isActive
              ? inputMethod === "control"
                ? "Aguardando um cartão visível com comando disponível."
                : "Reconhecimento imediato, rolagem de fila e toque prolongado adaptativo."
              : "Nenhuma corrida será aceita automaticamente."}
          </Text>
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.switchTitle}>
              Aceitar corridas automaticamente
            </Text>
            <Text style={styles.switchText}>
              {!settings.calibration
                ? "Calibre a frase de aceite primeiro."
                : !nativeEnabled
                  ? "Ative o serviço Android primeiro."
                  : settings.rideMode === "single"
                    ? "Pausa após uma tentativa de aceite."
                    : "Permanece ativa até você desligar."}
            </Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={handleArmedChange}
            disabled={!settings.calibration || !nativeEnabled || changingMethod}
            trackColor={{ false: "#D0D5DD", true: "#84ADFF" }}
            thumbColor={isActive ? "#155EEF" : "#FFFFFF"}
          />
        </View>
      </SectionCard>

      <SectionCard title="Checklist de preparo">
        <KeyValue
          label="Serviço Android"
          value={nativeEnabled ? "Habilitado" : "Aguardando ativação"}
        />
        <KeyValue
          label="Referência da frase"
          value={settings.calibration ? "Confirmada" : "Pendente"}
        />
        <KeyValue
          label="Notificações"
          value={notificationEnabled ? "Habilitadas" : "Aguardando ativação"}
        />
        <KeyValue
          label={
            inputMethod === "control"
              ? "Método selecionado"
              : "Melhor duração protegida"
          }
          value={
            inputMethod === "control"
              ? "Comando do cartão · teste"
              : `${effectiveDuration} ms`
          }
        />
        <KeyValue
          label="Último evento nativo"
          value={lastNativeEvent?.replace(/^\d+:\s*/, "") ?? "Nenhum"}
          last
        />
      </SectionCard>

      <View style={styles.actions}>
        <ActionButton
          label={settings.calibration ? "Recalibrar frase" : "Calibrar frase"}
          icon="my-location"
          onPress={() => router.push("./calibrar")}
        />
        <ActionButton
          label="Abrir permissões Android"
          icon="settings-accessibility"
          variant="secondary"
          onPress={() => router.push("./permissoes")}
        />
        {isActive ? (
          <ActionButton
            label="Desligar execução automática"
            icon="power-settings-new"
            variant="danger"
            onPress={() => disableNow()}
          />
        ) : null}
      </View>

      <View style={styles.note}>
        <MaterialIcons color="#475467" name="info-outline" size={18} />
        <Text style={styles.noteText}>
          A oferta é confirmada pelo texto “PRESSIONE E SEGURE PARA ATENDER”. O
          teste do comando ainda precisa de confirmação no aparelho. Uma
          resposta do Android não confirma que a corrida foi aceita.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F9FC",
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 36,
    backgroundColor: "#F7F9FC",
  },
  hero: { gap: 8, paddingTop: 8 },
  eyebrow: { flexDirection: "row", alignItems: "center", gap: 6 },
  eyebrowText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "800",
    letterSpacing: 0.75,
    color: "#155EEF",
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    color: "#101828",
    letterSpacing: -0.7,
  },
  subtitle: { fontSize: 16, lineHeight: 23, color: "#475467" },
  statusCard: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  statusCopy: { flex: 1, gap: 4 },
  statusTitle: { color: "#101828", fontSize: 16, fontWeight: "800" },
  statusDetail: { color: "#475467", fontSize: 14, lineHeight: 20 },
  modeWrap: { gap: 4 },
  modeTitle: { color: "#101828", fontSize: 18, fontWeight: "800" },
  modeText: { color: "#475467", fontSize: 14, lineHeight: 20 },
  switchRow: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 14,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#EAECF0",
    alignItems: "center",
  },
  switchCopy: { flex: 1, gap: 2 },
  switchTitle: { fontSize: 15, fontWeight: "700", color: "#101828" },
  switchText: { fontSize: 13, color: "#667085", lineHeight: 18 },
  actions: { gap: 10 },
  note: {
    flexDirection: "row",
    gap: 9,
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#EAECF0",
  },
  noteText: { flex: 1, color: "#475467", fontSize: 13, lineHeight: 19 },
});
