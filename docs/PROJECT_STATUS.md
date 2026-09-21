# DriverTouch Pop — relatório mestre do projeto

Atualizado em **21/09/2026**. Este documento é a fonte principal para qualquer pessoa ou IA que precise entender e continuar o projeto sem acesso às conversas anteriores.

## 1. Resumo executivo

O DriverTouch Pop é um aplicativo Android local que atua como linha auxiliar do motorista: detecta uma nova oferta do POP driver e executa o toque prolongado necessário para aceitá-la, reduzindo a interação manual durante a condução.

O projeto está **funcional e encerrado no escopo atual**. O proprietário confirmou em 21/09/2026 que ele funciona como deveria. Não há funcionalidade pendente. A versão estável é **0.8.0**.

## 2. Backup canônico

- Repositório: `samukkaneto/drivertouch-pop`.
- Visibilidade: **PRIVATE**.
- Branch principal: `main`.
- Release estável: `v0.8.0` — `DriverTouch Pop 0.8.0`.
- APK preservada na release: `DriverTouch-Pop-0.8.0-execucao.apk`.
- Implementação da 0.8.0: commit `4edf9d9`.
- Build aprovado da versão 0.8.0: GitHub Actions `33881351152`.
- Validação integral do backup e do workflow em 21/09/2026: GitHub Actions `35664143363`.
- Package ID do DriverTouch: `com.drivertouch.pop`.
- Versionamento Android: `versionName 0.8.0`, `versionCode 8`.
- SHA-256 da APK: `B455C4FE48204E0794BDF0156C15F1CC0EE51DD9736FD89B94396AEF4B6D0C21`.
- Certificado SHA-256: `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.

Como o repositório é privado, código e releases exigem uma conta GitHub autorizada. A release mantém a APK pronta para instalação; a branch `main` mantém o código, documentação, workflow e histórico.

## 3. Objetivo e escopo

### Objetivo

Aceitar automaticamente ofertas no aplicativo POP driver, inclusive uma nova oferta que aparece abaixo do cartão de uma corrida já em andamento.

### Dentro do escopo

- Android.
- POP driver oficial.
- Detecção por notificação e árvore de Acessibilidade.
- Abertura da oferta somente quando necessária.
- Rolagem vertical para oferta em fila.
- Pressão prolongada no cartão.
- Aprendizado local, somente descendente, da duração.
- Configuração, registro técnico e desligamento no aplicativo DriverTouch.

### Fora do escopo atual

- iOS.
- Modificação do APK da PopMove.
- Backend, conta própria ou servidor.
- Captura ou envio de endereço, valor e destino.
- Suporte já implementado a outros aplicativos de mobilidade.
- Publicação em loja; a distribuição atual é por APK assinada para instalação direta.

## 4. Evidência real do POP driver

As decisões foram baseadas em três capturas do aparelho fornecidas em 28/08/2026:

1. Tela disponível: `Aguarde uma solicitação`.
2. Notificação heads-up: `Você tem uma nova viagem próxima · 1min`.
3. Cartão de oferta: partida, destino, distância, estimativa e `PRESSIONE E SEGURE PARA ATENDER`.

Não existe botão de aceite. O aceite ocorre mantendo pressionado o cartão. Quando uma corrida já está ativa, o cartão atual ocupa mais altura e a próxima oferta aparece abaixo; é necessário arrastar o dedo virtual de baixo para cima para trazer o próximo cartão à tela.

## 5. Identificadores e sinais obrigatórios

- Pacote alvo: `br.com.popmove.driver`.
- Texto forte da notificação: `Você tem uma nova viagem próxima`.
- Texto forte da oferta: `PRESSIONE E SEGURE PARA ATENDER`.
- Texto conhecido da tela ociosa: `Aguarde uma solicitação`.
- Pacote do aplicativo auxiliar: `com.drivertouch.pop`.

Não ampliar esses sinais para notificações genéricas sem nova evidência real. A automação deve permanecer dedicada ao POP driver enquanto não houver uma implementação separada e explicitamente solicitada para outro aplicativo.

## 6. Arquitetura

```text
Notificação do pacote br.com.popmove.driver
        ↓ frase real + identidade hash local
PopMoveNotificationListenerService
        ↓ abrir pelo contentIntent somente se o POP driver não estiver ativo
PopMoveAccessibilityService
        ↓ localizar frase visível ou executar rolagem vertical limitada
GestureDescription
        ↓ pressão prolongada no centro atual da frase/cartão
SharedPreferences
        ↓ estado, deduplicação, duração protegida e registro técnico
Interface Expo/React Native
        ↓ painel, calibração, permissões, ajustes e registro
```

Arquivos principais:

| Caminho | Responsabilidade |
| --- | --- |
| `modules/safe-accept/android/.../PopMoveNotificationListenerService.kt` | Filtra pacote/texto, cria identidade e abre a oferta quando necessário |
| `modules/safe-accept/android/.../PopMoveAccessibilityService.kt` | Lê a tela, rola, valida limites e executa a pressão |
| `modules/safe-accept/android/.../SafeAcceptStore.kt` | Estado persistente, deduplicação e aprendizado monotônico |
| `modules/safe-accept/android/.../SafeAcceptBridgeModule.kt` | Ponte entre Kotlin e interface Expo |
| `app/(tabs)/` | Painel, calibragem, permissões, ajustes e registro |
| `lib/` | Tipos, migração, estado React e ponte TypeScript |
| `tests/` | Proteções de configuração, fluxo nativo e aprendizado |
| `.github/workflows/android-debug.yml` | Verificação e build da APK |

## 7. Fluxo operacional atual

1. O listener ignora qualquer pacote que não seja `br.com.popmove.driver`.
2. O texto da notificação é normalizado e precisa conter a frase confirmada.
3. O conteúdo restante gera somente um hash para distinguir ofertas; o endereço não é persistido.
4. Se o POP driver já estiver aberto, nenhum comando de abertura é executado.
5. O serviço procura imediatamente a frase completa do cartão.
6. Um nó só serve como destino se estiver `isVisibleToUser` e dentro da área segura.
7. Se a frase estiver abaixo do cartão atual, o serviço executa até três arrastos retos de baixo para cima.
8. A rolagem usa X em 72% da área útil, Y de 78% para 20% e duração de 120 ms.
9. A área automática termina em 88% da altura física para excluir a navegação Android.
10. Assim que a frase fica visível, a posição é lida novamente imediatamente antes da pressão.
11. O toque começa sem atraso artificial e mantém a duração protegida.
12. Se o cartão permanecer visível, ocorre no máximo uma repetição com a mesma duração.
13. A identidade impede tratar repetidamente a mesma oferta por dois minutos.

## 8. Duração protegida e aprendizado

A versão 0.8.0 corrigiu a degradação progressiva observada em versões anteriores.

- Duração inicial máxima: 1.600 ms.
- Piso seguro padrão: 1.450 ms.
- A cada três respostas positivas, reduz 25 ms.
- Falha ou leitura inconclusiva não aumenta a duração.
- Falha não apaga a sequência de sucessos.
- A repetição usa a mesma duração, nunca uma duração maior.
- Uma migração única recupera valores antigos inflados para o menor entre duração configurada, duração aprendida e 1.600 ms.
- Alterar a configuração para um número maior não torna o valor aprendido mais lento; um valor menor pode reduzir a trava.
- O painel mostra `Melhor duração protegida`.

Esta política é intencional. Não reintroduzir o antigo `+150 ms` em caso de falha sem nova evidência e autorização explícita.

## 9. Proteções que não devem regredir

- Não usar `ACTION_SCROLL_FORWARD`; o primeiro contêiner rolável pode ser horizontal.
- Não executar pressão somente porque chegou uma notificação.
- Não usar coordenada calibrada como fallback automático.
- Não considerar texto fora da tela como visível.
- Não pressionar fora da janela do POP driver.
- Não iniciar gesto na barra de navegação Android.
- Não repetir indefinidamente.
- Não aumentar duração persistida por leitura inconclusiva.
- Não abrir novamente o POP driver quando ele já estiver ativo.
- Não salvar conteúdo sensível da viagem.

## 10. Calibração e permissões

A calibração continua sendo requisito de preparação e deve ser feita sobre a frase `PRESSIONE E SEGURE PARA ATENDER`. Durante a execução, entretanto, o destino é recalculado pela frase realmente visível; a coordenada calibrada não é usada cegamente.

Permissões necessárias:

1. Serviço de Acessibilidade `DriverTouch Pop`.
2. Acesso às notificações `DriverTouch Pop - Notificações`.

O usuário pode interromper imediatamente pelo painel ou revogar as permissões no Android. Reiniciar o app não desarma uma configuração ativa.

## 11. Build, validação e release

O workflow executa:

```text
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm lint
npx expo prebuild --clean --platform android --no-install
./gradlew :app:assembleRelease --no-daemon --stacktrace
```

No Windows também existe `build-apk-windows.bat`, que usa Java 17 e ferramentas Android portáteis.
Em 21/09/2026, `android-actions/setup-android` foi atualizado de v3 para `v4.0.4` porque o v3 passou a solicitar o pacote removido `tools`. O commit de manutenção é `56f62a1`; a execução `35664143363` aprovou novamente Android SDK, dependências, TypeScript, testes, lint, prebuild, Gradle e upload da APK. Avisos de depreciação de outras actions eram não bloqueantes nessa data.

Antes de publicar outra versão, confirmar:

- Package ID `com.drivertouch.pop`.
- Incremento de `versionName` e `versionCode` em `app.config.ts`, `package.json` e módulo Android.
- APK Signature Scheme v2 válida.
- Mesmo certificado das versões instaladas.
- SHA-256 do arquivo.
- Build completo aprovado no GitHub Actions.
- Release contendo APK com nome explícito de versão.
- Atualização deste relatório e do `HANDOFF.md`.

## 12. Histórico relevante

| Versão | Resultado principal |
| --- | --- |
| 0.3.0-test.1 | Pré-release histórica; não é a versão operacional |
| 0.4.0 | Execução automática real |
| 0.5.0 | Reconhecimento e pressão mais rápidos, com adaptação |
| 0.6.0 | Rolagem vertical para corrida em fila e bloqueio sem frase completa |
| 0.7.0 | Texto precisa estar visível; área segura bloqueia barra Android/Assistente |
| 0.8.0 | Duração monotônica; recuperação automática de valores inflados |

## 13. Validação e estado final

- O build 0.8.0 passou por TypeScript, testes, lint, prebuild, Kotlin/Gradle e empacotamento.
- O APK foi inspecionado com `aapt` e `apksigner`.
- Pacote, versão, assinatura e hash foram confirmados.
- O proprietário relatou em 21/09/2026 que o projeto funciona como deveria.
- Portanto, não existe item funcional pendente no escopo atual.

## 14. Limitações conhecidas

- O funcionamento depende do POP driver continuar expondo os textos e limites na árvore de Acessibilidade.
- Fabricantes podem restringir abertura de atividade ou execução em segundo plano.
- `dispatchGesture` confirma execução do gesto, não a decisão final do servidor da PopMove.
- As duas permissões precisam continuar habilitadas.
- A otimização de bateria do fabricante pode afetar processos em segundo plano.
- Se a interface do POP driver mudar, novas capturas e registro técnico do aparelho serão necessários.

## 15. Como outra IA deve retomar

1. Ler este arquivo inteiro.
2. Ler `HANDOFF.md`, `ARCHITECTURE.md`, `REAL_OFFER_FLOW.md`, `KNOWN_ISSUES.md` e `BUILD_AND_TEST.md`.
3. Confirmar que o repositório continua privado e sincronizar `main`.
4. Consultar a release mais recente e o último workflow aprovado.
5. Não alterar os sinais, limites e proteções sem evidência nova do aparelho.
6. Se houver relato de defeito, diagnosticar pelo Registro e pelo código antes de mudar o gesto.
7. Preservar a assinatura para permitir instalação por cima.
8. Atualizar este relatório após qualquer alteração material.

## 16. Trabalho restante

**Nenhum.** O projeto está armazenado como backup operacional completo. Trabalho futuro só deve começar mediante mudança externa comprovada ou nova solicitação explícita.