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
import { getNativeStatus } from "@/lib/safe-accept-bridge";
import { useSafeAccept } from "@/lib/safe-accept-context";

export default function PanelScreen() {
  const router = useRouter();
  const { settings, isLoading, setArmed, disableNow } = useSafeAccept();
  const [nativeEnabled, setNativeEnabled] = useState(false);
  const [lastNativeEvent, setLastNativeEvent] = useState<string | null>(null);
  const readiness = getReadiness(settings);

  useFocusEffect(
    useCallback(() => {
      getNativeStatus()
        .then((status) => {
          setNativeEnabled(status.serviceEnabled);
          setLastNativeEvent(status.lastNativeEvent);
        })
        .catch(() => {
          setNativeEnabled(false);
          setLastNativeEvent(null);
        });
    }, []),
  );

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color="#155EEF" size="large" />
      </View>
    );
  }

  const isActive = settings.isArmed && settings.mode !== "off";
  const statusColor =
    readiness.tone === "active"
      ? "#12B76A"
      : readiness.tone === "test"
        ? "#F79009"
        : readiness.tone === "ready"
          ? "#155EEF"
          : "#667085";

  function handleArmedChange(armed: boolean) {
    if (!armed) {
      setArmed(false);
      return;
    }
    if (!nativeEnabled) {
      Alert.alert(
        "Serviço Android desabilitado",
        "Ative o serviço de acessibilidade antes de armar a automação.",
      );
      return;
    }
    if (settings.mode === "assist") {
      Alert.alert(
        "Armar modo assistido?",
        "Depois de confirmado, uma aparição compatível no POP driver poderá gerar um toque prolongado. Faça o primeiro teste com o veículo parado.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Armar",
            style: "destructive",
            onPress: () => setArmed(true),
          },
        ],
      );
      return;
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
        <Text style={styles.title}>DriverTouch Pop</Text>
        <Text style={styles.subtitle}>
          Prepare o modo assistido, calibre o toque e acompanhe o estado no
          próprio aparelho.
        </Text>
      </View>

      <View style={[styles.statusCard, { borderColor: `${statusColor}55` }]}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <View style={styles.statusCopy}>
          <Text style={styles.statusTitle}>{readiness.label}</Text>
          <Text style={styles.statusDetail}>{readiness.detail}</Text>
        </View>
      </View>

      <SectionCard title="Modo selecionado">
        <View style={styles.modeWrap}>
          <Text style={styles.modeTitle}>
            {settings.mode === "test"
              ? "Teste"
              : settings.mode === "assist"
                ? "Assistido"
                : "Desligado"}
          </Text>
          <Text style={styles.modeText}>
            {settings.mode === "test"
              ? "Registra a preparação sem executar toque."
              : settings.mode === "assist"
                ? "Usa os parâmetros configurados quando o serviço estiver habilitado."
                : "Nenhuma ação será tentada."}
          </Text>
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.switchTitle}>Armar assistente</Text>
            <Text style={styles.switchText}>
              {!settings.calibration
                ? "Calibre o ponto primeiro."
                : !nativeEnabled
                  ? "Ative o serviço Android primeiro."
                  : "Pronto para ser armado nesta sessão."}
            </Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={handleArmedChange}
            disabled={
              !settings.calibration || settings.mode === "off" || !nativeEnabled
            }
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
          label="Ponto de toque"
          value={settings.calibration ? "Calibrado" : "Pendente"}
        />
        <KeyValue
          label="Duração"
          value={`${settings.longPressDurationMs} ms`}
        />
        <KeyValue
          label="Último evento nativo"
          value={lastNativeEvent?.replace(/^\d+:\s*/, "") ?? "Nenhum"}
          last
        />
      </SectionCard>

      <View style={styles.actions}>
        <ActionButton
          label={settings.calibration ? "Recalibrar toque" : "Calibrar toque"}
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
            label="Desarmar automação"
            icon="power-settings-new"
            variant="danger"
            onPress={() => disableNow()}
          />
        ) : null}
      </View>

      <View style={styles.note}>
        <MaterialIcons color="#475467" name="info-outline" size={18} />
        <Text style={styles.noteText}>
          O primeiro teste deve ser feito com o veículo parado e no modo de
          teste. Desarmar impede gestos; para revogar totalmente a permissão,
          use as configurações de Acessibilidade do Android.
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
