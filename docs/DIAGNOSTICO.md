# Toalha Vermelha 0.12.0 — diagnóstico

## Objetivo

Verificar se uma oferta do PopMove publica uma ação de aceite na notificação e registrar em quais estados o proprietário observa o aviso de autoclique. O diagnóstico não executa ações da notificação, não altera o PopMove e não comprova indetectabilidade.

## Funcionamento

- Inicia em diagnóstico na primeira instalação/atualização para 0.12.0. A trava nativa prevalece sobre configurações antigas e sobre a sincronização da interface: nenhuma pressão, rolagem ou abertura automática é realizada enquanto ela está ativa.
- Acessibilidade não é necessária para inspecionar notificações. O usuário concede o acesso às notificações na tela oficial do Android.
- Registra separadamente autorização e conexão dos dois serviços, versões, modelo/Android, eventos de notificação, estrutura das ações, comandos enviados e observações manuais do proprietário.
- Somente o pacote `br.com.popmove.driver` é observado. Textos, endereços, valores, nomes e conteúdo de PendingIntent não são persistidos nem compartilhados. Rótulos das ações são classificados por uma lista fixa; rótulos desconhecidos são descartados.
- Até 12 ações por amostra são inspecionadas; o total original é informado. A última oferta reconhecida e a última notificação são mantidas separadamente. As contagens incluem atualizações da mesma oferta.
- Um rótulo de aceite com comando do PopMove é somente uma candidata; nenhuma ação é acionada para testar.
- A permissão continua visível no Android. O diagnóstico não tenta esconder o aplicativo nem interceptar o mecanismo de detecção do PopMove.
- A automação anterior e os modos Uma corrida/Corridas seguidas continuam no painel. Reativar exige uma escolha explícita que encerra o diagnóstico. A calibração manual continua disponível.

## Primeira medição no Moto G84 5G

1. Instalar a APK 0.12.0 sobre a anterior. Abrir **Diagnóstico** no painel e tocar em **Iniciar medição**.
2. Com o veículo estacionado, desabilitar a Acessibilidade do Toalha Vermelha e habilitar somente seu acesso às notificações.
3. Abrir o PopMove manualmente e aguardar uma oferta real. A APK de diagnóstico não a aceitará.
4. Voltar ao diagnóstico. Marcar **Vi o aviso de autoclique** ou **Não observei o aviso**, conforme ocorrido.
5. Usar **Compartilhar relatório** ou **Mostrar texto para copiar**. O relatório usa horários UTC e identifica as observações como relatos do usuário, com as permissões no instante do registro.

A comparação seguinte pode repetir o fluxo com Acessibilidade ligada e diagnóstico ainda ativo. Não zerar o relatório entre essas observações. Se necessário, testar primeiro com ambos os acessos desligados para obter uma referência. Avisos armazenados pelo PopMove e outros serviços do aparelho podem confundir a comparação; ausência de aviso não comprova que não houve detecção.

## Critérios de decisão

- Sem oferta recebida: ainda não há evidência sobre ações de aceite.
- Oferta recebida sem ações: essa amostra não fornece aceite via `Notification.actions`.
- Ações desconhecidas: inconclusivo; não afirmar que não existe outro caminho.
- Candidata de aceite: preparar um teste específico posterior; não executar automaticamente nesta versão.

## Verificação

- TypeScript, ESLint e 22 testes Vitest aprovados localmente.
- Testes JVM cobrem a prioridade do modo de diagnóstico e a classificação sem retenção de rótulos desconhecidos; executados pelo workflow Android junto aos testes anteriores.
- Build, identidade do pacote e assinatura são verificados pelo workflow antes de publicar a pré-release. A validação no Moto G84 depende do relatório do proprietário.
