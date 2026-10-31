# Toalha Vermelha 0.13.2 — teste do comando do cartão

## Evidência e objetivo

O proprietário relata que o balão de autoclique aparece na tentativa de toque. Não é necessário repetir a comparação com Acessibilidade ociosa. A amostra da 0.12.0 não ofereceu ações na notificação.

O próximo teste verifica se o cartão expõe um `ACTION_LONG_CLICK` utilizável. Essa é uma ação documentada do Android; não esconde a Acessibilidade nem garante ausência do aviso. Pode estar ausente ou não efetivar o aceite. O retorno de `performAction` não confirma aceite pelo servidor.

## Instalação e teste no Moto G84 5G / Android 15

1. Instalar 0.13.2 sobre a anterior. Pacote e certificado devem ser iguais; o build confere a assinatura. A atualização preserva a calibração. Confira o estado na tela antes de iniciar; o botão ativa explicitamente o teste.
2. Com o veículo estacionado, habilitar Acessibilidade e acesso às notificações do Toalha Vermelha.
3. Abrir **Diagnóstico** e tocar **Iniciar teste de uma oferta**. Aguardar **Teste ativo — aguardando oferta**. O botão seleciona o método, uma corrida e ativa nativamente. Se não iniciar, a tela explica o motivo.
4. Manter o PopMove em primeiro plano e o cartão da oferta visível. Este método não rola a tela.
5. Após a tentativa, conferir no PopMove se aceitou e se mostrou o aviso. Abrir **Diagnóstico**, marcar a observação e compartilhar o relatório. Não zerar antes de compartilhar.

O modo Uma corrida pausa após processar a oferta, mesmo sem comando disponível. Para outra tentativa, tocar novamente **Iniciar teste de uma oferta**. **Parar teste** desliga. **Apagar histórico do relatório** fica separado no final da tela e só funciona com execução parada. Corridas seguidas permanece disponível para novas ofertas visíveis. O modo **Toque anterior** mantém a execução antiga, separada do teste.

## Critérios do novo método

- Pacote correto, frase exata, controle visível/habilitado, área dentro dos limites seguros, `isLongClickable` e ação anunciada.
- Seleciona o controle elegível menor entre controles aninhados; rejeita cartões distintos ou leitura incompleta (limites de 600 nós/40 níveis).
- Executa uma única ação anunciada. Nenhum gesto de coordenada, repetição ou rolagem é usado como alternativa.
- Registra contagens de nós com ação de pressionamento longo e com `ACTION_PRESS_AND_HOLD`. Esta última é apenas inspecionada, não executada.
- Sem comando: caminho indisponível nessa amostra. Comando recusado: não confirmou resposta. Comando respondido: exige observar aceite real e aviso no aparelho.

## Histórico e estado — diagnóstico v3

- A tela distingue teste pausado de teste ativo e registra início explícito/contagem de comandos da tentativa. Ler notificações com execução desligada não testa o comando.
- Até 20 atualizações de notificações são preservadas com número sequencial, horário de recebimento e publicação.
- Cada observação manual copia a última oferta e o resultado do cartão já conhecidos. Atualizações futuras não mudam esse vínculo. Não é uma identificação automática de qual oferta o usuário viu.
- Observações antigas não tinham esse vínculo. O relatório informa essa limitação, sem concluir que a marcação aconteceu antes de o usuário receber uma oferta.
- Horários UTC. Contagens incluem atualizações da mesma oferta. Histórico antigo sobrescrito na 0.12 não pode ser reconstruído.
- Somente metadados estruturais do pacote alvo são persistidos. Sem textos, endereços, valores, nomes de passageiros ou conteúdo de comandos.

## Verificação da entrega

TypeScript, ESLint, 28 testes Vitest, testes JVM, build Android, identidade e assinatura aprovados no workflow 41220404044. O teste real no PopMove depende do aparelho autenticado do proprietário.
