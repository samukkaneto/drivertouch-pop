# Gerar a APK no Windows sem Android Studio

Você não precisa instalar nem abrir o Android Studio. O arquivo `build-apk-windows.bat` baixa apenas as ferramentas necessárias para criar a APK, prepara o projeto e abre a pasta com o arquivo final.

## Faça somente isto

1. Baixe o ZIP do projeto pelo menu **⋯ → Download as ZIP**.
2. Clique com o botão direito no ZIP, escolha **Extrair Tudo…** e depois **Extrair**.
3. Abra a pasta extraída.
4. Dê dois cliques em **`build-apk-windows.bat`**.
5. Se o Windows perguntar se pode instalar **Node.js**, **Java** ou permitir uma ação administrativa, clique em **Sim/Permitir**.
6. Espere. Na primeira vez o procedimento pode demorar porque baixa os componentes Android necessários. Não feche a janela preta.
7. Quando terminar, a pasta da APK abre sozinha. O arquivo se chama **`app-debug.apk`**.

## Onde estará o arquivo

```text
android\app\build\outputs\apk\debug\app-debug.apk
```

Envie esse arquivo para o seu celular Android e toque nele para instalar. Se o Android perguntar se pode instalar aplicativos dessa origem, permita apenas para concluir a instalação.

> Não é necessário token, Android Studio ou publicar no Google Play. O roteiro usa as Android SDK Command-line Tools e o `sdkmanager`, que a documentação oficial do Android prevê para instalar os pacotes de SDK sem a interface do Android Studio [1].

## Se a janela preta parar

Tire uma foto da janela preta inteira e envie aqui. A mensagem mostrará exatamente qual componente faltou ou falhou.

## Referência

[1]: https://developer.android.com/tools/sdkmanager "Android Developers — sdkmanager"
