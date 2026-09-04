# Fluxo real de oferta do POP driver

## Evidência recebida em 28/08/2026

Foram fornecidas três capturas do mesmo aparelho:

1. tela disponível, com `Aguarde uma solicitação`;
2. heads-up do POP driver com `Você tem uma nova viagem próxima · 1min` e o endereço resumido;
3. cartão completo com partida, destino, distância, estimativa e `PRESSIONE E SEGURE PARA ATENDER`.

O cartão ocupa aproximadamente a parte superior da tela. Não existe botão de aceite. O POP driver atende quando o motorista mantém pressionado qualquer ponto dentro do cartão.

## Máquina de execução

```text
notificação do pacote oficial
        ↓ frase exata reconhecida
identidade privada da oferta + verificar janela ativa
        ↓
POP driver em primeiro plano
        ↓
já estava aberto? ── sim ──> não executar abertura
        ↓
marcador visível na área segura? ── sim ──> validar novamente o centro
        │
        não ──> arrasto de baixo para cima até três vezes
        ↓
frase apareceu? ── não ──> encerrar sem pressionar
        │
        sim ──> centro atual da frase visível
        ↓
toque prolongado adaptativo
        ↓
cartão mudou? ── não ──> repetir uma vez com o mesmo tempo protegido
```

O endereço participa somente de um hash transitório que distingue ofertas; o texto não é persistido. Atualizações repetidas da mesma notificação ficam bloqueadas por dois minutos. Uma nova viagem com conteúdo diferente, inclusive em fila durante uma corrida, recebe outra identidade e pode gerar outro gesto.

## Restrições deliberadas

- Nunca executar gesto fora da janela do pacote `br.com.popmove.driver`.
- Nunca usar uma notificação genérica de corrida; somente a frase real observada.
- Nunca repetir continuamente: no máximo três rolagens e uma repetição do toque por oferta.
- Nunca usar a coordenada calibrada como destino automático; pressionar somente o centro da frase visível dentro da área segura.
- Nunca iniciar um gesto na barra de navegação: a área automática termina em 88% da altura física.
- Manter um desligamento imediato no painel e a revogação completa nas configurações Android.
