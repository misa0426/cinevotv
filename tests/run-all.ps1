param([string]$NodePath)
$ErrorActionPreference='Stop'
if(-not $NodePath){$command=Get-Command node -ErrorAction SilentlyContinue;$NodePath=if($command){$command.Source}else{Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'}}
& (Join-Path $PSScriptRoot 'run-stage3.ps1') -NodePath $NodePath
if(-not $?){throw 'Falló la regresión.'}
& $NodePath --test (Join-Path $PSScriptRoot 'policies.test.mjs')
if($LASTEXITCODE -ne 0){throw 'Fallaron las políticas de planes y dispositivos.'}
& $NodePath (Join-Path $PSScriptRoot 'media-policies.mjs')
if($LASTEXITCODE -ne 0){throw 'Fallaron las pruebas de decodificación real.'}
& $NodePath (Join-Path $PSScriptRoot 'capture-admin.mjs')
if($LASTEXITCODE -ne 0){throw 'Fallaron las comprobaciones visuales del panel.'}
& (Join-Path $PSScriptRoot 'verify-video.ps1')
if(-not $?){throw 'Falló la prueba separada del MP4 original.'}
Write-Output '104 comprobaciones previas aprobadas: 43 iniciales, 18 API previas, 19 navegador, 18 políticas, 3 medios reales, 2 panel adaptable y 1 MP4 original.'

& $NodePath --test (Join-Path $PSScriptRoot 'i18n.test.mjs')
if($LASTEXITCODE -ne 0){throw 'Fallaron las pruebas de idioma y detección.'}
& $NodePath (Join-Path $PSScriptRoot 'i18n-browser.mjs')
if($LASTEXITCODE -ne 0){throw 'Fallaron las pruebas multilingües de navegador.'}
& $NodePath --test (Join-Path $PSScriptRoot 'vixuno.test.mjs')
if($LASTEXITCODE -ne 0){throw 'Fallaron las pruebas de VixunoTV y anualidades.'}
& $NodePath --test (Join-Path $PSScriptRoot 'open-films.test.mjs')
if($LASTEXITCODE -ne 0){throw 'Fallaron las pruebas de películas abiertas.'}
& $NodePath --test (Join-Path $PSScriptRoot 'player-stabilization.test.mjs')
if($LASTEXITCODE -ne 0){throw 'Fallaron las nuevas pruebas de estabilización, TV y SEO.'}
Write-Output '182 comprobaciones base aprobadas: 174 de regresión y 8 de estabilización/TV/SEO. La película completa y las pruebas de interfaz BBB se ejecutan por separado tras autorizar la copia local.'
