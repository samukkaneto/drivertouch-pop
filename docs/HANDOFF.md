# Continuidade do projeto

> Estado atualizado em 31/10/2026. Leia primeiro [`PROJECT_STATUS.md`](PROJECT_STATUS.md), que é o relatório mestre e a fonte de verdade para retomada.

## Atualização 0.12.0 — diagnóstico

- Preparada na branch `codex/diagnostico-0.12.0`; nome e pacote preservados, versionCode 12.
- Inicia com trava nativa de diagnóstico: observa notificações sem tocar, rolar ou abrir automaticamente o PopMove.
- Tela **Diagnóstico** com instruções, estado real dos serviços, classificação de ações e relatório compartilhável sem conteúdo das corridas.
- A automação anterior exige reativação explícita no painel. Não foi implementada uma nova forma de aceite nem confirmada uma solução para o alerta.
- Procedimento e critérios: [`DIAGNOSTICO.md`](DIAGNOSTICO.md). Compilação e assinatura devem ser conferidas no workflow da pré-release `v0.12.0` antes da entrega.

## Atualização 0.11.0 — 27/10/2026

- Nome exibido: **Toalha Vermelha**; pacote `com.toalhaver.vermelha`; versionCode **11**.
- Gesto automático estacionário no centro da frase de aceite visível; a variação aleatória e o deslocamento foram removidos.
- Raio na tela Calibrar é apenas referência visual. Os modos **Uma corrida** e **Corridas seguidas** permanecem.
- Android e aplicativos com acesso adequado ainda podem identificar o pacote e o serviço de Acessibilidade.
- APK público: [Toalha Vermelha 0.11.0](https://github.com/samukkaneto/drivertouch-pop/releases/download/v0.11.0/Toalha-Vermelha-0.11.0.apk), workflow aprovado `40516216505`.
- Pacote `com.toalhaver.vermelha`, versionCode 11. SHA-256 `a9c69ee60c26e4862d6b5f525937e40a901260b97f92b1a0e207426ae55883b2`; assinatura verificada e compatível com a 0.10.0.

## Histórico 0.10.0 — 21/10/2026

Esta seção substitui o estado operacional das versões anteriores descrito abaixo.

- Nome exibido: **Toalha Vermelha**; pacote mantido `com.toalhaver.vermelha`; versionCode **10**.
- Calibrar oferece raios de **2%, 4% e 8% da largura da tela**, com prévia circular. Padrão 4%. O destino continua sendo relocalizado pela frase completa visível, nunca pela coordenada antiga.
- A versão 0.10.0 variava o ponto e o caminho do gesto; a versão 0.11.0 remove essa variação.
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

## Situação anterior (0.9.0)

O Toalha Vermelha 0.9.0 mantém a base funcional da 0.8.0 e o proprietário confirmou que opera como deveria. A APK de cada nova versão ainda precisa passar pelo build e teste físico. O repositório público, a branch `main`, o histórico, os relatórios e as releases formam o backup oficial.

## Objetivo

Aceitar automaticamente ofertas do POP driver para reduzir a interação do motorista com o telefone, inclusive quando uma nova viagem chega durante outra em andamento.

## Evidência real incorporada

Capturas de 28/08/2026 confirmaram que não há botão de aceite. A tela ociosa mostra `Aguarde uma solicitação`; o heads-up mostra `Você tem uma nova viagem próxima`; a oferta vira um cartão com `PRESSIONE E SEGURE PARA ATENDER`.

## Decisões que devem ser preservadas

- Execução real, sem modo de teste.
- Pacote oficial limitado a `br.com.popmove.driver`.
- A notificação só é válida quando contém `Você tem uma nova viagem próxima`.
- Se o POP driver já está em primeiro plano, ele não é aberto novamente.
- Durante uma corrida, a busca usa arrasto vertical de baixo para cima até exibir o próximo cartão.
- Somente a frase completa, realmente visível e dentro da área segura pode direcionar a pressão.
- A calibração preservada não é usada como coordenada automática; não há pressão às cegas.
- Nenhum gesto automático pode atingir a barra de navegação, Google Assistente ou Gemini.
- Cada oferta recebe identidade local para impedir repetição indevida.
- Se o cartão permanecer visível, há no máximo uma repetição com a mesma duração protegida.
- A duração começa em no máximo 1.600 ms, pode diminuir até o piso seguro e nunca aumenta por falha de leitura.
- Configuração e aprendizado permanecem ativos entre reinícios.
- Não há backend, conta própria, telemetria ou armazenamento de endereço, valor ou destino.

## Entrega estável

- Versão nova: `0.9.0` / `versionCode 9`.
- Implementação: commit `4edf9d9`.
- Build aprovado: GitHub Actions `33881351152`.
- Pacote novo: `com.toalhaver.vermelha` (o antigo era `com.drivertouch.pop`).
- Assinatura: será verificada após o build; por ter pacote novo, a APK deve ser instalada como novo aplicativo.
- APK esperada: `Toalha-Vermelha-0.9.0.apk`.
- SHA-256: será registrado após o build.

## Trabalho restante

Validar o build 0.9.0 no Moto G84 5G. Só reabrir desenvolvimento se o POP driver mudar pacote, textos, layout, duração exigida ou comportamento de notificações, ou se surgir uma nova exigência do usuário/Android.
