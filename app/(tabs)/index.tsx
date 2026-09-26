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
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [effectiveDuration, setEffectiveDuration] = useState(
    settings.longPressDurationMs,
  );
  const [lastNativeEvent, setLastNativeEvent] = useState<string | null>(null);
  const readiness = getReadiness(settings);

  useFocusEffect(
    useCallback(() => {
      getNativeStatus()
        .then((status) => {
          setNativeEnabled(status.serviceEnabled);
          setNotificationEnabled(status.notificationListenerEnabled);
          setEffectiveDuration(status.effectiveDurationMs);
          setLastNativeEvent(status.lastNativeEvent);
        })
        .catch(() => {
          setNativeEnabled(false);
          setNotificationEnabled(false);
          setEffectiveDuration(settings.longPressDurationMs);
          setLastNativeEvent(null);
        });
    }, [settings.longPressDurationMs]),
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
      : readiness.tone === "ready"
        ? "#155EEF"
        : "#667085";

  function handleArmedChange(armed: boolean) {
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
          Reconhece novas viagens do Pop Driver e segura automaticamente o
          cartão da corrida.
        </Text>
      </View>

      <View style={[styles.statusCard, { borderColor: `${statusColor}55` }]}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <View style={styles.statusCopy}>
          <Text style={styles.statusTitle}>{readiness.label}</Text>
          <Text style={styles.statusDetail}>{readiness.detail}</Text>
        </View>
      </View>

      <SectionCard title="Execução automática">
        <View style={styles.modeWrap}>
          <Text style={styles.modeTitle}>
            {isActive ? "Ativa" : "Desligada"}
          </Text>
          <Text style={styles.modeText}>
            {isActive
              ? "Reconhecimento imediato, rolagem de fila e toque prolongado adaptativo."
              : "Nenhuma corrida será aceita automaticamente."}
          </Text>
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.switchTitle}>Aceitar corridas automaticamente</Text>
            <Text style={styles.switchText}>
              {!settings.calibration
                ? "Calibre a frase de aceite primeiro."
                : !nativeEnabled
                  ? "Ative o serviço Android primeiro."
                  : "Permanece ativa até você desligar."}
            </Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={handleArmedChange}
            disabled={
              !settings.calibration || !nativeEnabled
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
          label="Referência da frase"
          value={settings.calibration ? "Confirmada" : "Pendente"}
        />
        <KeyValue
          label="Notificações"
          value={notificationEnabled ? "Habilitadas" : "Aguardando ativação"}
        />
        <KeyValue
          label="Melhor duração protegida"
          value={`${effectiveDuration} ms`}
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
          A oferta é confirmada pelo texto “PRESSIONE E SEGURE PARA ATENDER”.
          Quando outra corrida chega durante uma viagem, o serviço rola até o
          cartão aparecer; se o POP driver já está aberto, não tenta abri-lo de novo.
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
