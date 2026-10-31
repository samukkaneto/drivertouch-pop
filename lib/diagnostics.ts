export type DiagnosticState = {
  diagnosticMode: boolean;
  automationArmed: boolean;
  accessibilityGranted: boolean;
  accessibilityConnected: boolean;
  notificationGranted: boolean;
  notificationConnected: boolean;
};

export type DiagnosticAction = {
  index: number;
  category: "possible_accept" | "decline" | "open" | "other";
  hasIntent: boolean;
  creatorMatches: boolean;
  requiresUnlock: boolean | null;
  semanticAction: number;
  remoteInputCount: number;
};

export type NotificationSample = {
  at: number;
  postedAt: number;
  offerRecognized: boolean;
  diagnosticMode: boolean;
  hasOpenIntent: boolean;
  actionCount: number;
  actions: DiagnosticAction[];
};

export type DiagnosticSnapshot = {
  schema: 1;
  appVersion: string;
  popMoveVersion: string;
  device: string;
  androidVersion: string;
  sdk: number;
  generatedAt: number;
  startedAt: number;
  state: DiagnosticState;
  notificationEvents: number;
  offerEvents: number;
  lastNotification: NotificationSample | null;
  lastOffer: NotificationSample | null;
  pressCount: number;
  scrollCount: number;
  openCount: number;
  commands: { at: number; kind: string; dispatched: boolean }[];
  observations: {
    at: number;
    result: "appeared" | "not_observed";
    state: DiagnosticState;
  }[];
};

export const actionLabels: Record<DiagnosticAction["category"], string> = {
  possible_accept: "Possível aceite pelo rótulo",
  decline: "Recusa ou cancelamento",
  open: "Abrir ou visualizar",
  other: "Rótulo não reconhecido",
};

export function diagnosticConclusion(snapshot: DiagnosticSnapshot): string {
  const sample = snapshot.lastOffer;
  if (!sample)
    return "Ainda não foi observada uma notificação com a frase de nova viagem. Aguarde a próxima oferta com o acesso às notificações habilitado.";
  if (!sample.actionCount)
    return "A última oferta observada não publicou botões de ação na notificação. Esta amostra não oferece um comando de aceite por esse caminho.";
  if (
    sample.actions.some(
      (action) =>
        action.category === "possible_accept" &&
        action.hasIntent &&
        action.creatorMatches,
    )
  ) {
    return "Foi encontrada uma possível ação de aceite criada pelo PopMove. O diagnóstico não a acionou; o funcionamento ainda precisa ser validado.";
  }
  return "A notificação tem ações, mas nenhuma foi identificada como um comando de aceite disponível. Resultado inconclusivo: rótulos desconhecidos não são gravados.";
}

const yesNo = (value: boolean) => (value ? "sim" : "não");
const at = (value: number) =>
  value ? new Date(value).toISOString() : "não iniciado";
const stateLine = (s: DiagnosticState) =>
  `Diagnóstico: ${yesNo(s.diagnosticMode)}; execução armada: ${yesNo(s.automationArmed)}; acessibilidade autorizada/conectada: ${yesNo(s.accessibilityGranted)}/${yesNo(s.accessibilityConnected)}; notificações autorizadas/conectadas: ${yesNo(s.notificationGranted)}/${yesNo(s.notificationConnected)}`;

export function formatDiagnosticReport(s: DiagnosticSnapshot): string {
  const sampleLines = (
    name: string,
    sample: NotificationSample | null,
  ): string[] => {
    if (!sample) return [`${name}: sem amostra`];
    return [
      `${name}: ${at(sample.at)}; publicada: ${at(sample.postedAt)}; oferta reconhecida: ${yesNo(sample.offerRecognized)}; diagnóstico na captura: ${yesNo(sample.diagnosticMode)}`,
      `Abertura disponível: ${yesNo(sample.hasOpenIntent)}; ações: ${sample.actionCount}; inspecionadas: ${sample.actions.length}`,
      ...sample.actions.map(
        (a) =>
          `Ação ${a.index}: ${actionLabels[a.category]}; comando: ${yesNo(a.hasIntent)}; criador PopMove: ${yesNo(a.creatorMatches)}; desbloqueio: ${a.requiresUnlock === null ? "indeterminado" : yesNo(a.requiresUnlock)}; semântica: ${a.semanticAction}; entradas: ${a.remoteInputCount}`,
      ),
    ];
  };
  return [
    `Toalha Vermelha ${s.appVersion} — diagnóstico v${s.schema}`,
    `Aparelho: ${s.device}; Android ${s.androidVersion} (API ${s.sdk}); PopMove ${s.popMoveVersion}`,
    `Início: ${at(s.startedAt)}; relatório: ${at(s.generatedAt)}. Horários em UTC.`,
    stateLine(s.state),
    `Eventos de notificação: ${s.notificationEvents}; com frase de oferta: ${s.offerEvents}. Incluem atualizações da mesma oferta.`,
    ...sampleLines("Última oferta", s.lastOffer),
    ...sampleLines("Última notificação do PopMove", s.lastNotification),
    `Comandos solicitados: pressões ${s.pressCount}; rolagens ${s.scrollCount}; aberturas ${s.openCount}. Envio ao Android não confirma aceite de corrida.`,
    ...s.commands.map(
      (c) => `${at(c.at)}: ${c.kind}; envio concluído: ${yesNo(c.dispatched)}`,
    ),
    "Observações informadas pelo usuário ao retornar ao aplicativo (não são detecção automática do aviso):",
    ...(s.observations.length
      ? s.observations.map(
          (o) =>
            `${at(o.at)}: ${o.result === "appeared" ? "aviso apareceu" : "não observou aviso"}. ${stateLine(o.state)}`,
        )
      : ["Nenhuma observação registrada."]),
    `Avaliação: ${diagnosticConclusion(s)}`,
    "A ausência de aviso nesta medição não comprova indetectabilidade. Sem textos, endereços, valores, nomes de passageiros ou conteúdo dos comandos.",
  ].join("\n");
}
