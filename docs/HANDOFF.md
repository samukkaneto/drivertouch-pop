# Continuidade do projeto

## Objetivo

Aceitar automaticamente ofertas do POP driver para reduzir a interação do motorista com o telefone, inclusive quando uma nova viagem chega durante outra em andamento.

## Evidência real incorporada

Capturas de 28/08/2026 confirmaram que não há botão de aceite. A tela ociosa mostra `Aguarde uma solicitação`; o heads-up mostra `Você tem uma nova viagem próxima`; a oferta vira um cartão com `PRESSIONE E SEGURE PARA ATENDER`.

## Decisões atuais

- Execução real, sem modo de teste.
- Pacote oficial `br.com.popmove.driver` confirmado na Play Store e nas capturas.
- Notificação abre o POP driver e cria a identidade da oferta.
- Marcador acessível direciona o gesto automaticamente.
- Calibração preservada funciona como fallback quando o texto não aparece na árvore.
- Uma identidade gera no máximo um gesto em dois minutos.
- Configuração calibrada permanece ativa entre reinícios.
- Sem backend, login próprio, telemetria ou armazenamento do conteúdo da corrida.

## Entrega

A versão 0.4.0 substitui a hipótese `aceitar`, remove teste/assistido da interface e implementa a sequência real notificação → cartão → toque prolongado. A esteira do GitHub é a fonte de validação de TypeScript, testes, lint, prebuild, Kotlin/Gradle, assinatura e APK.
