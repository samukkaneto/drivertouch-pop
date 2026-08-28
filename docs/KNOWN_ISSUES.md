# Limites e fatos conhecidos

## Confirmado

| Item | Estado |
| --- | --- |
| Pacote do POP driver | `br.com.popmove.driver` |
| Texto da notificação | `Você tem uma nova viagem próxima` |
| Texto do cartão | `PRESSIONE E SEGURE PARA ATENDER` |
| Forma de aceite | Toque prolongado no cartão inteiro |
| Tela ociosa | `Aguarde uma solicitação` |

## Limites técnicos restantes

- Uma captura de tela mostra o visual, mas não revela todos os limites publicados na árvore de Acessibilidade. A versão 0.7.0 exige frase completa, `isVisibleToUser`, interseção com a janela segura e uma segunda validação imediatamente antes da pressão.
- O `contentIntent` da notificação é a forma correta de abrir o aplicativo, porém fabricantes podem aplicar restrições adicionais a atividades em segundo plano.
- A conclusão de `dispatchGesture` confirma que o Android executou o toque; somente a mudança de estado do POP driver confirma que o servidor aceitou a viagem.
- O aprendizado observa a resposta aos toques automáticos. Medir silenciosamente o toque manual dentro de outro aplicativo exigiria interceptá-lo e atrapalharia o próprio aceite.
- A APK atual é universal, inclui `arm64-v8a` e é assinada para instalação direta, não para publicação em loja.
- O DriverTouch depende das duas permissões permanecerem habilitadas e de o Android não restringir sua bateria em segundo plano.

Nenhum desses limites é tratado como “modo de teste”; são condições do Android e do aplicativo externo que o Registro torna visíveis.
