# DriverTouch Pop — plano de continuidade

## Concluído na versão 0.2.0

- [x] Remover backend, OAuth, banco, LLM e telas de demonstração da Manus
- [x] Remover permissões e dependências sem relação com o produto
- [x] Renomear e organizar o módulo nativo `safe-accept`
- [x] Corrigir a ordem e os diagnósticos do build Windows
- [x] Usar Java 17 portátil e Android Command-line Tools
- [x] Iniciar aplicativo e serviço sempre desarmados
- [x] Desarmar ao trocar modo, calibração ou parâmetros
- [x] Exigir confirmação para armar o modo assistido
- [x] Limitar a uma tentativa por aparição do marcador
- [x] Integrar eventos nativos à tela Registro
- [x] Corrigir a grade manual para usar dimensões reais
- [x] Criar calibração guiada sobre o POP driver
- [x] Adicionar diagnóstico de árvore/marker no modo de teste
- [x] Ampliar os testes de calibração e migração segura
- [x] Alinhar dependências ao Expo SDK 54
- [x] Aprovar Expo Doctor, TypeScript, testes e prebuild
- [x] Compilar e validar o módulo Kotlin `safe-accept`
- [x] Criar build de APK reproduzível no GitHub Actions

## Depende de aparelho físico

- [ ] Instalar a APK debug
- [ ] Confirmar o pacote real do POP driver
- [ ] Confirmar que o serviço aparece e pode ser revogado em Acessibilidade
- [ ] Validar a sobreposição de calibração no modelo do aparelho
- [ ] Verificar se a oferta expõe texto ou descrição acessível
- [ ] Definir o marcador estável
- [ ] Validar duração do toque
- [ ] Confirmar que uma aparição gera somente um evento/gesto
- [ ] Revisar termos da PopMove antes de qualquer distribuição

## Auditoria de notificações e rolagem — versão 0.3.0

- [x] Auditar o vínculo entre evento de acessibilidade, marcador e gesto prolongado
- [x] Adicionar listener diagnóstico de notificações do PopDriver sem persistir dados da corrida
- [x] Adicionar rolagem única e limitada após sinal compatível de notificação
- [ ] Gerar e instalar nova APK release para validar notificações e rolagem no Moto G84 5G
