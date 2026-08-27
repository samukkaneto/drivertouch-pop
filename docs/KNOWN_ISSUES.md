# Riscos e pendências

## Dependências de evidência real

| ID   | Questão                                                        | Situação                                       |
| ---- | -------------------------------------------------------------- | ---------------------------------------------- |
| D-01 | O pacote instalado é `br.com.popmove.driver`?                  | Obtido de fonte pública; confirmar no aparelho |
| D-02 | A oferta expõe texto ou descrição acessível?                   | Não confirmado                                 |
| D-03 | Qual marcador é estável?                                       | Padrão atual: `aceitar`                        |
| D-04 | Qual duração o controle aceita?                                | Padrão atual: 2.000 ms                         |
| D-05 | A sobreposição se comporta corretamente no modelo do aparelho? | Precisa de teste físico                        |

## Riscos mitigados no código

| Risco anterior                        | Mitigação atual                                                    |
| ------------------------------------- | ------------------------------------------------------------------ |
| Repetição na mesma oferta             | Trava por aparição, não apenas cooldown                            |
| Armar depois de reinício              | Aplicativo e serviço sempre iniciam desarmados                     |
| Trocar ajustes mantendo gesto ativo   | Toda mudança operacional desarma                                   |
| Calibração incorreta em tela estreita | Medição real da grade e calibração sobre o app alvo                |
| Eventos Kotlin invisíveis             | Registro nativo persistente integrado à interface                  |
| “Desligar” ambíguo                    | Interface distingue desarmar de revogar a permissão Android        |
| Build falhando antes do prebuild      | `local.properties` agora é criado depois do prebuild               |
| Computador sem espaço para NDK        | Verificação prévia de espaço e build alternativo no GitHub Actions |
| Dependências e permissões da Manus    | Backend, OAuth, LLM, áudio, vídeo e notificações removidos         |

## Limites deliberados

- Se uma nova oferta substituir outra sem o marcador desaparecer em nenhum evento acessível, o serviço não fará uma segunda tentativa. Essa falsa negativa é preferível a um aceite duplicado.
- O diagnóstico não salva o texto completo da tela; se a árvore não expuser o marcador, poderá ser necessário um print anonimizado ou inspeção local controlada.
- O serviço não consegue revogar sozinho a própria permissão de acessibilidade. O Android exige ação do usuário.
- A APK de teste atual é `arm64-v8a`; aparelhos exclusivamente 32-bit exigirão uma variante específica.
- Não distribuir publicamente antes de revisar os termos da PopMove e as políticas aplicáveis ao uso da API de acessibilidade.
