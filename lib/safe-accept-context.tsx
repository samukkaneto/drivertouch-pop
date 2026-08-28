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
          events: [
            createEvent(
              "system",
              restored.isArmed
                ? "Aplicativo iniciado com execução automática ativa."
                : "Aplicativo iniciado com execução automática desligada.",
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
      isArmed: Boolean(current.calibration && mode === "assist"),
      events: [
        createEvent(
          "config",
          mode === "off"
            ? "Execução automática desligada."
            : "Execução automática ativada.",
        ),
        ...current.events,
      ].slice(0, MAX_EVENTS),
    }));
  }, []);

  const setArmed = useCallback((armed: boolean) => {
    setSettings((current) => {
      const nextArmed = Boolean(current.calibration && armed);
      return {
        ...current,
        mode: nextArmed ? "assist" : "off",
        isArmed: nextArmed,
        events: [
          createEvent(
            "system",
            nextArmed
              ? "Execução automática ativada."
              : "Execução automática desligada.",
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
      mode: "assist",
      isArmed: true,
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
      setSettings((current) => ({ ...current, ...values }));
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
