# Design do DriverTouch Pop

## Princípio

A interface existe para mostrar se a execução automática está ligada, administrar as duas permissões Android, preservar a calibração e oferecer desligamento imediato. Não há seletor de teste/assistido.

## Telas

| Tela | Função |
| --- | --- |
| Painel | Estado ativo/desligado, serviço, calibração e último evento |
| Calibrar | Marcar um ponto dentro do cartão da viagem |
| Ajustes | Duração, atraso e frase real do cartão |
| Permissões | Acessibilidade e notificações, ambas com estado visível |
| Registro | Sequência técnica de detecção, abertura e gesto |

## Estados visuais

- Verde: execução automática ativa.
- Azul: calibrado, mas desligado ou aguardando permissão.
- Cinza: calibração pendente.
- Vermelho: ação explícita de desligar.

O painel evita confirmações repetitivas. Ligar começa a execução; desligar interrompe o módulo nativo imediatamente.
