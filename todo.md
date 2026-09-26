# Toalha Vermelha — estado de execução

## Status

Projeto funcional e encerrado no escopo atual em 21/09/2026. O proprietário confirmou operação conforme esperado. Não há tarefa pendente obrigatória.

## Concluído

- [x] Confirmar pacote oficial `br.com.popmove.driver`
- [x] Incorporar evidência real da tela ociosa, notificação e cartão
- [x] Reconhecer `Você tem uma nova viagem próxima`
- [x] Exigir `PRESSIONE E SEGURE PARA ATENDER` realmente visível
- [x] Abrir pelo `contentIntent` somente quando o POP driver não está em primeiro plano
- [x] Aceitar uma corrida por toque prolongado no cartão
- [x] Rolar verticalmente até o cartão de uma nova corrida durante viagem em andamento
- [x] Bloquear rolagem lateral e gestos na barra de navegação Android
- [x] Distinguir novas viagens por identidade, inclusive em fila
- [x] Iniciar reconhecimento sem atraso artificial
- [x] Usar duração inicial máxima de 1.600 ms
- [x] Aprender somente para reduzir a duração até o piso seguro
- [x] Impedir que falhas aumentem ou apaguem o melhor tempo aprendido
- [x] Migrar automaticamente valores antigos inflados
- [x] Repetir no máximo uma vez, com a mesma duração protegida
- [x] Remover modo de teste e preservar execução entre reinícios
- [x] Manter desligamento imediato e revogação pelas configurações Android
- [x] Validar build, testes, lint, Kotlin/Gradle, pacote e assinatura
- [x] Publicar APK estável 0.8.0
- [x] Confirmar funcionamento operacional no aparelho
- [x] Tornar o repositório privado e documentar a continuidade completa

## Pendências atuais

Nenhuma.

## Eventos que justificam retomar o projeto

- Mudança do pacote ou dos textos do POP driver.
- Mudança do layout que impeça localizar o cartão ou a frase.
- Alteração do Android que afete Acessibilidade, notificações ou gestos.
- Solicitação explícita de suporte a outro aplicativo de mobilidade.
- Relato operacional reproduzível que contradiga o estado atual.