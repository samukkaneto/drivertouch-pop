$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$SdkRoot = Join-Path $env:LOCALAPPDATA "DriverTouchPop\AndroidSdk"
$ToolsRoot = Join-Path $env:LOCALAPPDATA "DriverTouchPop\tools"
$PortableJavaRoot = Join-Path $ToolsRoot "jdk17"
$LogsRoot = Join-Path $ProjectRoot "build-logs"
$SdkManager = Join-Path $SdkRoot "cmdline-tools\latest\bin\sdkmanager.bat"
$CommandLineToolsUrl = "https://dl.google.com/android/repository/commandlinetools-win-15859902_latest.zip"
$CommandLineToolsSha256 = "90AE805D20434428BFFCB699C290860F19BB5F66A67E6B330067E3DE801FB04A"
$JavaZipUrl = "https://aka.ms/download-jdk/microsoft-jdk-17-windows-x64.zip"
$NdkVersion = "27.1.12297006"
$LogFile = Join-Path $LogsRoot ("build-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".log")

function Write-Step([string] $Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Save-Download([string] $Uri, [string] $Destination) {
  $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
  if ($curl) {
    & $curl.Source --location --fail --retry 4 --retry-delay 2 --continue-at - --output $Destination $Uri
    if ($LASTEXITCODE -eq 0) { return }

    Write-Warning "Não foi possível retomar o arquivo parcial; reiniciando o download."
    if (Test-Path -LiteralPath $Destination) {
      Remove-Item -LiteralPath $Destination -Force
    }
    & $curl.Source --location --fail --retry 4 --retry-delay 2 --output $Destination $Uri
    if ($LASTEXITCODE -eq 0) { return }
    throw "O download falhou após várias tentativas (código $LASTEXITCODE): $Uri"
  }

  Invoke-WebRequest -Uri $Uri -OutFile $Destination
}

function Assert-FreeSpace {
  $sdkDriveName = [System.IO.Path]::GetPathRoot($SdkRoot).Substring(0, 1)
  $freeBytes = (Get-PSDrive -Name $sdkDriveName).Free
  $ndkProperties = Join-Path $SdkRoot "ndk\$NdkVersion\source.properties"
  $minimumGigabytes = if (Test-Path -LiteralPath $ndkProperties) { 2 } else { 7 }
  $minimumBytes = $minimumGigabytes * 1GB

  if ($freeBytes -lt $minimumBytes) {
    $freeGigabytes = [math]::Round($freeBytes / 1GB, 1)
    throw "Espaço insuficiente no disco $sdkDriveName`: ($freeGigabytes GB livres). Libere pelo menos $minimumGigabytes GB e execute novamente."
  }
}

function Get-Java17Home {
  if (Test-Path -LiteralPath $PortableJavaRoot) {
    $portableJava = Get-ChildItem -LiteralPath $PortableJavaRoot -Filter java.exe -File -Recurse -ErrorAction SilentlyContinue |
      Where-Object { $_.Directory.Name -eq "bin" } |
      Select-Object -First 1
    if ($portableJava) {
      return Split-Path -Parent $portableJava.Directory.FullName
    }
  }

  $roots = @(
    "C:\Program Files\Microsoft",
    "C:\Program Files\Eclipse Adoptium",
    "C:\Program Files\Java"
  )

  foreach ($root in $roots) {
    if (-not (Test-Path -LiteralPath $root)) { continue }
    $candidate = Get-ChildItem -LiteralPath $root -Directory -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -match "^(jdk|jdk-)?17" -or $_.Name -match "jdk-17" } |
      Sort-Object Name -Descending |
      Select-Object -First 1
    if ($candidate -and (Test-Path -LiteralPath (Join-Path $candidate.FullName "bin\java.exe"))) {
      return $candidate.FullName
    }
  }

  return $null
}

function Install-PortableJava17 {
  Write-Step "Baixando Microsoft OpenJDK 17 portátil"
  $javaZip = Join-Path $ToolsRoot "microsoft-openjdk-17.zip"
  New-Item -ItemType Directory -Force -Path $ToolsRoot | Out-Null
  if (Test-Path -LiteralPath $PortableJavaRoot) {
    Remove-Item -LiteralPath $PortableJavaRoot -Recurse -Force
  }
  New-Item -ItemType Directory -Force -Path $PortableJavaRoot | Out-Null
  Save-Download $JavaZipUrl $javaZip
  Expand-Archive -LiteralPath $javaZip -DestinationPath $PortableJavaRoot -Force
  Remove-Item -LiteralPath $javaZip -Force
}

function Install-WithWinget([string] $PackageId, [string] $Name) {
  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    throw "O winget não foi encontrado. Instale ou atualize o App Installer pela Microsoft Store e execute novamente."
  }

  Write-Step "Instalando $Name"
  & winget install --exact --id $PackageId --accept-source-agreements --accept-package-agreements
  if ($LASTEXITCODE -ne 0) {
    throw "O winget não conseguiu instalar $Name (código $LASTEXITCODE)."
  }
}

New-Item -ItemType Directory -Force -Path $LogsRoot | Out-Null
Start-Transcript -LiteralPath $LogFile -Force | Out-Null

try {
  Write-Host "DriverTouch Pop - criação local de APK de teste" -ForegroundColor Green
  Write-Host "O processo usa somente Node.js, Java 17 e as ferramentas oficiais do Android."
  Write-Host "Log detalhado: $LogFile"

  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Install-WithWinget "OpenJS.NodeJS.LTS" "Node.js LTS"
    $env:Path = "C:\Program Files\nodejs;$env:Path"
  }
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js foi instalado, mas ainda não está no PATH. Feche esta janela e execute o atalho novamente."
  }

  $nodeVersion = (& node --version).Trim()
  $nodeMajor = [int]($nodeVersion.TrimStart("v").Split(".")[0])
  if ($nodeMajor -lt 20) {
    throw "Node.js $nodeVersion é antigo demais. Instale uma versão LTS 20 ou superior."
  }
  if ($nodeMajor -gt 24) {
    Write-Warning "Node.js $nodeVersion ainda não é uma versão validada neste projeto. Se o Expo falhar, instale Node.js 22 ou 24 LTS."
  }

  $javaHome = Get-Java17Home
  if (-not $javaHome) {
    Install-PortableJava17
    $javaHome = Get-Java17Home
  }
  if (-not $javaHome) {
    throw "Java 17 foi baixado, mas sua pasta não foi localizada."
  }
  $env:JAVA_HOME = $javaHome
  $env:Path = "$javaHome\bin;$env:Path"
  Write-Host "Node: $nodeVersion"
  Write-Host "Java: $javaHome"
  Assert-FreeSpace

  if (-not (Test-Path -LiteralPath $SdkManager)) {
    Write-Step "Baixando Android Command-line Tools"
    $zipPath = Join-Path $ToolsRoot "commandline-tools.zip"
    $extractPath = Join-Path $ToolsRoot "extracted"
    New-Item -ItemType Directory -Force -Path $ToolsRoot, $extractPath, (Join-Path $SdkRoot "cmdline-tools\latest") | Out-Null
    Save-Download $CommandLineToolsUrl $zipPath

    $downloadHash = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash
    if ($downloadHash -ne $CommandLineToolsSha256) {
      throw "O arquivo das ferramentas Android não passou na verificação SHA-256. Download cancelado por segurança."
    }

    Expand-Archive -LiteralPath $zipPath -DestinationPath $extractPath -Force
    Copy-Item -Path (Join-Path $extractPath "cmdline-tools\*") -Destination (Join-Path $SdkRoot "cmdline-tools\latest") -Recurse -Force
    Remove-Item -LiteralPath $zipPath -Force
    Remove-Item -LiteralPath $extractPath -Recurse -Force
  }
  if (-not (Test-Path -LiteralPath $SdkManager)) {
    throw "sdkmanager.bat não foi encontrado após extrair as ferramentas Android."
  }

  $env:ANDROID_HOME = $SdkRoot
  $env:ANDROID_SDK_ROOT = $SdkRoot
  $env:Path = "$SdkRoot\platform-tools;$SdkRoot\cmdline-tools\latest\bin;$env:Path"

  Write-Step "Aceitando licenças e instalando o Android SDK"
  1..100 | ForEach-Object { "y" } | & $SdkManager "--sdk_root=$SdkRoot" --licenses | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw "Não foi possível aceitar as licenças do Android SDK (código $LASTEXITCODE)."
  }

  & $SdkManager "--sdk_root=$SdkRoot" "platform-tools" "platforms;android-36" "build-tools;35.0.0" "build-tools;36.0.0" "ndk;$NdkVersion"
  if ($LASTEXITCODE -ne 0) {
    throw "Não foi possível instalar os componentes do Android SDK (código $LASTEXITCODE)."
  }

  Write-Step "Instalando dependências do projeto"
  Set-Location $ProjectRoot
  & npx --yes pnpm@9.12.0 install --frozen-lockfile
  if ($LASTEXITCODE -ne 0) {
    throw "A instalação das dependências falhou (código $LASTEXITCODE)."
  }

  Write-Step "Gerando o projeto Android limpo"
  & npx expo prebuild --clean --platform android --no-install
  if ($LASTEXITCODE -ne 0) {
    throw "O Expo prebuild falhou (código $LASTEXITCODE)."
  }

  $androidRoot = Join-Path $ProjectRoot "android"
  if (-not (Test-Path -LiteralPath $androidRoot)) {
    throw "O Expo terminou sem criar a pasta android."
  }

  $sdkPathForGradle = $SdkRoot.Replace("\", "\\")
  Set-Content -LiteralPath (Join-Path $androidRoot "local.properties") -Value "sdk.dir=$sdkPathForGradle" -Encoding ASCII

  Write-Step "Executando verificações do TypeScript e testes"
  & npx --yes pnpm@9.12.0 check
  if ($LASTEXITCODE -ne 0) { throw "A verificação TypeScript falhou." }
  & npx --yes pnpm@9.12.0 test
  if ($LASTEXITCODE -ne 0) { throw "Os testes automatizados falharam." }

  Write-Step "Compilando a APK debug"
  Set-Location $androidRoot
  $env:NODE_ENV = "production"
  & (Join-Path $androidRoot "gradlew.bat") ":app:assembleDebug" "--no-daemon" "--stacktrace"
  if ($LASTEXITCODE -ne 0) {
    throw "O Gradle não conseguiu criar a APK (código $LASTEXITCODE). Consulte o log acima."
  }

  $apkFolder = Join-Path $androidRoot "app\build\outputs\apk\debug"
  $apkFile = Join-Path $apkFolder "app-debug.apk"
  if (-not (Test-Path -LiteralPath $apkFile)) {
    throw "O Gradle terminou, mas app-debug.apk não foi localizado."
  }

  Write-Host ""
  Write-Host "APK criada com sucesso:" -ForegroundColor Green
  Write-Host $apkFile -ForegroundColor Green
  Start-Process explorer.exe -ArgumentList $apkFolder
}
catch {
  Write-Host ""
  Write-Host "A APK não foi criada." -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host "Linha do script: $($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor Yellow
  Write-Host "Log completo: $LogFile" -ForegroundColor Yellow
  exit 1
}
finally {
  Stop-Transcript | Out-Null
}
