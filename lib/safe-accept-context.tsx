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
  syncSettingsToNative,
  setNativeAutomationEnabled,
  getNativeStatus,
} from "@/lib/safe-accept-bridge";
import {
  DEFAULT_SETTINGS,
  sanitizeSettings,
  type Calibration,
  type EventRecord,
  type SafeAcceptSettings,
} from "@/lib/safe-accept-types";

const STORAGE_KEY = "popmove-safe-accept.settings.v1";
const MAX_EVENTS = 50;

type SafeAcceptContextValue = {
  settings: SafeAcceptSettings;
  isLoading: boolean;
  setArmed: (armed: boolean) => Promise<{ enabled: boolean; reason: string }>;
  setCalibration: (x: number, y: number) => void;
  setBehavior: (
    values: Partial<Pick<SafeAcceptSettings, "rideMode" | "touchRadius">>,
  ) => void;
  setTuning: (
    values: Pick<
      SafeAcceptSettings,
      "longPressDurationMs" | "detectionDelayMs" | "acceptMarker"
    >,
  ) => void;
  addEvent: (type: EventRecord["type"], message: string) => void;
  clearEvents: () => void;
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
      .then(async (stored) => {
        const restored = stored
          ? sanitizeSettings(JSON.parse(stored))
          : { ...DEFAULT_SETTINGS };
        const status = await getNativeStatus();
        restored.isArmed = status.armed;
        restored.mode = status.armed ? "assist" : "off";
        restored.rideMode = status.rideMode;
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

  const setArmed = useCallback(
    async (armed: boolean) => {
      const result = await setNativeAutomationEnabled(armed, settings.rideMode);
      setSettings((current) => ({
        ...current,
        mode: result.enabled ? "assist" : "off",
        isArmed: result.enabled,
        events: [
          createEvent(
            "system",
            result.enabled ? "Aplicativo ligado." : "Aplicativo desligado.",
          ),
          ...current.events,
        ].slice(0, MAX_EVENTS),
      }));
      return result;
    },
    [settings.rideMode],
  );

  const setCalibration = useCallback((x: number, y: number) => {
    const calibration: Calibration = {
      x: clampNormalized(x),
      y: clampNormalized(y),
      updatedAt: new Date().toISOString(),
    };
    setSettings((current) => ({
      ...current,
      calibration,
      events: [
        createEvent("config", "Ponto de toque calibrado no aparelho."),
        ...current.events,
      ].slice(0, MAX_EVENTS),
    }));
  }, []);

  const setBehavior = useCallback(
    (values: Partial<Pick<SafeAcceptSettings, "rideMode" | "touchRadius">>) => {
      setSettings((current) => sanitizeSettings({ ...current, ...values }));
    },
    [],
  );

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

  const value = useMemo(
    () => ({
      settings,
      isLoading,
      setArmed,
      setCalibration,
      setTuning,
      setBehavior,
      addEvent,
      clearEvents,
    }),
    [
      settings,
      isLoading,
      setArmed,
      setCalibration,
      setTuning,
      setBehavior,
      addEvent,
      clearEvents,
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
