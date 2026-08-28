# DriverTouch Pop

Aplicativo Android local que aceita automaticamente novas viagens no **POP driver** para reduzir a interação manual do motorista.

## Estado atual — versão 0.4.0

O fluxo foi alinhado com capturas reais do POP driver feitas em 28/08/2026:

| Sinal | Evidência confirmada |
| --- | --- |
| Pacote Android | `br.com.popmove.driver` |
| Notificação de oferta | `Você tem uma nova viagem próxima` |
| Cartão de corrida | `PRESSIONE E SEGURE PARA ATENDER` |
| Ação de aceite | Toque prolongado em qualquer ponto do cartão; não existe botão de aceite |

Não existe modo de teste. Depois que há calibração e a execução está ligada, o serviço permanece ativo entre reinícios até o motorista usar **Desligar execução automática** ou revogar a permissão no Android.

## Como a execução funciona

1. O listener recebe somente notificações do pacote oficial do POP driver.
2. A frase real da notificação cria uma identidade local da viagem sem salvar endereço ou texto.
3. O `contentIntent` da notificação abre o POP driver, inclusive quando chega uma oferta durante outra corrida.
4. O serviço procura `PRESSIONE E SEGURE PARA ATENDER` na árvore de acessibilidade.
5. Quando o texto está acessível, o centro do próprio elemento define o ponto do toque.
6. Quando o texto não está acessível, a notificação confirmada autoriza o ponto já calibrado após cinco segundos, sempre com a janela do POP driver em primeiro plano.
7. A identidade da notificação ou do cartão impede repetir o gesto na mesma oferta.

## Instalação

1. Instale a APK independente `arm64-v8a`.
2. Habilite **DriverTouch Pop** em Acessibilidade.
3. Habilite **DriverTouch Pop - Notificações** no acesso a notificações.
4. Preserve a calibração existente ou marque um ponto dentro do cartão da viagem.
5. Deixe **Aceitar corridas automaticamente** ligado.

## Build

```text
build-apk-windows.bat
```

O script usa Java 17 portátil e Android Command-line Tools. A esteira `.github/workflows/android-debug.yml` também executa TypeScript, testes, lint, prebuild, Gradle release e publica a APK independente.

## Estrutura

| Caminho | Responsabilidade |
| --- | --- |
| `app/(tabs)/` | Painel, calibração, permissões, ajustes e registro |
| `lib/` | Configuração local, migração e ponte TypeScript |
| `modules/safe-accept/android/` | Listener de notificações, Acessibilidade e gesto Kotlin |
| `docs/REAL_OFFER_FLOW.md` | Fluxo derivado das capturas reais |
| `tests/` | Migração, calibração e estado de execução |

O projeto não modifica o APK da PopMove, não usa backend e não envia dados de corrida para servidor.
