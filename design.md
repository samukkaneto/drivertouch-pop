# Plano de design — DriverTouch Pop

## Objetivo do produto

O DriverTouch Pop é um aplicativo Android local para motorista parceiro que oferece uma área de configuração, calibração e monitoramento do modo de aceite assistido. O aplicativo não exibe informações de corridas, não pede login e não armazena dados em nuvem. Ele serve para preparar um gesto de toque prolongado controlado no POP driver após uma configuração explícita feita pelo próprio motorista.

O design considera uso em **retrato 9:16**, uso com uma mão e padrões de interface inspirados na legibilidade e na previsibilidade do iOS, mantendo controles compatíveis com Android. A interface evita ações escondidas: o estado do modo de teste, a permissão e a posição calibrada ficam visíveis na tela inicial.

## Lista de telas

| Tela         | Conteúdo principal                                                                              | Funções                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Painel       | Cartão de estado, seletor de modo, resumo da calibração e acesso rápido aos passos necessários. | Ativar/desativar o modo assistido, abrir permissões, iniciar calibração e consultar o registro local. |
| Configuração | Duração do toque, atraso após detecção, modo de teste e proteção de uma ação por oferta.        | Ajustar e salvar parâmetros locais.                                                                   |
| Calibração   | Fluxo guiado sobre o POP driver e grade manual X/Y.                                             | Capturar um ponto real por aparelho, validar e salvar a calibração.                                   |
| Permissões   | Checklist de requisitos do Android e guia curto de ativação.                                    | Abrir a tela nativa de acessibilidade e voltar para confirmar o estado.                               |
| Registro     | Lista local de eventos do serviço, sem conteúdo da corrida.                                     | Consultar data, hora, tipo de evento e resultado do teste.                                            |

## Fluxos principais

### Preparação inicial

O motorista abre o DriverTouch Pop e visualiza o estado desarmado. Em seguida, escolhe o **modo de teste**, informa a duração de toque e abre a tela de permissões do Android. Depois, acessa “Calibrar”, abre o POP driver pelo fluxo guiado e marca o centro da área de aceite. O painel só permite armar quando serviço e calibração estiverem prontos.

### Uso assistido

Antes de utilizar o POP driver, o motorista abre o painel do auxiliar, confirma que a calibração está correta e deixa o modo de teste ou assistido ligado. O serviço só deve tentar agir quando estiver habilitado, com a PopMove em primeiro plano e após receber um evento de interface compatível. O painel mostra o último evento e mantém um botão de desligamento sempre acessível.

### Revisão e ajuste

Se o toque não corresponder ao ponto desejado, o motorista desliga o modo, retorna à calibração e substitui as coordenadas. O histórico permite confirmar que houve tentativa de gesto, mas não registra identificação, endereço, valor ou qualquer conteúdo da corrida.

## Layout e componentes

O Painel usa uma barra superior simples, título de duas linhas no máximo e uma área principal deslocável. O primeiro elemento é um cartão de estado com cor e texto: cinza para “Aguardando configuração”, âmbar para “Modo de teste” e verde para “Ativo”. Logo abaixo há um controle segmentado para o modo, seguido por três linhas de resumo: serviço, calibração e último evento.

As ações principais aparecem como botões largos com altura mínima de 52 pontos e espaçamento generoso para uso com uma mão. “Desligar agora” fica isolado em vermelho discreto apenas quando o modo estiver ativo. A navegação inferior tem quatro destinos: Painel, Calibrar, Registro e Ajustes. Nenhuma ação irreversível é executada sem confirmação visual.

## Cores

| Papel              | Cor       | Uso                                              |
| ------------------ | --------- | ------------------------------------------------ |
| Azul de direção    | `#155EEF` | Ações principais, estado de configuração e foco. |
| Grafite            | `#101828` | Texto principal e ícones de alta ênfase.         |
| Fundo gelo         | `#F7F9FC` | Fundo claro com baixo cansaço visual.            |
| Superfície branca  | `#FFFFFF` | Cartões e áreas de entrada.                      |
| Verde de prontidão | `#12B76A` | Estado pronto/ativo e confirmações.              |
| Âmbar de teste     | `#F79009` | Modo de teste e avisos operacionais.             |
| Vermelho de parada | `#D92D20` | Ação de desligamento e erro.                     |

## Dados locais

O aplicativo guarda apenas configurações no dispositivo: modo selecionado, duração do toque, atraso, coordenadas normalizadas, identificador do perfil PopMove e um registro limitado de eventos técnicos. Não há autenticação, localização, leitura de conteúdo de corrida ou envio de dados para servidor nesta primeira versão.
