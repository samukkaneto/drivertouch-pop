import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { clampNormalized } from "@/lib/calibration";
import {
  disableNativeService,
  syncSettingsToNative,
} from "@/lib/safe-accept-bridge";
import {
  DEFAULT_SETTINGS,
  sanitizeSettings,
  type AssistMode,
  type Calibration,
  type EventRecord,
  type SafeAcceptSettings,
} from "@/lib/safe-accept-types";

const STORAGE_KEY = "popmove-safe-accept.settings.v1";
const MAX_EVENTS = 50;

type SafeAcceptContextValue = {
  settings: SafeAcceptSettings;
  isLoading: boolean;
  setMode: (mode: AssistMode) => void;
  setArmed: (armed: boolean) => void;
  setCalibration: (x: number, y: number) => void;
  setTuning: (
    values: Pick<
      SafeAcceptSettings,
      "longPressDurationMs" | "detectionDelayMs" | "acceptMarker"
    >,
  ) => void;
  addEvent: (type: EventRecord["type"], message: string) => void;
  clearEvents: () => void;
  disableNow: () => Promise<void>;
};

const SafeAcceptContext = createContext<SafeAcceptContextValue | null>(null);

function createEvent(type: EventRecord["type"], message: string): EventRecord {
  const at = new Date().toISOString();
  return {
    id: `${at}-${Math.random().toString(16).slice(2)}`,
    at,
    type,
    source: "app",
    message,
  };
}

export function SafeAcceptProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] =
    useState<SafeAcceptSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!stored) return;
        const restored = sanitizeSettings(JSON.parse(stored));
        setSettings({
          ...restored,
          isArmed: false,
          events: [
            createEvent(
              "system",
              "Aplicativo iniciado com a automação desarmada por segurança.",
            ),
            ...restored.events,
          ].slice(0, MAX_EVENTS),
        });
      })
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(
      () => undefined,
    );
    syncSettingsToNative(settings).catch(() => undefined);
  }, [isLoading, settings]);

  const addEvent = useCallback((type: EventRecord["type"], message: string) => {
    setSettings((current) => ({
      ...current,
      events: [createEvent(type, message), ...current.events].slice(
        0,
        MAX_EVENTS,
      ),
    }));
  }, []);

  const clearEvents = useCallback(() => {
    setSettings((current) => ({ ...current, events: [] }));
  }, []);

  const setMode = useCallback((mode: AssistMode) => {
    setSettings((current) => ({
      ...current,
      mode,
      isArmed: false,
      events: [
        createEvent(
          "config",
          mode === "off"
            ? "Modo desligado selecionado."
            : mode === "test"
              ? "Modo de teste selecionado."
              : "Modo assistido selecionado.",
        ),
        ...current.events,
      ].slice(0, MAX_EVENTS),
    }));
  }, []);

  const setArmed = useCallback((armed: boolean) => {
    setSettings((current) => {
      const nextArmed = Boolean(
        current.calibration && current.mode !== "off" && armed,
      );
      return {
        ...current,
        isArmed: nextArmed,
        events: [
          createEvent(
            "system",
            nextArmed
              ? `Automação armada no modo ${current.mode === "test" ? "de teste" : "assistido"}.`
              : "Automação desarmada.",
          ),
          ...current.events,
        ].slice(0, MAX_EVENTS),
      };
    });
  }, []);

  const setCalibration = useCallback((x: number, y: number) => {
    const calibration: Calibration = {
      x: clampNormalized(x),
      y: clampNormalized(y),
      updatedAt: new Date().toISOString(),
    };
    setSettings((current) => ({
      ...current,
      calibration,
      isArmed: false,
      events: [
        createEvent("config", "Ponto de toque calibrado no aparelho."),
        ...current.events,
      ].slice(0, MAX_EVENTS),
    }));
  }, []);

  const setTuning = useCallback(
    (
      values: Pick<
        SafeAcceptSettings,
        "longPressDurationMs" | "detectionDelayMs" | "acceptMarker"
      >,
    ) => {
      setSettings((current) => ({ ...current, ...values, isArmed: false }));
    },
    [],
  );

  const disableNow = useCallback(async () => {
    await disableNativeService().catch(() => undefined);
    setSettings((current) => ({
      ...current,
      isArmed: false,
      mode: "off",
      events: [
        createEvent("system", "Assistente desligado manualmente."),
        ...current.events,
      ].slice(0, MAX_EVENTS),
    }));
  }, []);

  const value = useMemo(
    () => ({
      settings,
      isLoading,
      setMode,
      setArmed,
      setCalibration,
      setTuning,
      addEvent,
      clearEvents,
      disableNow,
    }),
    [
      settings,
      isLoading,
      setMode,
      setArmed,
      setCalibration,
      setTuning,
      addEvent,
      clearEvents,
      disableNow,
    ],
  );

  return (
    <SafeAcceptContext.Provider value={value}>
      {children}
    </SafeAcceptContext.Provider>
  );
}

export function useSafeAccept() {
  const value = useContext(SafeAcceptContext);
  if (!value)
    throw new Error(
      "useSafeAccept deve ser usado dentro de SafeAcceptProvider",
    );
  return value;
}
