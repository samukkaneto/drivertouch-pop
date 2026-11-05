# Toalha Vermelha 0.14.0 — uso e relatório

## Ativação

1. Instalar sobre a anterior. Na migração, a chave começa desligada e Uma por vez fica selecionado.
2. Com a Acessibilidade autorizada/conectada, ligar a única chave no painel. Abrir o PopMove na tela `Aguarde uma solicitação` para confirmar que está livre.
3. Manter Uma por vez para não aceitar outra viagem enquanto estiver ocupado. Ao voltar à tela de espera, o aplicativo retoma automaticamente. A chave fica ligada o tempo todo.
4. Simultâneas é opcional: aceita novas ofertas e pode rolar para localizar o cartão. A rolagem é curva, com variação limitada de pontos/duração e até três tentativas por oferta. Não comprova indetectabilidade.
5. Desligar a chave encerra novas execuções. Ajustes, calibração e relatório não alteram a chave.

## Reconhecimento de disponibilidade

O sinal confirmado no histórico do projeto é `Aguarde uma solicitação`. Ele deve estar visível e estável por pelo menos 1 segundo, sem uma oferta visível. Após o comando, a liberação também exige ao menos 3 segundos desde o envio para evitar a tela antiga durante a transição. Não existe liberação apenas por tempo. Telas desconhecidas e início no meio de uma corrida permanecem em espera até confirmar a tela livre. Esse retorno automático ainda requer verificação física no PopMove 5.3.0 do proprietário.

O aceite continua usando somente o ACTION_LONG_CLICK anunciado pelo cartão visível e elegível, método que o proprietário confirmou ter aceitado uma corrida sem aviso na 0.13.2. Resposta positiva do Android, isoladamente, não comprova aceite pelo servidor.

## Relatório v4

O relatório é somente observacional. Exibe chave, modo Uma por vez/Simultâneas, disponibilidade, serviços conectados, últimos comandos, notificações e observações manuais. Apagar registros não muda a chave. Observações preservam a oferta e o resultado conhecidos naquele instante, sem substituição por notificações posteriores.

Não guarda textos, nomes, endereços, valores ou conteúdo de comandos. Até 20 atualizações de notificações são mantidas. Horários em UTC. Dados antigos continuam identificados conforme os campos disponíveis na versão original.

## Verificação

TypeScript, ESLint, Vitest, testes JVM, build Android, identidade do pacote e assinatura antes da entrega. A validação real da retomada após terminar uma viagem e da rolagem simultânea depende do aparelho autenticado.

## Abertura a partir de outro aplicativo — relatório v5

Na 0.14.1, **Último fluxo de abertura** separa a solicitação ao Android, a janela confirmada pela Acessibilidade e o comando do cartão. Uma solicitação enviada pode não colocar o PopMove na tela. O relatório identifica também disponibilidade não confirmada, tela bloqueada e serviço desconectado.

Para verificar no Moto G84, ligue a chave em **Uma por vez**, deixe o PopMove mostrar **Aguarde uma solicitação** e então abra o WhatsApp com a tela desbloqueada. Se uma oferta chegar e houver falha, confira se o PopMove chegou a aparecer e copie o relatório. A confirmação do comando não comprova aceite pelo servidor.
