# DriverTouch Pop

Aplicativo Android local que aceita automaticamente novas viagens no **POP driver** para reduzir a interação manual do motorista.

## Estado atual — versão 0.8.0

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
3. Se o POP driver já está em primeiro plano, nenhuma abertura é executada. Caso contrário, o `contentIntent` leva o app à oferta.
4. O serviço procura imediatamente `PRESSIONE E SEGURE PARA ATENDER`, mas só considera o texto que o Android confirma como realmente visível dentro da área útil do POP driver.
5. Durante outra corrida, faz até três arrastos verticais longos, do ponto inferior para o superior, para trazer o novo cartão que está abaixo. O eixo fica em 72% da largura e termina muito antes da barra de navegação do Android.
6. Interrompe a rolagem assim que a frase completa fica visível. Sem `PRESSIONE E SEGURE PARA ATENDER` visível e com limites seguros, nenhuma pressão é executada.
7. O centro do elemento visível define o toque. A coordenada antiga de calibração nunca é usada como destino automático e, imediatamente antes da pressão, o serviço confirma novamente a frase e a janela do POP driver.
8. A pressão começa em no máximo 1.600 ms sem atraso artificial. O cartão é observado depois do gesto: se permanecer igual, o serviço repete uma vez com a mesma duração protegida; após três sucessos, reduz 25 ms até o piso seguro.
9. A duração aprendida é monotônica: pode diminuir, mas nunca aumenta por falha de leitura. Valores antigos inflados são corrigidos automaticamente para 1.600 ms ou para o melhor valor menor já salvo.
10. A identidade da notificação ou do cartão impede repetir o fluxo na mesma oferta.

## Instalação

1. Instale a APK universal independente (inclui `arm64-v8a`).
2. Habilite **DriverTouch Pop** em Acessibilidade.
3. Habilite **DriverTouch Pop - Notificações** no acesso a notificações.
4. Preserve a calibração existente ou marque um ponto sobre a frase do cartão. Ela confirma a preparação inicial; o toque automático é calculado pela frase que estiver visível naquele momento.
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
