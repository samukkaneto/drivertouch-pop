import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import {
  ActionButton,
  KeyValue,
  SectionCard,
} from "@/components/safe-accept-ui";
import {
  getNativeStatus,
  openNativeAccessibilitySettings,
  openNativeNotificationSettings,
} from "@/lib/safe-accept-bridge";

export default function PermissionsScreen() {
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState(false);
  const [moduleAvailable, setModuleAvailable] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  const refresh = useCallback(() => {
    getNativeStatus()
      .then((status) => {
        setIsEnabled(status.serviceEnabled);
        setModuleAvailable(status.nativeModuleAvailable);
        setNotificationEnabled(status.notificationListenerEnabled);
      })
      .catch(() => undefined);
  }, []);
  useFocusEffect(refresh);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Permissões de execução</Text>
        <Text style={styles.subtitle}>
          Acessibilidade executa o toque no cartão. Notificações identificam e
          abrem uma nova viagem, inclusive durante outra corrida.
        </Text>
      </View>
      <SectionCard title="Estado atual">
        <KeyValue
          label="Integração Android"
          value={
            moduleAvailable ? "Disponível" : "Indisponível nesta instalação"
          }
        />
        <KeyValue
          label="Serviço de acessibilidade"
          value={isEnabled ? "Habilitado" : "Desabilitado"}
          last
        />
      </SectionCard>
      <SectionCard title="Como ativar">
        <View style={styles.step}>
          <View style={styles.number}>
            <Text style={styles.numberText}>1</Text>
          </View>
          <Text style={styles.stepText}>
            Toque em “Abrir ajustes de acessibilidade”.
          </Text>
        </View>
        <View style={styles.step}>
          <View style={styles.number}>
            <Text style={styles.numberText}>2</Text>
          </View>
          <Text style={styles.stepText}>
            Localize “DriverTouch Pop” na lista de serviços instalados.
          </Text>
        </View>
        <View style={styles.step}>
          <View style={styles.number}>
            <Text style={styles.numberText}>3</Text>
          </View>
          <Text style={styles.stepText}>
            Habilite o serviço e retorne para confirmar o estado nesta tela.
          </Text>
        </View>
        <View style={styles.info}>
          <MaterialIcons name="touch-app" color="#155EEF" size={18} />
          <Text style={styles.infoText}>
            Com o serviço habilitado e a execução ativa, o DriverTouch segura o
            cartão quando encontra “PRESSIONE E SEGURE PARA ATENDER”.
          </Text>
        </View>
      </SectionCard>
      <SectionCard title="Notificações do PopDriver">
        <KeyValue
          label="Listener de notificações"
          value={notificationEnabled ? "Habilitado" : "Não habilitado"}
        />
        <Text style={styles.stepText}>
          Este acesso é necessário para reconhecer “Você tem uma nova viagem
          próxima” e abrir o Pop Driver quando a oferta chegar em segundo plano
          ou durante uma corrida. Endereço e texto não são salvos.
        </Text>
        <ActionButton
          label="Abrir acesso às notificações"
          icon="notifications-active"
          variant="secondary"
          onPress={() => openNativeNotificationSettings()}
          disabled={!moduleAvailable}
        />
      </SectionCard>
      <SectionCard title="Desligamento completo">
        <Text style={styles.stepText}>
          Use a mesma tela do Android para desabilitar totalmente o serviço. O
          botão de desligar no painel interrompe os gestos, mas preserva a
          permissão para o próximo uso.
        </Text>
      </SectionCard>
      <ActionButton
        label="Gerenciar serviço no Android"
        icon="settings-accessibility"
        onPress={() => openNativeAccessibilitySettings()}
        disabled={!moduleAvailable}
      />
      <ActionButton
        label="Atualizar estado"
        icon="refresh"
        variant="secondary"
        onPress={refresh}
      />
      <ActionButton
        label="Voltar ao painel"
        icon="arrow-back"
        variant="secondary"
        onPress={() => router.replace("/")}
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
  step: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    paddingVertical: 4,
  },
  number: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF4FF",
  },
  numberText: { color: "#155EEF", fontSize: 12, fontWeight: "800" },
  stepText: {
    flex: 1,
    color: "#344054",
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 2,
  },
  info: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#EFF4FF",
    marginTop: 6,
  },
  infoText: { flex: 1, color: "#1849A9", fontSize: 13, lineHeight: 19 },
});
