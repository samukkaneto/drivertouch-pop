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
- A duração começa em no máximo 1.600 ms sem atraso, só diminui após respostas positivas e nunca aumenta por falha de leitura.
- Configuração calibrada permanece ativa entre reinícios.
- Sem backend, login próprio, telemetria ou armazenamento do conteúdo da corrida.

## Entrega

A versão 0.8.0 preserva as proteções da 0.7.0 e corrige a degradação progressiva: o valor aprendido agora é uma trava monotônica, falhas repetem a mesma duração sem gravar aumento e instalações com valores inflados são recuperadas automaticamente. A esteira do GitHub é a fonte de validação de TypeScript, testes, lint, prebuild, Kotlin/Gradle, assinatura e APK.

O build 0.8.0 deve confirmar o pacote `com.drivertouch.pop`, `versionCode 8` e assinatura compatível com a versão anterior antes da publicação.
