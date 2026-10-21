# Continuidade do projeto

> Estado atualizado em 26/09/2026. Leia primeiro [`PROJECT_STATUS.md`](PROJECT_STATUS.md), que é o relatório mestre e a fonte de verdade para retomada.

## Atualização 0.10.0 — 21/10/2026

Esta seção substitui o estado operacional das versões anteriores descrito abaixo.

- Nome exibido: **Toalha Vermelha**; pacote mantido `com.toalhaver.vermelha`; versionCode **10**.
- Calibrar oferece raios de **2%, 4% e 8% da largura da tela**, com prévia circular. Padrão 4%. O destino continua sendo relocalizado pela frase completa visível, nunca pela coordenada antiga.
- Cada tentativa sorteia um ponto em um disco limitado pelos limites visíveis da frase e pela área segura da janela. O pequeno deslocamento durante a pressão também varia e fica dentro do disco; não altera a duração protegida. Se a região é pequena, o raio diminui. Isso não garante indetectabilidade.
- **Uma corrida:** após o Android aceitar o envio de um gesto, o serviço pausa novas ofertas. A repetição limitada da mesma oferta continua permitida. Cancelamento ou resultado inconclusivo também conservam a pausa, pois não há confirmação do servidor. O botão **Liberar próxima corrida** libera uma nova tentativa quando a anterior termina. A pausa é nativa/persistente e sincronizações, ajustes e reabertura não a apagam.
- **Corridas seguidas:** mantém a busca por novas ofertas, inclusive durante uma viagem e com rolagem vertical limitada. Esse modo preserva o comportamento anterior e é o padrão de migração.
- A escolha dos modos é feita no painel. A região é configurada em Calibrar. Calibração sobreposta bloqueia gestos automáticos; repetição e rolagem revalidam o desligamento.
- Testes: TypeScript, testes Vitest existentes e migração, lint; quatro testes Kotlin/JUnit verificam 10.000 amostras, limites, regiões inválidas e a regra de pausa/repetição. O workflow executa os testes nativos antes de gerar o APK.
- Compilação Android e assinatura: aguardando resultado do workflow desta atualização. Teste de aceite real depende do aparelho do proprietário com POP driver autenticado.

## Situação anterior (0.9.0)

O Toalha Vermelha 0.9.0 mantém a base funcional da 0.8.0 e o proprietário confirmou que opera como deveria. A nova APK ainda precisa passar pelo build e teste físico. O repositório privado, a branch `main`, o histórico, os relatórios e as releases formam o backup oficial.

## Objetivo

Aceitar automaticamente ofertas do POP driver para reduzir a interação do motorista com o telefone, inclusive quando uma nova viagem chega durante outra em andamento.

## Evidência real incorporada

Capturas de 28/08/2026 confirmaram que não há botão de aceite. A tela ociosa mostra `Aguarde uma solicitação`; o heads-up mostra `Você tem uma nova viagem próxima`; a oferta vira um cartão com `PRESSIONE E SEGURE PARA ATENDER`.

## Decisões que devem ser preservadas

- Execução real, sem modo de teste.
- Pacote oficial limitado a `br.com.popmove.driver`.
- A notificação só é válida quando contém `Você tem uma nova viagem próxima`.
- Se o POP driver já está em primeiro plano, ele não é aberto novamente.
- Durante uma corrida, a busca usa arrasto vertical de baixo para cima até exibir o próximo cartão.
- Somente a frase completa, realmente visível e dentro da área segura pode direcionar a pressão.
- A calibração preservada não é usada como coordenada automática; não há pressão às cegas.
- Nenhum gesto automático pode atingir a barra de navegação, Google Assistente ou Gemini.
- Cada oferta recebe identidade local para impedir repetição indevida.
- Se o cartão permanecer visível, há no máximo uma repetição com a mesma duração protegida.
- A duração começa em no máximo 1.600 ms, pode diminuir até o piso seguro e nunca aumenta por falha de leitura.
- Configuração e aprendizado permanecem ativos entre reinícios.
- Não há backend, conta própria, telemetria ou armazenamento de endereço, valor ou destino.

## Entrega estável

- Versão nova: `0.9.0` / `versionCode 9`.
- Implementação: commit `4edf9d9`.
- Build aprovado: GitHub Actions `33881351152`.
- Pacote novo: `com.toalhaver.vermelha` (o antigo era `com.drivertouch.pop`).
- Assinatura: será verificada após o build; por ter pacote novo, a APK deve ser instalada como novo aplicativo.
- APK esperada: `Toalha-Vermelha-0.9.0.apk`.
- SHA-256: será registrado após o build.

## Trabalho restante

Validar o build 0.9.0 no Moto G84 5G. Só reabrir desenvolvimento se o POP driver mudar pacote, textos, layout, duração exigida ou comportamento de notificações, ou se surgir uma nova exigência do usuário/Android.
