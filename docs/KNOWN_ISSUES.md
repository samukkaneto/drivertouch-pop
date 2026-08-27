# Problemas conhecidos e pendências

## Bloqueadores atuais

| ID | Problema | Evidência | Próxima ação |
| --- | --- | --- | --- |
| B-01 | APK não validada em aparelho real | O sandbox não tem Android SDK configurado; Gradle parou em “SDK location not found”. | Compilar em máquina com SDK e instalar a debug APK. |
| B-02 | Build remota não entrega APK | Relato do usuário: a barra de compilação avança, depois retorna à opção “Compilar APK” sem download e sem erro visível. | Verificar logs da plataforma de build; fora do controle do código local. |
| B-03 | Script Windows sem Android Studio não foi testado | O usuário informou que “continua dando errado”, mas não forneceu a mensagem da janela. | Obter a saída inteira do PowerShell e corrigir apenas o passo indicado. |
| B-04 | Detecção no POP driver não foi testada | Não houve APK instalada nem prints suficientes da tela real. | Testar modo Teste e inspecionar o resultado no Registro. |

## Riscos de comportamento

| ID | Risco | Descrição | Medida atual |
| --- | --- | --- | --- |
| R-01 | Marcador inacessível | O aplicativo alvo pode não expor texto à API de acessibilidade. | Nenhum gesto ocorre se o marcador não aparecer; modo Teste inicial. |
| R-02 | Calibração incorreta | Mudança de resolução, zoom, rotação ou layout pode deslocar o ponto. | Coordenadas normalizadas editáveis e botão de recalibrar. |
| R-03 | Repetição | Eventos consecutivos podem ocorrer enquanto a tela permanece aberta. | Intervalo mínimo entre gestos. |
| R-04 | Serviço ativo | Um serviço de acessibilidade habilitado é sensível e deve ser revisável pelo usuário. | Estado no app e ação “Desligar agora”; melhoria recomendada: notificação persistente. |
| R-05 | Uso incompatível | Termos do serviço e regras de distribuição podem restringir automação de terceiros. | Não distribuir antes de revisão independente. |

## Pendências de produto

| Prioridade | Item | Critério de aceite |
| --- | --- | --- |
| Alta | Validação de acessibilidade real | Serviço aparece no Android e detecta um elemento deliberadamente escolhido da PopMove. |
| Alta | Kill switch visível | Serviço pode ser desligado de forma inequívoca durante teste. |
| Alta | Confirmar árvore de interface | Registro demonstra se `rootInActiveWindow` contém o marcador. |
| Média | Notificação persistente | Usuário consegue ver rapidamente se o modo assistido está armado. |
| Média | Ajuste por perfil de dispositivo | Calibrações podem ser salvas por resolução/modelo. |
| Baixa | Suporte a outros apps | Implementar somente após isolar a lógica por adaptador. |

## Itens que não devem ser assumidos

Outra IA deve evitar estas suposições até obter evidência:

1. Que `br.com.popmove.driver` é o nome de pacote final em todas as versões.
2. Que “aceitar” é o texto exposto na tela de oferta.
3. Que o gesto de 2.000 ms é aceito pelo POP driver.
4. Que o script Windows teve êxito; a última informação é que houve uma falha não especificada.
5. Que o fluxo de publicação remoto produzirá uma APK sem registrar o resultado.

## Próxima investigação recomendada

Começar pelo ambiente Android físico, não por alterações adicionais de código. A primeira evidência necessária é uma APK instalada e o serviço listado em Acessibilidade. Depois, usar exclusivamente o modo Teste para confirmar o caminho de eventos. Somente com esse resultado será possível decidir se a lógica de marcador textual deve ser corrigida ou se a estratégia técnica precisa ser reavaliada.
