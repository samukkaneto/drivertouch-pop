# Gerar a APK no Windows — passo a passo

Este procedimento cria uma **APK de teste** sem usar o botão Publish e sem token de publicação. Você precisa de um notebook Windows com internet e, depois, do seu celular Android para instalar o arquivo.

## Parte 1 — baixar o projeto

Na tela atual do projeto, clique no menu de três pontos **⋯**, no alto à direita, e escolha **Download as ZIP**. Quando o download terminar, abra a pasta **Downloads**, clique com o botão direito no ZIP e escolha **Extrair Tudo**. Extraia para uma pasta simples, por exemplo `C:\PopMoveSafeAccept`.

## Parte 2 — instalar os dois programas necessários

Primeiro instale o **Node.js LTS** em [nodejs.org](https://nodejs.org/). Durante a instalação, mantenha as opções padrão e avance até concluir.

Depois instale o **Android Studio** pelo site oficial do Android. Durante a primeira abertura, mantenha a instalação padrão e aceite a instalação do Android SDK quando o programa oferecer essa opção. O Android Studio é o programa que cria a APK no Windows [1].

> Se o Android Studio perguntar onde instalar o SDK, pode manter o caminho padrão sugerido por ele. Não é necessário criar conta, token ou chave de publicação para gerar uma APK de teste.

## Parte 3 — preparar o Android Studio uma única vez

Abra o **Android Studio**. Na tela inicial, clique em **Open** e selecione esta pasta dentro do projeto extraído:

```text
C:\PopMoveSafeAccept\android
```

Se aparecer uma pergunta para confiar no projeto, escolha **Trust Project**. Aguarde a barra inferior terminar a sincronização. Se o Android Studio oferecer instalar componentes do SDK, clique em **Install** ou **Apply** e aguarde concluir. Essa etapa só é necessária na primeira vez.

## Parte 4 — criar a APK com um duplo clique

Feche o Android Studio após a sincronização. Volte para a pasta `C:\PopMoveSafeAccept` e dê **dois cliques** no arquivo:

```text
build-apk-windows.bat
```

Uma janela preta abrirá. Não feche a janela enquanto ela estiver trabalhando. Na primeira vez pode levar vários minutos, porque ela baixa componentes do projeto. Quando a mensagem disser **“APK criada com sucesso”**, uma pasta abrirá automaticamente.

O arquivo que você procura se chama:

```text
app-debug.apk
```

Ele estará nesta pasta:

```text
C:\PopMoveSafeAccept\android\app\build\outputs\apk\debug\
```

## Parte 5 — instalar no celular

Envie o arquivo `app-debug.apk` para o seu Android por cabo USB, Google Drive, WhatsApp para você mesmo ou outro meio de confiança. No celular, abra o arquivo e permita a instalação quando o Android perguntar se o navegador ou gerenciador de arquivos pode instalar aplicativos desconhecidos. Em seguida, toque em **Instalar**.

## Se a janela preta disser que falta Android SDK

Isso significa apenas que o Android Studio ainda não terminou de instalar os componentes necessários. Faça o seguinte: abra novamente o Android Studio, abra a pasta `android` do projeto, aceite qualquer instalação sugerida e espere terminar. Depois feche o Android Studio e dê dois cliques no arquivo `build-apk-windows.bat` de novo.

## Teste inicial no celular

Abra o **PopMove Safe Accept**, toque em **Calibrar toque**, salve um ponto de teste e abra **Permissões Android**. Ative o serviço somente para o teste inicial. Deixe o modo em **Teste**; nesse modo o aplicativo registra a detecção, mas não tenta executar toque prolongado. Para ajustar a detecção real, envie dois prints da PopMove sem dados pessoais: uma tela sem corrida e outra com a oferta aberta.

## Referência

[1]: https://developer.android.com/build/build-for-release "Android Developers — Build your app for release to users"
