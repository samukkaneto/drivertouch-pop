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
- Somente um marcador realmente visível e dentro da área útil direciona o gesto automaticamente.
- A calibração preservada não é usada como coordenada automática; não há pressão às cegas nem na barra de navegação.
- Uma identidade gera um gesto inicial e, somente se o cartão não responder, uma repetição mais longa.
- A duração começa em 1.600 ms sem atraso e aprende pela resposta do cartão.
- Configuração calibrada permanece ativa entre reinícios.
- Sem backend, login próprio, telemetria ou armazenamento do conteúdo da corrida.

## Entrega

A versão 0.7.0 preserva o aceite individual e corrige a falha observada em corrida já ativa: texto fora da tela não é mais tratado como visível, a busca usa até três arrastos verticais confinados à área útil e a pressão é recalculada pela frase visível. A esteira do GitHub é a fonte de validação de TypeScript, testes, lint, prebuild, Kotlin/Gradle, assinatura e APK.

Build 0.7.0 aprovado no GitHub Actions em 28/08/2026: execução `33211547498`, commit de implementação `3a9f581`, pacote `com.drivertouch.pop`, `versionCode 7`, assinatura v2 compatível com a 0.6.0 e SHA-256 `0E94F5E27E9498BBF5DD14783567B1FAE7B17F75E5212A4C1D7C7CB5FCAB2D4C`.
