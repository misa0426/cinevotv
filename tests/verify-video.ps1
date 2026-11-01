param([string]$BrowserPath = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe')
$ErrorActionPreference = 'Stop'
$outputRoot = Join-Path $PSScriptRoot '.generated'
New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null
$video = Join-Path $outputRoot 'flower.mp4'
Invoke-WebRequest -Uri 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' -OutFile $video -TimeoutSec 30
if ((Get-Item -LiteralPath $video).Length -lt 1000) { throw 'El MP4 descargado esta vacio o incompleto.' }
$html = @'
<!doctype html><html lang="es"><meta charset="utf-8"><title>Prueba del MP4 existente</title>
<video id="video" muted playsinline src="flower.mp4"></video><pre id="resultado">EN CURSO</pre>
<script>
const video = document.getElementById('video');
const result = document.getElementById('resultado');
video.addEventListener('error', () => { result.textContent = 'FAIL: error de decodificacion ' + video.error?.code; });
video.addEventListener('timeupdate', () => {
 if (video.currentTime > 0 && video.videoWidth > 0) result.textContent = 'PASS: MP4 descargado y reproducido; tiempo=' + video.currentTime + '; resolucion=' + video.videoWidth + 'x' + video.videoHeight;
});
video.play().catch(error => { result.textContent = 'FAIL: ' + error.message; });
</script></html>
'@
$file = Join-Path $outputRoot 'media-real.html'
Set-Content -LiteralPath $file -Value $html -Encoding utf8
$stdout = Join-Path $outputRoot 'media-stdout.txt'
$stderr = Join-Path $outputRoot 'media-stderr.txt'
$profile = Join-Path $outputRoot 'edge-media'
$uri = ([System.Uri]$file).AbsoluteUri
$browserArgs = @('--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--autoplay-policy=no-user-gesture-required', ('"--user-data-dir=' + $profile + '"'), '--virtual-time-budget=15000', '--dump-dom', $uri)
Start-Process -FilePath $BrowserPath -ArgumentList $browserArgs -WindowStyle Hidden -Wait -RedirectStandardOutput $stdout -RedirectStandardError $stderr
$dump = [string](Get-Content -Raw -Encoding utf8 -LiteralPath $stdout)
$match = [regex]::Match($dump, '<pre id="resultado">([\s\S]*?)</pre>')
if (-not $match.Success) { throw 'Edge no produjo resultados de video.' }
Write-Output $match.Groups[1].Value
if (-not $match.Groups[1].Value.StartsWith('PASS:')) { exit 1 }
