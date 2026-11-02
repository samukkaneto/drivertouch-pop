type Status = {
  armed: boolean;
  serviceConnected: boolean;
  rideMode: "single" | "continuous";
  tripState: string;
};

export function automationStatus(s: Status) {
  if (!s.armed)
    return {
      title: "Desligado",
      detail: "Ligue a chave para aceitar corridas automaticamente.",
    };
  if (!s.serviceConnected)
    return {
      title: "Ligado · aguardando Acessibilidade",
      detail: "Confira a permissão Android para retomar a execução.",
    };
  if (s.rideMode === "continuous")
    return {
      title: "Ligado · simultâneas permitidas",
      detail:
        "Pode aceitar novas ofertas durante outra corrida e rolar para localizar o cartão.",
    };
  if (s.tripState === "ready")
    return {
      title: "Ligado · aguardando oferta",
      detail:
        "Disponível para aceitar uma corrida. Durante a viagem, aguarda você ficar livre novamente.",
    };
  if (s.tripState === "awaiting_trip" || s.tripState === "busy")
    return {
      title: "Ligado · aguardando ficar livre",
      detail:
        "Aguarda o PopMove voltar a mostrar “Aguarde uma solicitação”. Depois retoma sozinho, sem rolar a tela.",
    };
  return {
    title: "Ligado · verificando disponibilidade",
    detail:
      "Abra o PopMove na tela “Aguarde uma solicitação” para confirmar que está livre.",
  };
}
