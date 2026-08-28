# Auditoria de notificações, ofertas e rolagem

## Resposta direta sobre a versão anterior

A calibração do ponto, sozinha, não significa que o aplicativo saiba quando aceitar uma corrida. Na versão anterior, o serviço somente examinava eventos de acessibilidade do pacote `br.com.popmove.driver`, procurava o marcador textual configurado — inicialmente `aceitar` — na árvore acessível e, se o marcador aparecesse, enviava o gesto no ponto calibrado.

Portanto, a versão anterior **não era um detector de nova corrida por notificação**. Ela também não tinha um listener separado para notificações e não tinha rolagem programática. Uma nova oferta só seria percebida se a mudança de conteúdo do PopDriver produzisse uma árvore acessível contendo o marcador esperado.

## O que foi acrescentado nesta rodada

Foi incluído `PopMoveNotificationListenerService`, declarado com `BIND_NOTIFICATION_LISTENER_SERVICE`. Ele observa notificações apenas do pacote configurado para o PopDriver, classifica a presença de marcadores genéricos de oferta e salva somente metadados técnicos. O texto, valor, endereço e identificadores da corrida não são persistidos.

O listener não aceita corrida e não dispara gesto. Ele cria apenas um sinal temporário de que uma notificação compatível apareceu. O painel de permissões ganhou um botão para abrir a tela de acesso às notificações, e o Registro ganhou um ícone para eventos `notification`.

Também foi adicionada rolagem experimental. Se o modo assistido estiver armado, houver uma notificação compatível nos últimos 90 segundos e o marcador ainda não estiver visível, o serviço procura um nó rolável e solicita **uma única rolagem para frente a cada 12 segundos**. Depois da rolagem, um novo evento de conteúdo pode fazer o serviço reavaliar a árvore e encontrar o marcador. Se o marcador aparecer, a lógica existente pode então enviar o toque prolongado conforme a calibração.

## Por que isso ainda não prova que a segunda corrida funcionará

Uma notificação pode ser apenas informativa, atrasada, agrupada ou relacionada a outro estado do aplicativo. O Android fornece callbacks para notificações publicadas e para eventos de acessibilidade, mas nenhum desses sinais, sozinho, prova que a oferta correta está visível e pronta para aceite. A árvore de acessibilidade também pode não conter todo o texto ou pode estar momentaneamente desatualizada [1] [2].

A combinação atual é, portanto, uma **camada de diagnóstico e tentativa controlada**, não uma garantia de aceite. O próximo teste deve verificar no Registro, nesta ordem: notificação compatível, tentativa de rolagem, marcador encontrado e resultado do gesto.

## Procedimento de teste recomendado

1. Instalar a nova APK release.
2. Habilitar o serviço de Acessibilidade do DriverTouch Pop.
3. Habilitar também o acesso a notificações do DriverTouch Pop.
4. Manter o modo **Teste** para observar notificações e eventos sem executar gesto.
5. Abrir o PopDriver com o veículo parado e provocar uma oferta de teste.
6. Consultar o Registro e anotar se apareceu evento de notificação.
7. Se a oferta estiver abaixo da área visível, repetir em modo assistido somente em ambiente controlado e observar se aparece o evento de rolagem.
8. Confirmar se o marcador textual aparece depois da rolagem.

A próxima implementação só deve transformar a notificação em gatilho forte depois que um conjunto real de eventos do aparelho confirmar a relação entre notificação, tela de oferta e ação de aceite. Não se deve adicionar rolagem contínua ou tentativas em loop.

## Referências

[1]: https://developer.android.com/reference/android/service/notification/NotificationListenerService "Android Developers — NotificationListenerService"
[2]: https://developer.android.com/guide/topics/ui/accessibility/service "Android Developers — Create an accessibility service"
