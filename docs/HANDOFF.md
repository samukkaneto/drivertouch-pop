# Continuidade do projeto

Este documento registra a reconstrução iniciada na versão 0.2.0.

## Objetivo preservado

Reduzir a distração do motorista ao lidar com ofertas no POP driver, mantendo controle explícito, operação local e preferência por falhas seguras.

## O que foi substituído

A base genérica da Manus continha servidor Express, banco MySQL/Drizzle, OAuth, APIs de LLM, áudio, vídeo, notificações e telas de demonstração que não participavam do produto. Esses elementos foram removidos. O projeto agora contém apenas a interface do DriverTouch, a persistência local, o módulo Expo Android e testes relacionados.

## Decisões atuais

- Produto Android dedicado; não altera o APK da PopMove.
- Sem conta, backend ou telemetria.
- `AccessibilityService` filtrado pelo pacote do POP driver.
- Calibração primária por sobreposição do próprio serviço.
- Detecção textual configurável com diagnóstico sem conteúdo sensível.
- No máximo uma tentativa por aparição.
- Toda sessão e reconexão começa desarmada.
- Revogação da permissão continua no Android.
- APK de teste `arm64-v8a`, com build reproduzível no Windows e no GitHub Actions.

## Validação da reconstrução

- TypeScript, lint e 8 testes automatizados aprovados.
- Expo Doctor aprovou 18 de 18 verificações.
- Prebuild Android e autolinking do módulo `safe-accept` aprovados.
- Kotlin do módulo `safe-accept` compilado com sucesso usando Android 36, Kotlin 2.1.20 e NDK 27.
- O empacotamento local completo encontrou falta de espaço no computador; a esteira hospedada gera e publica a APK sem depender desse limite.

## Próxima evidência necessária

Depois da validação automatizada e da criação de uma APK, o único bloqueio legítimo será o aparelho físico. O teste deve confirmar pacote, árvore acessível, marcador, coordenada, duração e comportamento da sobreposição. Prints anonimizados só serão solicitados se o modo de teste demonstrar que a árvore não fornece informação suficiente.
