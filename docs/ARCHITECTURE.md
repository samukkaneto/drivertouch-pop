# Arquitetura técnica

## Componentes

```text
POP driver notification
        ↓ pacote + frase real
PopMoveNotificationListenerService
        ↓ hash da oferta + abertura apenas se necessária
POP driver em primeiro plano
        ↓ eventos e árvore acessível
PopMoveAccessibilityService
        ↓ frase exata ou rolagem vertical de fila
GestureDescription (toque prolongado adaptativo)
```

O aplicativo Expo configura e exibe o estado. A operação fica inteiramente no módulo Kotlin e em `SharedPreferences`, portanto continua funcionando quando a interface do DriverTouch está fechada.

## Detecção

- Pacote alvo fixo: `br.com.popmove.driver`.
- Notificação forte: `Você tem uma nova viagem próxima`.
- Marcador forte na tela: `PRESSIONE E SEGURE PARA ATENDER`.
- Tela ociosa conhecida: `Aguarde uma solicitação`.
- O listener consulta a janela ativa e não abre o POP driver quando ele já está em primeiro plano.
- As leituras começam em 0 ms; não existe atraso fixo de reconhecimento.
- O marcador só é aceito quando `isVisibleToUser` e seus limites intersectam a área segura da janela do POP driver.
- Se a viagem chegou durante outra corrida, o serviço usa exclusivamente um arrasto reto de baixo para cima: X fixo em 72% da área útil, de 78% para 20% da altura útil, em 120 ms. São no máximo três tentativas.
- `ACTION_SCROLL_FORWARD` não é usado porque o primeiro contêiner rolável pode ser horizontal.
- A área segura termina em 88% da altura física, antes da navegação do Android. Isso vale tanto para a rolagem quanto para o toque.
- Se a frase completa não estiver visível depois da busca, o fluxo termina sem pressão. Não existe retorno automático para a coordenada calibrada.
- Antes de cada pressão, a árvore é relida e o centro atual da frase é validado novamente. Assim uma coordenada fora da tela nunca alcança Início/Google Assistente/Gemini.

## Velocidade e aprendizado

- Perfil inicial: zero milissegundo de atraso e pressão de 1.600 ms.
- Após a pressão, a árvore é relida em 350 ms.
- Se o cartão não mudou, há uma única repetição imediata com exatamente a mesma duração.
- A cada três respostas positivas, a duração cai 25 ms, nunca abaixo do piso seguro de 1.450 ms para o perfil padrão.
- Falhas e leituras inconclusivas não aumentam a duração nem apagam a sequência de sucessos.
- A versão 0.8.0 migra valores antigos inflados para no máximo 1.600 ms, preservando qualquer valor menor já aprendido.
- A melhor duração fica protegida em `SharedPreferences` e aparece no painel.

## Corridas em fila

Cada aviso é normalizado sem acentos e sem o contador de minutos. O conteúdo restante vira apenas um hash. Como uma nova viagem contém outro endereço, ela produz nova identidade mesmo que o cartão anterior não tenha emitido um evento de desaparecimento. A mesma identidade fica bloqueada por dois minutos para impedir repetição.

## Estado

- Configuração calibrada antiga em `test` ou `assist` migra para execução ativa.
- `off` continua desligado.
- Reiniciar o aplicativo ou reconectar o serviço não desliga a execução.
- O painel pode desligar imediatamente; o Android continua responsável por revogar as duas permissões.

## Privacidade

Texto, endereço, valor e destino não são gravados. O Registro mantém somente mensagens técnicas e hashes não reversíveis usados para deduplicação.
