# Arquitetura técnica

## Componentes

```text
POP driver notification
        ↓ pacote + frase real
PopMoveNotificationListenerService
        ↓ hash da oferta + contentIntent
POP driver em primeiro plano
        ↓ eventos e árvore acessível
PopMoveAccessibilityService
        ↓ marcador real ou fallback calibrado
GestureDescription (toque prolongado)
```

O aplicativo Expo configura e exibe o estado. A operação fica inteiramente no módulo Kotlin e em `SharedPreferences`, portanto continua funcionando quando a interface do DriverTouch está fechada.

## Detecção

- Pacote alvo fixo: `br.com.popmove.driver`.
- Notificação forte: `Você tem uma nova viagem próxima`.
- Marcador forte na tela: `PRESSIONE E SEGURE PARA ATENDER`.
- Tela ociosa conhecida: `Aguarde uma solicitação`.
- O listener abre o `contentIntent` do aviso e agenda leituras da janela por cinco segundos.
- Se o marcador estiver acessível, suas coordenadas prevalecem sobre a calibração.
- Se o marcador não estiver acessível, a notificação forte e recente permite usar o ponto calibrado somente quando a janela ativa ainda pertence ao POP driver.

## Corridas em fila

Cada aviso é normalizado sem acentos e sem o contador de minutos. O conteúdo restante vira apenas um hash. Como uma nova viagem contém outro endereço, ela produz nova identidade mesmo que o cartão anterior não tenha emitido um evento de desaparecimento. A mesma identidade fica bloqueada por dois minutos para impedir repetição.

## Estado

- Configuração calibrada antiga em `test` ou `assist` migra para execução ativa.
- `off` continua desligado.
- Reiniciar o aplicativo ou reconectar o serviço não desliga a execução.
- O painel pode desligar imediatamente; o Android continua responsável por revogar as duas permissões.

## Privacidade

Texto, endereço, valor e destino não são gravados. O Registro mantém somente mensagens técnicas e hashes não reversíveis usados para deduplicação.
