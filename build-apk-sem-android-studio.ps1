$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$SdkRoot = Join-Path $env:LOCALAPPDATA "PopMoveSafeAccept\AndroidSdk"
$ToolsRoot = Join-Path $env:LOCALAPPDATA "PopMoveSafeAccept\tools"
$SdkManager = Join-Path $SdkRoot "cmdline-tools\latest\bin\sdkmanager.bat"
$CommandLineToolsUrl = "https://dl.google.com/android/repository/commandlinetools-win-15859902_latest.zip"

function Write-Step([string] $Message) {
  Write-Host "" 
  Write-Host $Message -ForegroundColor Cyan
}

function Require-Command([string] $Command) {
  return Get-Command $Command -ErrorAction SilentlyContinue
}

function Install-WithWinget([string] $PackageId, [string] $Name) {
  if (-not (Require-Command "winget")) {
    throw "O instalador do Windows (winget) nao foi encontrado. Atualize ou instale o App Installer pela Microsoft Store e execute este arquivo novamente."
  }
  Write-Step "Instalando $Name..."
  & winget install --exact --id $PackageId --accept-source-agreements --accept-package-agreements
  if ($LASTEXITCODE -ne 0) { throw "Nao foi possivel instalar $Name." }
}

try {
  Write-Host "PopMove Safe Accept - geracao de APK sem Android Studio" -ForegroundColor Green
  Write-Host "Este processo instala Node.js, Java e somente as ferramentas Android necessarias." 
  Write-Host "Pode levar alguns minutos e baixar alguns gigabytes."

  if (-not (Require-Command "node")) {
    Install-WithWinget "OpenJS.NodeJS.LTS" "Node.js LTS"
    $env:Path = "C:\Program Files\nodejs;$env:Path"
  }
  if (-not (Require-Command "node")) { throw "O Node.js foi instalado, mas o Windows ainda nao o encontrou. Feche esta janela e execute este arquivo novamente." }

  if (-not (Require-Command "java")) {
    Install-WithWinget "Microsoft.OpenJDK.17" "Java 17"
    $JavaFolder = Get-ChildItem "C:\Program Files\Microsoft" -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "jdk-17*" } | Sort-Object Name -Descending | Select-Object -First 1
    if ($JavaFolder) {
      $env:JAVA_HOME = $JavaFolder.FullName
      $env:Path = "$($JavaFolder.FullName)\bin;$env:Path"
    }
  }
  if (-not (Require-Command "java")) { throw "O Java foi instalado, mas o Windows ainda nao o encontrou. Feche esta janela e execute este arquivo novamente." }

  if (-not (Test-Path $SdkManager)) {
    Write-Step "Baixando apenas as ferramentas Android necessarias..."
    $ZipPath = Join-Path $ToolsRoot "commandline-tools.zip"
    $ExtractPath = Join-Path $ToolsRoot "extracted"
    New-Item -ItemType Directory -Force -Path $ToolsRoot, $ExtractPath, (Join-Path $SdkRoot "cmdline-tools\latest") | Out-Null
    Invoke-WebRequest -Uri $CommandLineToolsUrl -OutFile $ZipPath
    Expand-Archive -Path $ZipPath -DestinationPath $ExtractPath -Force
    Copy-Item -Path (Join-Path $ExtractPath "cmdline-tools\*") -Destination (Join-Path $SdkRoot "cmdline-tools\latest") -Recurse -Force
  }

  Write-Step "Instalando os componentes Android para a APK..."
  $env:ANDROID_HOME = $SdkRoot
  $env:ANDROID_SDK_ROOT = $SdkRoot
  $env:Path = "$SdkRoot\platform-tools;$SdkRoot\cmdline-tools\latest\bin;$env:Path"
  1..100 | ForEach-Object { "y" } | & $SdkManager "--sdk_root=$SdkRoot" --licenses | Out-Host
  & $SdkManager "--sdk_root=$SdkRoot" "platform-tools" "platforms;android-36" "build-tools;36.0.0"
  if ($LASTEXITCODE -ne 0) { throw "Nao foi possivel instalar os componentes Android." }

  $SdkPathForGradle = $SdkRoot.Replace("\", "\\")
  Set-Content -Path (Join-Path $ProjectRoot "android\local.properties") -Value "sdk.dir=$SdkPathForGradle" -Encoding ASCII

  Write-Step "Preparando o projeto..."
  Set-Location $ProjectRoot
  & npx --yes pnpm@9.12.0 install
  if ($LASTEXITCODE -ne 0) { throw "Nao foi possivel preparar as dependencias do projeto." }
  & npx expo prebuild --platform android --no-install
  if ($LASTEXITCODE -ne 0) { throw "Nao foi possivel preparar os arquivos Android do projeto." }

  Write-Step "Criando a APK..."
  & (Join-Path $ProjectRoot "android\gradlew.bat") "assembleDebug" "--no-daemon"
  if ($LASTEXITCODE -ne 0) { throw "A compilacao Android parou antes de criar a APK." }

  $ApkFolder = Join-Path $ProjectRoot "android\app\build\outputs\apk\debug"
  $ApkFile = Join-Path $ApkFolder "app-debug.apk"
  if (-not (Test-Path $ApkFile)) { throw "A compilacao terminou, mas o arquivo app-debug.apk nao foi localizado." }

  Write-Host "" 
  Write-Host "APK criada com sucesso:" -ForegroundColor Green
  Write-Host $ApkFile -ForegroundColor Green
  Start-Process explorer.exe $ApkFolder
}
catch {
  Write-Host "" 
  Write-Host "A APK nao foi criada." -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host "Tire uma foto desta janela e envie aqui para eu identificar o passo que parou." -ForegroundColor Yellow
}
