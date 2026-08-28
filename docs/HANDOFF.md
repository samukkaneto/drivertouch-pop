# Continuidade do projeto

## Objetivo

Aceitar automaticamente ofertas do POP driver para reduzir a interação do motorista com o telefone, inclusive quando uma nova viagem chega durante outra em andamento.

## Evidência real incorporada

Capturas de 28/08/2026 confirmaram que não há botão de aceite. A tela ociosa mostra `Aguarde uma solicitação`; o heads-up mostra `Você tem uma nova viagem próxima`; a oferta vira um cartão com `PRESSIONE E SEGURE PARA ATENDER`.

## Decisões atuais

- Execução real, sem modo de teste.
- Pacote oficial `br.com.popmove.driver` confirmado na Play Store e nas capturas.
- Notificação cria a identidade da oferta e só abre o POP driver quando ele não está em primeiro plano.
- Durante uma corrida, a busca rola rapidamente até exibir o novo cartão.
- Marcador acessível direciona o gesto automaticamente.
- Calibração preservada funciona como fallback quando o texto não aparece na árvore.
- Uma identidade gera um gesto inicial e, somente se o cartão não responder, uma repetição mais longa.
- A duração começa em 1.600 ms sem atraso e aprende pela resposta do cartão.
- Configuração calibrada permanece ativa entre reinícios.
- Sem backend, login próprio, telemetria ou armazenamento do conteúdo da corrida.

## Entrega

A versão 0.5.0 mantém o fluxo real da 0.4.0 e acrescenta abertura consciente da janela, rolagem de ofertas em fila, latência reduzida e pressão adaptativa. A esteira do GitHub é a fonte de validação de TypeScript, testes, lint, prebuild, Kotlin/Gradle, assinatura e APK.

Build aprovado no GitHub Actions em 28/08/2026: execução `33167890429`, commit de implementação `9c84e36`, pacote `com.drivertouch.pop`, `versionCode 5` e assinatura compatível com a 0.4.0.
