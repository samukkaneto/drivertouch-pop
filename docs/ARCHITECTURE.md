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
        ↓ marcador, rolagem de fila ou fallback calibrado
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
- Se o marcador estiver acessível, suas coordenadas prevalecem sobre a calibração.
- Se a viagem chegou durante outra corrida, o serviço tenta `ACTION_SCROLL_FORWARD` e, se a árvore não expõe um contêiner rolável, usa uma rolagem curta por gesto. São no máximo oito tentativas.
- Se o marcador não estiver acessível depois da busca, a notificação forte e recente permite usar o ponto calibrado somente quando a janela ativa ainda pertence ao POP driver.

## Velocidade e aprendizado

- Perfil inicial: zero milissegundo de atraso e pressão de 1.600 ms.
- Após a pressão, a árvore é relida em 350 ms.
- Se o cartão não mudou, a duração aprendida aumenta 150 ms e há uma única repetição imediata.
- A cada três respostas positivas, a duração cai 25 ms, nunca abaixo do piso seguro de 1.450 ms para o perfil padrão.
- A duração aprendida fica em `SharedPreferences` e aparece no painel.

## Corridas em fila

Cada aviso é normalizado sem acentos e sem o contador de minutos. O conteúdo restante vira apenas um hash. Como uma nova viagem contém outro endereço, ela produz nova identidade mesmo que o cartão anterior não tenha emitido um evento de desaparecimento. A mesma identidade fica bloqueada por dois minutos para impedir repetição.

## Estado

- Configuração calibrada antiga em `test` ou `assist` migra para execução ativa.
- `off` continua desligado.
- Reiniciar o aplicativo ou reconectar o serviço não desliga a execução.
- O painel pode desligar imediatamente; o Android continua responsável por revogar as duas permissões.

## Privacidade

Texto, endereço, valor e destino não são gravados. O Registro mantém somente mensagens técnicas e hashes não reversíveis usados para deduplicação.
