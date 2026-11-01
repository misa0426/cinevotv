param([string]$NodePath)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
if (-not $NodePath) {
  $nodeCommand=Get-Command node -ErrorAction SilentlyContinue
  $NodePath=if($nodeCommand){$nodeCommand.Source}else{Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'}
}
if (-not (Test-Path -LiteralPath $NodePath)) {throw 'No se encontro Node.js.'}
& (Join-Path $PSScriptRoot 'run.ps1')
if (-not $?) {throw 'Fallo la regresion funcional.'}
& (Join-Path $PSScriptRoot 'visual.ps1')
if (-not $?) {throw 'Fallo la regresion visual.'}
& $NodePath --test (Join-Path $PSScriptRoot 'stage3.test.mjs')
if ($LASTEXITCODE -ne 0) {throw 'Fallaron las pruebas de API y modelo.'}
& $NodePath (Join-Path $PSScriptRoot 'browser-stage3.mjs')
if ($LASTEXITCODE -ne 0) {throw 'Fallaron las pruebas integradas de navegador.'}
Write-Output '80 comprobaciones aprobadas: 43 previas, 18 de modelo/API y 19 integradas de navegador.'
