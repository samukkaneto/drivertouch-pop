import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  AppState,
  ScrollView,
  Share,
  StyleSheet,
  Text,
} from "react-native";

import {
  ActionButton,
  KeyValue,
  SectionCard,
} from "@/components/safe-accept-ui";
import {
  actionLabels,
  diagnosticConclusion,
  formatDiagnosticReport,
} from "@/lib/diagnostics";
import type { DiagnosticSnapshot } from "@/lib/diagnostics";
import {
  beginDiagnostics,
  getDiagnostics,
  openNativeAccessibilitySettings,
  openNativeNotificationSettings,
  recordDiagnosticObservation,
} from "@/lib/safe-accept-bridge";
import { useSafeAccept } from "@/lib/safe-accept-context";

export default function DiagnosticScreen() {
  const { disableNow } = useSafeAccept();
  const [snapshot, setSnapshot] = useState<DiagnosticSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const refresh = () =>
        getDiagnostics()
          .then((value) => {
            if (active) {
              setSnapshot(value);
              setError(null);
            }
          })
          .catch(() => {
            if (active)
              setError(
                "Não foi possível ler o diagnóstico. Tente reabrir esta tela.",
              );
          });
      void refresh();
      const timer = setInterval(() => {
        if (AppState.currentState === "active") void refresh();
      }, 2000);
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") void refresh();
      });
      return () => {
        active = false;
        clearInterval(timer);
        subscription.remove();
      };
    }, []),
  );

  async function act(operation: () => Promise<unknown>) {
    setBusy(true);
    try {
      await operation();
      setSnapshot(await getDiagnostics());
      setError(null);
    } catch {
      Alert.alert(
        "Não foi possível concluir",
        "Tente novamente. O relatório anterior foi mantido quando possível.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function start() {
    if (!(await beginDiagnostics())) {
      Alert.alert(
        "Aguarde a tentativa atual",
        "O Android ainda está concluindo uma execução. Tente novamente em alguns segundos.",
      );
      return;
    }
    await disableNow();
  }

  const sample = snapshot?.lastOffer ?? snapshot?.lastNotification;
  const permission = (granted: boolean, connected: boolean) =>
    !granted
      ? "Desligada"
      : connected
        ? "Ligada e conectada"
        : "Ligada; aguardando conexão";
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Medir antes de mudar</Text>
      <Text style={styles.body}>
        O modo de diagnóstico observa notificações e pausa os toques, as
        rolagens e a abertura automática do PopMove. As ações encontradas não
        são executadas.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <SectionCard title="Primeira medição">
        <Text style={styles.body}>
          1. Com o veículo estacionado, inicie a medição abaixo.
        </Text>
        <Text style={styles.body}>
          2. Deixe a Acessibilidade do Toalha Vermelha desligada. Habilite
          somente o acesso às notificações.
        </Text>
        <Text style={styles.body}>
          3. Abra o PopMove normalmente e aguarde uma oferta. Retorne aqui,
          registre se viu o aviso e compartilhe o relatório.
        </Text>
        <ActionButton
          label={
            snapshot?.startedAt
              ? "Zerar relatório e reiniciar medição"
              : "Iniciar medição"
          }
          icon="science"
          disabled={busy}
          onPress={() => {
            if (snapshot?.startedAt)
              Alert.alert(
                "Reiniciar medição?",
                "As amostras e observações deste relatório serão apagadas. Compartilhe antes se quiser guardá-las.",
                [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Reiniciar", onPress: () => void act(start) },
                ],
              );
            else void act(start);
          }}
        />
        <ActionButton
          label="Acesso às notificações"
          icon="notifications-active"
          variant="secondary"
          onPress={() => void act(openNativeNotificationSettings)}
          disabled={busy}
        />
        <ActionButton
          label="Ajustes de acessibilidade"
          icon="settings-accessibility"
          variant="secondary"
          onPress={() => void act(openNativeAccessibilitySettings)}
          disabled={busy}
        />
      </SectionCard>
      {snapshot ? (
        <>
          <SectionCard title="Estado observado agora">
            <KeyValue label="Versão" value={snapshot.appVersion} />
            <KeyValue
              label="Diagnóstico"
              value={
                snapshot.state.diagnosticMode
                  ? "Ativo; automação pausada"
                  : "Encerrado"
              }
            />
            <KeyValue
              label="Execução automática"
              value={snapshot.state.automationArmed ? "Ativa" : "Desligada"}
            />
            <KeyValue
              label="Acessibilidade"
              value={permission(
                snapshot.state.accessibilityGranted,
                snapshot.state.accessibilityConnected,
              )}
            />
            <KeyValue
              label="Notificações"
              value={permission(
                snapshot.state.notificationGranted,
                snapshot.state.notificationConnected,
              )}
            />
            <KeyValue
              label="Avisos recebidos (inclui atualizações)"
              value={String(snapshot.notificationEvents)}
            />
            <KeyValue
              label="Com frase de nova oferta"
              value={String(snapshot.offerEvents)}
            />
            <KeyValue
              label="Pressões / rolagens / aberturas solicitadas"
              value={`${snapshot.pressCount} / ${snapshot.scrollCount} / ${snapshot.openCount}`}
              last
            />
          </SectionCard>
          <SectionCard title="Ações da notificação">
            <Text style={styles.body}>{diagnosticConclusion(snapshot)}</Text>
            {sample ? (
              <>
                <Text style={styles.small}>
                  {sample.offerRecognized
                    ? "Última oferta reconhecida"
                    : "Último aviso recebido; ainda não reconhecido como oferta"}{" "}
                  · {new Date(sample.at).toLocaleString("pt-BR")}
                </Text>
                <KeyValue
                  label="Número de ações"
                  value={String(sample.actionCount)}
                  last
                />
                {sample.actions.map((action) => (
                  <Text key={action.index} style={styles.body}>
                    {action.index}. {actionLabels[action.category]} —{" "}
                    {action.hasIntent ? "com comando" : "sem comando"};{" "}
                    {action.creatorMatches
                      ? "criado pelo PopMove"
                      : "origem diferente ou indisponível"}
                    .
                  </Text>
                ))}
              </>
            ) : null}
          </SectionCard>
          <SectionCard title="Registrar o que você viu">
            <Text style={styles.body}>
              Ao voltar do PopMove, marque o resultado. O relatório guardará sua
              observação com o estado atual das permissões. Esta tela não
              detecta o balão automaticamente.
            </Text>
            <ActionButton
              label="Vi o aviso de autoclique"
              icon="report-problem"
              variant="secondary"
              disabled={busy || !!error}
              onPress={() =>
                void act(() => recordDiagnosticObservation("appeared"))
              }
            />
            <ActionButton
              label="Não observei o aviso"
              icon="visibility"
              variant="secondary"
              disabled={busy || !!error}
              onPress={() =>
                void act(() => recordDiagnosticObservation("not_observed"))
              }
            />
            <Text style={styles.small}>
              {snapshot.observations.length} observação(ões) registradas. A
              ausência de aviso não comprova indetectabilidade.
            </Text>
          </SectionCard>
          <SectionCard title="Compartilhar o resultado">
            <Text style={styles.body}>
              Inclui versão, permissões, tipos de ação e horários. Textos das
              notificações, endereços, valores e nomes de passageiros não entram
              no relatório.
            </Text>
            <ActionButton
              label="Compartilhar relatório"
              icon="share"
              disabled={busy || !!error}
              onPress={() =>
                void act(async () => {
                  const latest = await getDiagnostics();
                  await Share.share({
                    message: formatDiagnosticReport(latest),
                    title: "Diagnóstico Toalha Vermelha",
                  });
                })
              }
            />
            <ActionButton
              label={
                showReport
                  ? "Ocultar texto do relatório"
                  : "Mostrar texto para copiar"
              }
              icon="description"
              variant="secondary"
              onPress={() => setShowReport(!showReport)}
            />
            {showReport ? (
              <Text selectable style={styles.report}>
                {formatDiagnosticReport(snapshot)}
              </Text>
            ) : null}
          </SectionCard>
          <Text style={styles.small}>
            A comparação seguinte pode ser feita com Acessibilidade ligada e o
            diagnóstico ainda ativo. Registre outro resultado sem zerar o
            relatório. Para voltar à automação anterior, ative a execução
            explicitamente no painel.
          </Text>
        </>
      ) : (
        <Text style={styles.body}>Carregando estado do Android…</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
    backgroundColor: "#F7F9FC",
  },
  title: { fontSize: 26, lineHeight: 32, fontWeight: "800", color: "#101828" },
  body: { color: "#344054", fontSize: 14, lineHeight: 21 },
  small: { color: "#667085", fontSize: 13, lineHeight: 19 },
  error: { color: "#B42318", fontSize: 14, lineHeight: 21 },
  report: { color: "#344054", fontSize: 12, lineHeight: 18 },
});
