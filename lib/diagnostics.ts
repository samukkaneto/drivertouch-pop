export type DiagnosticState = {
  diagnosticMode: boolean;
  automationArmed: boolean;
  accessibilityGranted: boolean;
  accessibilityConnected: boolean;
  notificationGranted: boolean;
  notificationConnected: boolean;
  inputMethod?: "control" | "gesture";
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
  sequence?: number;
  at: number;
  postedAt: number;
  offerRecognized: boolean;
  diagnosticMode: boolean;
  hasOpenIntent: boolean;
  actionCount: number;
  actions: DiagnosticAction[];
};

export type CardSample = {
  at: number;
  reason: string;
  markerNodes: number;
  longClickNodes: number;
  pressAndHoldNodes: number;
  eligibleNodes: number;
  available: boolean;
  performed?: boolean;
};

export type DiagnosticSnapshot = {
  schema: 1 | 2 | 3;
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
  notificationHistory?: NotificationSample[];
  lastCard?: CardSample | null;
  controlTest?: { startedAt: number; commandCountAtStart: number } | null;
  pressCount: number;
  longClickCount?: number;
  scrollCount: number;
  openCount: number;
  commands: { at: number; kind: string; dispatched: boolean }[];
  observations: {
    at: number;
    result: "appeared" | "not_observed";
    state: DiagnosticState;
    offerAtObservation?: NotificationSample | null;
    cardAtObservation?: CardSample | null;
    notificationEventsAtObservation?: number;
  }[];
};

export function cardConclusion(card?: CardSample | null): string {
  if (!card)
    return "Nenhum cartão foi analisado pelo novo método. Use Iniciar teste de uma oferta nesta tela e aguarde uma oferta visível no PopMove.";
  if (card.performed === true)
    return "O controle respondeu ao comando. Isso não confirma aceite da corrida nem ausência de aviso; registre o que aconteceu no PopMove.";
  if (card.performed === false)
    return "O controle não confirmou o comando. Nenhum toque substituto foi enviado.";
  const reasons: Record<string, string> = {
    incomplete_tree: "A leitura do cartão ficou incompleta.",
    marker_not_found: "A frase de aceite não foi encontrada.",
    no_eligible_long_click:
      "O cartão não ofereceu um comando de pressionamento longo utilizável.",
    ambiguous_cards:
      "Há mais de um controle possível; não foi possível escolher com segurança.",
    changed_before_action:
      "O cartão ou o estado de execução mudou antes do comando.",
    available:
      "Foi encontrado um comando disponível; envio ainda não registrado.",
  };
  return `${reasons[card.reason] ?? "Resultado inconclusivo."} Nenhum toque substituto foi enviado.`;
}

export function controlTestStatus(s: DiagnosticSnapshot): {
  title: string;
  detail: string;
  active: boolean;
} {
  const currentCard =
    s.lastCard && (!s.controlTest || s.lastCard.at >= s.controlTest.startedAt)
      ? s.lastCard
      : null;
  if (currentCard)
    return {
      title:
        currentCard.performed === undefined
          ? "Cartão analisado — comando não enviado"
          : "Tentativa realizada",
      detail: cardConclusion(currentCard),
      active: false,
    };
  if (s.state.diagnosticMode || !s.state.automationArmed)
    return {
      title: "Teste pausado — nenhuma tentativa em andamento",
      detail:
        "A execução está desativada. Sem tentar o comando, esta etapa não avalia o aviso na execução. Toque em Iniciar teste de uma oferta.",
      active: false,
    };
  if (s.state.inputMethod !== "control")
    return {
      title: "Outro método selecionado",
      detail:
        "Iniciar teste de uma oferta seleciona Comando do cartão e Uma corrida.",
      active: false,
    };
  if (!s.state.accessibilityGranted || !s.state.accessibilityConnected)
    return {
      title: "Teste sem conexão com a Acessibilidade",
      detail:
        "O serviço precisa estar autorizado e conectado para executar o comando. Confira os ajustes de acessibilidade.",
      active: false,
    };
  return {
    title: "Teste ativo — aguardando oferta",
    detail:
      "Abra o PopMove e deixe o cartão da oferta visível. A execução vai pausar depois de analisar uma oferta.",
    active: true,
  };
}

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
  `Diagnóstico: ${yesNo(s.diagnosticMode)}; execução armada: ${yesNo(s.automationArmed)}; método: ${s.inputMethod === "control" ? "comando do cartão" : s.inputMethod === "gesture" ? "toque anterior" : "não registrado"}; acessibilidade autorizada/conectada: ${yesNo(s.accessibilityGranted)}/${yesNo(s.accessibilityConnected)}; notificações autorizadas/conectadas: ${yesNo(s.notificationGranted)}/${yesNo(s.notificationConnected)}`;

export function formatDiagnosticReport(s: DiagnosticSnapshot): string {
  const testStatus = controlTestStatus(s);
  const sampleLines = (
    name: string,
    sample: NotificationSample | null,
  ): string[] => {
    if (!sample) return [`${name}: sem amostra`];
    return [
      `${name}: ${at(sample.at)}; amostra: ${sample.sequence ?? "versão anterior"}; publicada: ${at(sample.postedAt)}; oferta reconhecida: ${yesNo(sample.offerRecognized)}; diagnóstico na captura: ${yesNo(sample.diagnosticMode)}`,
      `Abertura disponível: ${yesNo(sample.hasOpenIntent)}; ações: ${sample.actionCount}; inspecionadas: ${sample.actions.length}`,
      ...sample.actions.map(
        (a) =>
          `Ação ${a.index}: ${actionLabels[a.category]}; comando: ${yesNo(a.hasIntent)}; criador PopMove: ${yesNo(a.creatorMatches)}; desbloqueio: ${a.requiresUnlock === null ? "indeterminado" : yesNo(a.requiresUnlock)}; semântica: ${a.semanticAction}; entradas: ${a.remoteInputCount}`,
      ),
    ];
  };
  const cardLine = (card: CardSample) =>
    `${at(card.at)}: ${card.reason}; nós com frase: ${card.markerNodes}; com longClick: ${card.longClickNodes}; com pressAndHold: ${card.pressAndHoldNodes}; elegíveis: ${card.eligibleNodes}; resposta: ${card.performed === undefined ? "não enviado" : yesNo(card.performed)}`;
  return [
    `Toalha Vermelha ${s.appVersion} — diagnóstico v${s.schema}`,
    `Aparelho: ${s.device}; Android ${s.androidVersion} (API ${s.sdk}); PopMove ${s.popMoveVersion}`,
    `Início: ${at(s.startedAt)}; relatório: ${at(s.generatedAt)}. Horários em UTC.`,
    stateLine(s.state),
    `Estado do teste: ${testStatus.title}. ${testStatus.detail}`,
    ...(s.controlTest
      ? [
          `Teste iniciado explicitamente: ${at(s.controlTest.startedAt)}; comandos do cartão desde o início: ${Math.max(0, (s.longClickCount ?? 0) - s.controlTest.commandCountAtStart)}`,
        ]
      : []),
    `Eventos de notificação: ${s.notificationEvents}; com frase de oferta: ${s.offerEvents}. Incluem atualizações da mesma oferta.`,
    ...sampleLines("Última oferta", s.lastOffer),
    ...sampleLines("Última notificação do PopMove", s.lastNotification),
    "Histórico de notificações (até 20 atualizações, mais recente primeiro):",
    ...(s.notificationHistory?.length
      ? s.notificationHistory.flatMap((sample) =>
          sampleLines("Amostra", sample),
        )
      : ["Histórico indisponível para amostras da versão anterior."]),
    `Comandos solicitados: comando do cartão ${s.longClickCount ?? 0}; pressões ${s.pressCount}; rolagens ${s.scrollCount}; aberturas ${s.openCount}. Envio ao Android não confirma aceite de corrida.`,
    ...s.commands.map(
      (c) => `${at(c.at)}: ${c.kind}; envio concluído: ${yesNo(c.dispatched)}`,
    ),
    `Teste do cartão: ${cardConclusion(s.lastCard)}`,
    ...(s.lastCard ? [cardLine(s.lastCard)] : []),
    "Observações informadas pelo usuário ao retornar ao aplicativo (não são detecção automática do aviso):",
    ...(s.observations.length
      ? s.observations.flatMap((o) => [
          `${at(o.at)}: ${o.result === "appeared" ? "aviso apareceu" : "não observou aviso"}. ${stateLine(o.state)}`,
          ...(o.offerAtObservation === undefined
            ? [
                "Versão anterior: não guardou a oferta vinculada a esta observação; não permite concluir se a observação ocorreu antes da oferta.",
              ]
            : sampleLines(
                "Oferta já registrada ao marcar a observação",
                o.offerAtObservation,
              )),
          ...(o.cardAtObservation
            ? [`Cartão ao marcar: ${cardLine(o.cardAtObservation)}`]
            : []),
        ])
      : ["Nenhuma observação registrada."]),
    `Avaliação das notificações: ${diagnosticConclusion(s)}`,
    "A amostra vinculada é a última conhecida no momento do registro, não uma confirmação automática de qual oferta o usuário viu. Atualizações posteriores não a substituem.",
    "A ausência de aviso nesta medição não comprova indetectabilidade. Sem textos, endereços, valores, nomes de passageiros ou conteúdo dos comandos.",
  ].join("\n");
}
