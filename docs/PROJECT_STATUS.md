# Toalha Vermelha — relatório mestre do projeto

Atualizado em **31/10/2026**. Este documento é a fonte principal para qualquer pessoa ou IA que precise entender e continuar o projeto sem acesso às conversas anteriores.

## Atualização 0.12.0 — diagnóstico em preparação

- Branch `codex/diagnostico-0.12.0`, versionCode 12, pacote `com.toalhaver.vermelha`.
- Modo de diagnóstico nativo ativo por padrão. Configurações antigas não liberam gestos enquanto o diagnóstico estiver ativo.
- Inspeção passiva das ações de notificações, relatório sem dados das corridas, estados de autorização/conexão e observações manuais do aviso.
- Não executa ações de notificação nem garante indetectabilidade. Os modos anteriores podem ser reativados explicitamente no painel.
- Revisão TypeScript/ESLint e 22 testes Vitest aprovados; build Android, testes JVM e assinatura serão verificados no workflow antes da publicação.
- Próximo dado necessário: relatório do Moto G84 segundo [`DIAGNOSTICO.md`](DIAGNOSTICO.md).

## Atualização 0.11.0 — 27/10/2026

Esta é a versão em preparação para substituir a 0.10.0.

- Nome exibido: **Toalha Vermelha**; pacote `com.toalhaver.vermelha`; versionName **0.11.0**; versionCode **11**.
- O gesto automático fica parado no centro dos limites visíveis da frase de aceite. A variação aleatória de posição e o deslocamento durante a pressão foram removidos.
- O círculo e a escolha de raio em Calibrar são apenas guias visuais; não alteram as coordenadas nem o movimento do gesto automático.
- **Uma corrida** e **Corridas seguidas** continuam disponíveis. Uma corrida pausa novas ofertas após uma tentativa; Corridas seguidas mantém a busca por novas ofertas.
- O pacote e o serviço de Acessibilidade continuam visíveis para o Android e para aplicativos que tenham acesso adequado. Trocar o rótulo ou o identificador do pacote não oculta o serviço.
- Os testes Kotlin verificam o caminho estacionário no centro, regiões inválidas e as regras dos modos de corrida. O workflow GitHub Actions fará tipagem, testes, lint, build Android e verificação da assinatura antes da publicação.
- Workflow aprovado: https://github.com/samukkaneto/drivertouch-pop/actions/runs/40516216505; commit compilado `094cf2620ab8e6d82c015d60b43df3da9bc8edef`.
- APK público: https://github.com/samukkaneto/drivertouch-pop/releases/download/v0.11.0/Toalha-Vermelha-0.11.0.apk (59.560.832 bytes; SHA-256 `a9c69ee60c26e4862d6b5f525937e40a901260b97f92b1a0e207426ae55883b2`).
- AAPT confirmou `com.toalhaver.vermelha`, versionName `0.11.0` e versionCode `11`; assinatura v2 verificada. O certificado SHA-256 é o mesmo da 0.10.0: `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- Tipagem, 18 testes Vitest, lint, testes Kotlin/JUnit e build Android passaram. O aceite real ainda depende de validação no aparelho autenticado.

## Histórico 0.10.0 — 21/10/2026

Esta seção substitui o estado operacional das versões anteriores descrito abaixo.

- Nome exibido: **Toalha Vermelha**; pacote mantido `com.toalhaver.vermelha`; versionCode **10**.
- Calibrar oferece raios de **2%, 4% e 8% da largura da tela**, com prévia circular. Padrão 4%. O destino continua sendo relocalizado pela frase completa visível, nunca pela coordenada antiga.
- A versão 0.10.0 sorteava um ponto no cartão e variava ligeiramente o caminho da pressão. Esse comportamento foi removido na 0.11.0; a descrição fica registrada aqui apenas como histórico.
- **Uma corrida:** após o Android aceitar o envio de um gesto, o serviço pausa novas ofertas. A repetição limitada da mesma oferta continua permitida. Cancelamento ou resultado inconclusivo também conservam a pausa, pois não há confirmação do servidor. O botão **Liberar próxima corrida** libera uma nova tentativa quando a anterior termina. A pausa é nativa/persistente e sincronizações, ajustes e reabertura não a apagam.
- **Corridas seguidas:** mantém a busca por novas ofertas, inclusive durante uma viagem e com rolagem vertical limitada. Esse modo preserva o comportamento anterior e é o padrão de migração.
- A escolha dos modos é feita no painel. A região é configurada em Calibrar. Calibração sobreposta bloqueia gestos automáticos; repetição e rolagem revalidam o desligamento.
- Testes: TypeScript, testes Vitest existentes e migração, lint; quatro testes Kotlin/JUnit verificam 10.000 amostras, limites, regiões inválidas e a regra de pausa/repetição. O workflow executa os testes nativos antes de gerar o APK.
- Verificação inicial aprovada: workflow `39584849922`, commit `4bab923`. TypeScript, 18 testes Vitest, lint, testes Kotlin, Gradle e assinatura APK v2 passaram. O upload de artefatos falhou por cota do GitHub Actions; nenhuma versão antiga foi apagada. A entrega foi migrada para GitHub Releases com publicação isolada (sem checkout nem execução de dependências com token de escrita).
- A nova compilação usa ARM64 explicitamente, compatível com o Moto G84 5G, e memória JVM ajustada após aviso de metaspace no primeiro build.
- Teste de aceite real depende do aparelho do proprietário com POP driver autenticado.


### Entrega histórica da 0.10.0

- Build e publicação aprovados: https://github.com/samukkaneto/drivertouch-pop/actions/runs/39586593332
- Código compilado: `9d231f62c1831710f9f8be3cf21b4a845f6941c9`.
- APK: https://github.com/samukkaneto/drivertouch-pop/releases/download/v0.10.0/Toalha-Vermelha-0.10.0.apk
- Página da release: https://github.com/samukkaneto/drivertouch-pop/releases/tag/v0.10.0
- Tamanho: 59.560.764 bytes.
- SHA-256: `587dcf234c3f34b0b1608ec97ef52410c25f441abedea1634c7ecc157c45f097`.
- Package ID: `com.toalhaver.vermelha`; versionName `0.10.0`; versionCode `10`; nome `Toalha Vermelha`.
- Assinatura v2 validada. Certificado SHA-256: `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`. Certificado da APK anterior não foi comparado nesta sessão.
- A inspeção do APK lista arm64-v8a, armeabi-v7a, x86 e x86_64; a configuração de build solicitou ARM64, mas bibliotecas de outras ABIs também estão presentes no pacote.
- Testes de configuração, tipagem, lint, testes nativos e build passaram. Aceite real no POP driver permanece dependente de validação no aparelho.

## 1. Resumo executivo (histórico até 0.9.0)

O Toalha Vermelha é um aplicativo Android local que atua como linha auxiliar do motorista: detecta uma nova oferta do POP driver e executa o toque prolongado necessário para aceitá-la, reduzindo a interação manual durante a condução.

A base funcional foi confirmada pelo proprietário em 21/09/2026. A versão 0.9.0 preserva esse escopo e introduz a nova identidade solicitada.

## 2. Backup canônico

- Repositório: `samukkaneto/drivertouch-pop` (público; o nome do app foi alterado sem mover o repositório).
- Visibilidade atual: **PUBLIC**.
- Branch principal: `main`.
- Base funcional: `v0.8.0`; nova compilação em preparação: `v0.9.0` — `Toalha Vermelha`.
- APK histórica preservada na release: `DriverTouch-Pop-0.8.0-execucao.apk`; a APK nova será publicada como `Toalha-Vermelha-0.9.0.apk`.
- Implementação-base da 0.8.0: commit `4edf9d9`; a 0.9.0 altera somente identidade e o traçado do gesto.
- Build aprovado da versão 0.8.0: GitHub Actions `33881351152`.
- Validação integral do backup e do workflow em 21/09/2026: GitHub Actions `35664143363`.
- Package ID novo do Toalha Vermelha: `com.toalhaver.vermelha`; o ID antigo era `com.drivertouch.pop`.
- Versionamento Android da nova build: `versionName 0.9.0`, `versionCode 9`.
- SHA-256 da APK 0.9.0: será registrado após o build.
- Certificado: será registrado após o build; como o pacote mudou, a instalação será uma nova instalação e não atualização por cima.

O repositório e suas releases são públicos. A branch `main` mantém o código, documentação, workflow e histórico.

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
- Configuração, registro técnico e desligamento no aplicativo Toalha Vermelha.

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
- Pacote do aplicativo auxiliar: `com.toalhaver.vermelha`.

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

A base 0.8.0 corrigiu a degradação progressiva observada em versões anteriores.

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

1. Serviço de Acessibilidade `Toalha Vermelha`.
2. Acesso às notificações `Toalha Vermelha - Notificações`.

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

- Package ID `com.toalhaver.vermelha`.
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

- O build-base 0.8.0 passou por TypeScript, testes, lint, prebuild, Kotlin/Gradle e empacotamento.
- O APK foi inspecionado com `aapt` e `apksigner`.
- Pacote, versão, assinatura e hash foram confirmados.
- O proprietário relatou em 21/09/2026 que o projeto funciona como deveria.
- A alteração 0.9.0 ainda depende da validação do build e da instalação no Moto G84 5G.

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

**Pendente:** validar a APK 0.9.0 no Moto G84 5G e confirmar as duas permissões após a troca do pacote.
