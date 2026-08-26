import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ActionButton, SectionCard } from "@/components/safe-accept-ui";
import { clampNormalized } from "@/lib/calibration";
import { useSafeAccept } from "@/lib/safe-accept-context";

const GRID_WIDTH = 320;
const GRID_HEIGHT = 520;

export default function CalibrationScreen() {
  const router = useRouter();
  const { settings, setCalibration } = useSafeAccept();
  const [xInput, setXInput] = useState(String(settings.calibration?.x ?? "0.50"));
  const [yInput, setYInput] = useState(String(settings.calibration?.y ?? "0.72"));
  const [message, setMessage] = useState("Toque no quadro abaixo ou informe os valores normalizados.");

  const point = useMemo(() => ({ x: clampNormalized(Number(xInput.replace(",", ".")) || 0), y: clampNormalized(Number(yInput.replace(",", ".")) || 0) }), [xInput, yInput]);

  function save() {
    if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) {
      setMessage("Use valores entre 0,00 e 1,00.");
      return;
    }
    setCalibration(point.x, point.y);
    setMessage("Calibração salva no aparelho.");
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}><Text style={styles.title}>Calibrar toque</Text><Text style={styles.subtitle}>Defina o ponto central do controle de aceite visto no seu POP driver. Os valores são relativos ao tamanho da tela.</Text></View>

      <SectionCard title="Ponto de referência">
        <View style={styles.gridWrap}>
          <Pressable
            accessibilityLabel="Área de calibração"
            onPress={(event) => {
              const x = clampNormalized(event.nativeEvent.locationX / GRID_WIDTH);
              const y = clampNormalized(event.nativeEvent.locationY / GRID_HEIGHT);
              setXInput(x.toFixed(3));
              setYInput(y.toFixed(3));
              setMessage("Ponto atualizado. Confira os valores e salve.");
            }}
            style={styles.grid}
          >
            <View style={styles.crossHorizontal} />
            <View style={styles.crossVertical} />
            <View style={[styles.point, { left: Math.max(8, point.x * GRID_WIDTH - 10), top: Math.max(8, point.y * GRID_HEIGHT - 10) }]} />
            <Text style={styles.gridHint}>Toque na posição aproximada{`\n`}do botão de aceite</Text>
          </Pressable>
        </View>
        <Text style={styles.message}>{message}</Text>
      </SectionCard>

      <SectionCard title="Coordenadas normalizadas">
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}><Text style={styles.inputLabel}>X · horizontal</Text><TextInput value={xInput} onChangeText={setXInput} keyboardType="decimal-pad" maxLength={5} style={styles.input} selectTextOnFocus /></View>
          <View style={styles.inputGroup}><Text style={styles.inputLabel}>Y · vertical</Text><TextInput value={yInput} onChangeText={setYInput} keyboardType="decimal-pad" maxLength={5} style={styles.input} selectTextOnFocus /></View>
        </View>
        <Text style={styles.helper}>Exemplo: X 0,500 e Y 0,720 representam o centro horizontal e 72% da altura da tela.</Text>
      </SectionCard>

      <ActionButton label="Salvar calibração" icon="save" onPress={save} />
      <ActionButton label="Voltar ao painel" icon="arrow-back" variant="secondary" onPress={() => router.replace("/")} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 34, gap: 16, backgroundColor: "#F7F9FC" },
  header: { gap: 8, paddingTop: 8 },
  title: { color: "#101828", fontSize: 28, lineHeight: 34, fontWeight: "800", letterSpacing: -0.4 },
  subtitle: { color: "#475467", fontSize: 15, lineHeight: 22 },
  gridWrap: { alignItems: "center", paddingVertical: 4 },
  grid: { width: GRID_WIDTH, height: GRID_HEIGHT, maxWidth: "100%", backgroundColor: "#EFF4FF", borderWidth: 1, borderColor: "#B2CCFF", borderRadius: 28, overflow: "hidden", position: "relative" },
  crossHorizontal: { position: "absolute", top: "50%", width: "100%", height: StyleSheet.hairlineWidth, backgroundColor: "#B2CCFF" },
  crossVertical: { position: "absolute", left: "50%", height: "100%", width: StyleSheet.hairlineWidth, backgroundColor: "#B2CCFF" },
  point: { position: "absolute", width: 20, height: 20, borderRadius: 10, backgroundColor: "#155EEF", borderWidth: 4, borderColor: "#FFFFFF" },
  gridHint: { position: "absolute", alignSelf: "center", top: 18, textAlign: "center", color: "#155EEF", fontSize: 13, lineHeight: 18, fontWeight: "700" },
  message: { color: "#475467", fontSize: 13, lineHeight: 19 },
  inputRow: { flexDirection: "row", gap: 12 },
  inputGroup: { flex: 1, gap: 6 },
  inputLabel: { color: "#475467", fontSize: 13, fontWeight: "700" },
  input: { borderWidth: 1, borderColor: "#D0D5DD", borderRadius: 12, paddingHorizontal: 12, height: 48, backgroundColor: "#FFFFFF", color: "#101828", fontSize: 16, fontWeight: "700" },
  helper: { color: "#667085", fontSize: 13, lineHeight: 19 },
});
