import { MaterialIcons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { SectionCard } from "@/components/safe-accept-ui";
import { useSafeAccept } from "@/lib/safe-accept-context";

const typeIcon = { config: "tune", test: "science", gesture: "touch-app", system: "settings" } as const;

export default function LogScreen() {
  const { settings } = useSafeAccept();

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}><Text style={styles.title}>Registro local</Text><Text style={styles.subtitle}>Mostra apenas eventos técnicos do auxiliar. Nenhum dado de corrida é salvo aqui.</Text></View>
      <SectionCard title="Últimos eventos">
        {settings.events.length ? settings.events.map((event, index) => (
          <View key={event.id} style={[styles.event, index !== settings.events.length - 1 && styles.eventBorder]}>
            <View style={styles.icon}><MaterialIcons name={typeIcon[event.type]} size={18} color="#155EEF" /></View>
            <View style={styles.eventCopy}><Text style={styles.eventMessage}>{event.message}</Text><Text style={styles.eventDate}>{new Date(event.at).toLocaleString("pt-BR")}</Text></View>
          </View>
        )) : <View style={styles.empty}><MaterialIcons name="history" size={28} color="#98A2B3" /><Text style={styles.emptyTitle}>Ainda não há eventos</Text><Text style={styles.emptyText}>As ações de configuração e os testes do serviço aparecerão nesta lista.</Text></View>}
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 34, gap: 16, backgroundColor: "#F7F9FC", flexGrow: 1 },
  header: { gap: 8, paddingTop: 8 },
  title: { color: "#101828", fontSize: 28, lineHeight: 34, fontWeight: "800", letterSpacing: -0.4 },
  subtitle: { color: "#475467", fontSize: 15, lineHeight: 22 },
  event: { flexDirection: "row", gap: 12, paddingVertical: 12 },
  eventBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#EAECF0" },
  icon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#EFF4FF" },
  eventCopy: { flex: 1, gap: 3 },
  eventMessage: { color: "#101828", fontSize: 14, lineHeight: 20, fontWeight: "700" },
  eventDate: { color: "#667085", fontSize: 12, lineHeight: 17 },
  empty: { alignItems: "center", paddingVertical: 32, gap: 6 },
  emptyTitle: { color: "#344054", fontSize: 16, fontWeight: "800", marginTop: 4 },
  emptyText: { color: "#667085", fontSize: 13, lineHeight: 19, textAlign: "center", maxWidth: 250 },
});
