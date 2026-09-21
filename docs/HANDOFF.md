# Continuidade do projeto

> Estado confirmado em 21/09/2026. Leia primeiro [`PROJECT_STATUS.md`](PROJECT_STATUS.md), que é o relatório mestre e a fonte de verdade para retomada.

## Situação atual

O DriverTouch Pop 0.8.0 está funcional e o proprietário confirmou que opera como deveria. Não existe desenvolvimento funcional pendente. O repositório privado, a branch `main`, o histórico, os relatórios e as releases formam o backup oficial.

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

- Versão: `0.8.0` / `versionCode 8`.
- Implementação: commit `4edf9d9`.
- Build aprovado: GitHub Actions `33881351152`.
- Pacote: `com.drivertouch.pop`.
- Assinatura: APK Signature Scheme v2, compatível com a 0.7.0.
- APK: release `v0.8.0`, arquivo `DriverTouch-Pop-0.8.0-execucao.apk`.
- SHA-256: `B455C4FE48204E0794BDF0156C15F1CC0EE51DD9736FD89B94396AEF4B6D0C21`.

## Trabalho restante

Nenhum para o escopo atual. Só reabrir desenvolvimento se o POP driver mudar pacote, textos, layout, duração exigida ou comportamento de notificações, ou se surgir uma nova exigência do usuário/Android.