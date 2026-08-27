import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ActionButton, SectionCard } from "@/components/safe-accept-ui";
import {
  clampNormalized,
  parseNormalizedInput,
  touchPositionToNormalized,
} from "@/lib/calibration";
import {
  consumePendingCalibration,
  getNativeStatus,
  startOverlayCalibration,
} from "@/lib/safe-accept-bridge";
import { useSafeAccept } from "@/lib/safe-accept-context";

export default function CalibrationScreen() {
  const router = useRouter();
  const { settings, setCalibration } = useSafeAccept();
  const [xInput, setXInput] = useState(
    String(settings.calibration?.x ?? "0.50"),
  );
  const [yInput, setYInput] = useState(
    String(settings.calibration?.y ?? "0.72"),
  );
  const [message, setMessage] = useState(
    "Toque no quadro abaixo ou informe os valores normalizados.",
  );
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });
  const [nativeEnabled, setNativeEnabled] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getNativeStatus()
        .then((status) => setNativeEnabled(status.serviceEnabled))
        .catch(() => setNativeEnabled(false));
      consumePendingCalibration()
        .then((pending) => {
          if (!pending) return;
          setXInput(pending.x.toFixed(3));
          setYInput(pending.y.toFixed(3));
          setCalibration(pending.x, pending.y);
          setMessage(
            "Ponto capturado sobre o POP driver e salvo neste aparelho.",
          );
        })
        .catch(() => undefined);
    }, [setCalibration]),
  );

  const parsedPoint = useMemo(
    () => ({
      x: parseNormalizedInput(xInput),
      y: parseNormalizedInput(yInput),
    }),
    [xInput, yInput],
  );
  const displayPoint = {
    x: clampNormalized(parsedPoint.x ?? 0.5),
    y: clampNormalized(parsedPoint.y ?? 0.72),
  };

  function save() {
    if (parsedPoint.x === null || parsedPoint.y === null) {
      setMessage("Use valores entre 0,00 e 1,00.");
      return;
    }
    setCalibration(parsedPoint.x, parsedPoint.y);
    setMessage("Calibração salva no aparelho.");
  }

  async function beginGuidedCalibration() {
    if (!nativeEnabled) {
      Alert.alert(
        "Ative o serviço primeiro",
        "A calibração sobre outro aplicativo usa o serviço de acessibilidade. Ative-o na tela de permissões e tente novamente.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Abrir permissões",
            onPress: () => router.push("/permissoes"),
          },
        ],
      );
      return;
    }

    const started = await startOverlayCalibration().catch(() => false);
    if (!started) {
      Alert.alert(
        "Não foi possível abrir o POP driver",
        "Confirme se o aplicativo do motorista está instalado e se o serviço DriverTouch Pop está habilitado.",
      );
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Calibrar toque</Text>
        <Text style={styles.subtitle}>
          Defina o ponto central do controle de aceite visto no seu POP driver.
          Os valores são relativos ao tamanho da tela.
        </Text>
      </View>

      <SectionCard title="Calibração guiada no POP driver">
        <Text style={styles.helper}>
          O DriverTouch abrirá o POP driver com um pequeno controle flutuante.
          Prepare a tela desejada, toque em “Marcar agora” e depois toque no
          centro do botão de aceite.
        </Text>
        <ActionButton
          label="Calibrar sobre o POP driver"
          icon="open-in-new"
          onPress={beginGuidedCalibration}
        />
        {!nativeEnabled ? (
          <Text style={styles.message}>
            Ative primeiro o serviço na tela de permissões Android.
          </Text>
        ) : null}
      </SectionCard>

      <SectionCard title="Ponto de referência">
        <View style={styles.gridWrap}>
          <Pressable
            accessibilityLabel="Área de calibração"
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              setGridSize({ width, height });
            }}
            onPress={(event) => {
              const x = touchPositionToNormalized(
                event.nativeEvent.locationX,
                gridSize.width,
              );
              const y = touchPositionToNormalized(
                event.nativeEvent.locationY,
                gridSize.height,
              );
              setXInput(x.toFixed(3));
              setYInput(y.toFixed(3));
              setMessage("Ponto atualizado. Confira os valores e salve.");
            }}
            style={styles.grid}
          >
            <View style={styles.crossHorizontal} />
            <View style={styles.crossVertical} />
            <View
              style={[
                styles.point,
                {
                  left: Math.min(
                    Math.max(0, gridSize.width - 20),
                    Math.max(0, displayPoint.x * gridSize.width - 10),
                  ),
                  top: Math.min(
                    Math.max(0, gridSize.height - 20),
                    Math.max(0, displayPoint.y * gridSize.height - 10),
                  ),
                },
              ]}
            />
            <Text style={styles.gridHint}>
              Toque na posição aproximada{`\n`}do botão de aceite
            </Text>
          </Pressable>
        </View>
        <Text style={styles.message}>{message}</Text>
      </SectionCard>

      <SectionCard title="Coordenadas normalizadas">
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>X · horizontal</Text>
            <TextInput
              value={xInput}
              onChangeText={setXInput}
              keyboardType="decimal-pad"
              maxLength={6}
              style={[
                styles.input,
                parsedPoint.x === null && styles.inputError,
              ]}
              selectTextOnFocus
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Y · vertical</Text>
            <TextInput
              value={yInput}
              onChangeText={setYInput}
              keyboardType="decimal-pad"
              maxLength={6}
              style={[
                styles.input,
                parsedPoint.y === null && styles.inputError,
              ]}
              selectTextOnFocus
            />
          </View>
        </View>
        <Text style={styles.helper}>
          Exemplo: X 0,500 e Y 0,720 representam o centro horizontal e 72% da
          altura da tela.
        </Text>
      </SectionCard>

      <ActionButton label="Salvar calibração" icon="save" onPress={save} />
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
  gridWrap: { alignItems: "center", paddingVertical: 4 },
  grid: {
    width: "100%",
    maxWidth: 360,
    aspectRatio: 320 / 520,
    backgroundColor: "#EFF4FF",
    borderWidth: 1,
    borderColor: "#B2CCFF",
    borderRadius: 28,
    overflow: "hidden",
    position: "relative",
  },
  crossHorizontal: {
    position: "absolute",
    top: "50%",
    width: "100%",
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#B2CCFF",
  },
  crossVertical: {
    position: "absolute",
    left: "50%",
    height: "100%",
    width: StyleSheet.hairlineWidth,
    backgroundColor: "#B2CCFF",
  },
  point: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#155EEF",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  gridHint: {
    position: "absolute",
    alignSelf: "center",
    top: 18,
    textAlign: "center",
    color: "#155EEF",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  message: { color: "#475467", fontSize: 13, lineHeight: 19 },
  inputRow: { flexDirection: "row", gap: 12 },
  inputGroup: { flex: 1, gap: 6 },
  inputLabel: { color: "#475467", fontSize: 13, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: "#FFFFFF",
    color: "#101828",
    fontSize: 16,
    fontWeight: "700",
  },
  inputError: { borderColor: "#D92D20", backgroundColor: "#FEF3F2" },
  helper: { color: "#667085", fontSize: 13, lineHeight: 19 },
});
