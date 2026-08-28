# DriverTouch Pop

Auxiliar Android local para reduzir a interação manual do motorista com a tela de ofertas do POP driver. O projeto combina uma interface Expo/React Native com um serviço nativo de acessibilidade em Kotlin.

## Estado atual

A versão 0.2.0 substitui o protótipo genérico criado na Manus por uma base Android dedicada:

- sem login, backend, banco de dados, LLM ou armazenamento em nuvem;
- inicia sempre desarmada, inclusive após reinício do aplicativo ou reconexão do serviço;
- mudanças de modo, calibração ou parâmetros desarmam a automação;
- modo de teste registra diagnósticos sem enviar gestos;
- modo assistido permite no máximo uma tentativa por aparição contínua do marcador;
- calibração guiada pode ser feita diretamente sobre o POP driver por uma sobreposição do serviço;
- eventos do aplicativo e do serviço Kotlin aparecem juntos no registro local;
- botão de desarme interrompe gestos; a revogação total do serviço continua sob controle do Android.

O projeto ainda precisa ser validado em um aparelho físico com o POP driver real. O pacote alvo e o marcador textual continuam sendo hipóteses até esse teste.

## Fluxo seguro de primeiro uso

1. Gerar e instalar a APK independente.
2. Habilitar **DriverTouch Pop** nas configurações de Acessibilidade do Android.
3. Manter o modo **Teste**.
4. Usar **Calibrar sobre o POP driver** para marcar o centro do controle de aceite.
5. Abrir uma tela controlada do POP driver, com o veículo parado.
6. Consultar o Registro para saber se o aplicativo foi detectado e se o marcador apareceu.
7. Somente considerar o modo assistido depois de confirmar detecção, ponto, duração e desarme.

## Desenvolvimento

```powershell
npx --yes pnpm@9.12.0 install
npx --yes pnpm@9.12.0 check
npx --yes pnpm@9.12.0 test
npx expo-doctor
npx expo prebuild --clean --platform android --no-install
```

Para criar uma APK independente no Windows sem Android Studio, execute:

```text
build-apk-windows.bat
```

Reserve pelo menos 7 GB livres na primeira execução. O roteiro baixa OpenJDK 17 portátil, Android Command-line Tools e NDK para `%LOCALAPPDATA%\DriverTouchPop`, valida o projeto e gera uma APK para aparelhos Android 64-bit:

```text
android\app\build\outputs\apk\release\app-release.apk
```

Cada push na `main` executa a esteira **Android standalone APK** no GitHub Actions. Quando ela termina, a APK com o bundle JavaScript incluído fica disponível por 14 dias no artefato `DriverTouch-Pop-standalone`.

## Estrutura principal

| Caminho                               | Responsabilidade                                         |
| ------------------------------------- | -------------------------------------------------------- |
| `app/(tabs)/`                         | Painel, calibração, registro, ajustes e permissões       |
| `lib/safe-accept-context.tsx`         | Estado local, migração segura e persistência             |
| `lib/safe-accept-bridge.ts`           | Contrato entre React Native e Kotlin                     |
| `modules/safe-accept/`                | Expo Module e serviço Android                            |
| `tests/`                              | Testes de calibração, migração e limites de configuração |
| `.github/workflows/android-debug.yml` | Validação e geração de APK no GitHub Actions             |
| `docs/`                               | Arquitetura, build e riscos ainda abertos                |

## Limites

Não existe integração oficial com a PopMove. O uso de `AccessibilityService` exige revisão dos termos da plataforma e das regras de distribuição do Android antes de qualquer publicação. A prioridade deste projeto é reduzir distração; ele não deve criar novos riscos nem ser usado sem validação controlada.
