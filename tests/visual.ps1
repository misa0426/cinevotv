param([string]$BrowserPath = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe', [ValidateSet('inicio','peliculas','suscripciones')][string]$Section = 'inicio')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$outputRoot = Join-Path $PSScriptRoot '.generated'
New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null
$html = Get-Content -Raw -Encoding utf8 -LiteralPath (Join-Path $projectRoot 'index.html')
# La regresión histórica conserva su idioma base; la suite i18n verifica ambos idiomas.
$html = $html.Replace('<script type="module" src="./i18n.mjs"></script>', '')
$pricing = (Get-Content -Raw -Encoding utf8 -LiteralPath (Join-Path $projectRoot 'dev/policies.mjs')).Replace('export ', '')
$html = $html.Replace('<script type="module" src="./policies.mjs"></script>', '<script type="module">' + $pricing + '</script>')
$css = Get-Content -Raw -Encoding utf8 -LiteralPath (Join-Path $projectRoot 'styles.css')
$html = $html.Replace('<link rel="stylesheet" href="./styles.css">', '<style>' + $css + '</style>')
$app = Get-Content -Raw -Encoding utf8 -LiteralPath (Join-Path $projectRoot 'app.js')
$app = $app.Replace("await import('./firebase.js')", 'await Promise.resolve({ createBackend: window.createVisualBackend })')
$simulator = Get-Content -Raw -Encoding utf8 -LiteralPath (Join-Path $projectRoot 'dev/firebase-simulado.js')
$simulator = $simulator.Replace('export function createBackend', 'function createBackend')
$check = @'
const summary = document.createElement('pre'); summary.id = 'layout-results';
const overflow = document.documentElement.scrollWidth > innerWidth;
const connected = !!backend && !document.getElementById('conexionEstado').textContent;
const cardsOk = [...document.querySelectorAll('.card')].every(card => card.getBoundingClientRect().width > 100);
summary.textContent = !overflow && cardsOk && connected ? 'PASS: layout ' + innerWidth + 'px sin desbordamiento y tarjetas visibles' : 'FAIL: layout ' + innerWidth + 'px; desbordamiento=' + overflow + '; tarjetas=' + cardsOk;
summary.style.cssText = 'position:fixed;bottom:0;right:0;background:#101114;color:#e0bb78;font-size:9px;padding:3px;z-index:200;max-width:100%;white-space:pre-wrap';
document.body.append(summary);
'@
$scripts = '<script type="module">' + $simulator + [Environment]::NewLine + 'window.createVisualBackend = createBackend;' + [Environment]::NewLine + $app + [Environment]::NewLine + $check + '</script>'
$html = $html.Replace('<script type="module" src="./app.js"></script>', $scripts)
$file = Join-Path $outputRoot 'visual.html'
Set-Content -LiteralPath $file -Value $html -Encoding utf8
$encoded = [System.Net.WebUtility]::HtmlEncode($html)
$failed = $false
foreach ($width in @(1440, 768, 390, 360)) {
 $wrapper = '<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#101114}iframe{display:block;border:0}</style><iframe id="viewport" style="width:' + $width + 'px;height:1000px" srcdoc="' + $encoded + '"></iframe><script>document.getElementById("viewport").addEventListener("load",function(){const result=this.contentDocument.getElementById("layout-results");const target=this.contentDocument.getElementById("' + $Section + '");if(target)this.contentWindow.scrollTo({top:Math.max(0,target.offsetTop-85),behavior:"instant"});const pre=document.createElement("pre");pre.id="layout-results";pre.textContent=result?result.textContent:"FAIL: iframe sin resultados";document.body.append(pre);});</script>'
 $frameFile = Join-Path $outputRoot ('viewport-' + $width + '.html')
 Set-Content -LiteralPath $frameFile -Value $wrapper -Encoding utf8
 $uri = ([System.Uri]$frameFile).AbsoluteUri
 $windowWidth = [Math]::Max(550, $width + 40)
 $profile = Join-Path $outputRoot ('edge-visual-' + $width)
 $stdout = Join-Path $outputRoot ('visual-' + $width + '.txt')
 $stderr = Join-Path $outputRoot ('visual-' + $width + '-stderr.txt')
 $screenshot = Join-Path $outputRoot ('preview-' + $Section + '-' + $width + '.png')
 $browserArgs = @('--headless', '--disable-gpu', '--no-first-run', '--hide-scrollbars', '--force-device-scale-factor=1', '--disable-background-networking', '"--host-resolver-rules=MAP * ~NOTFOUND"', ('"--user-data-dir=' + $profile + '"'), ('--window-size=' + $windowWidth + ',1040'), ('"--screenshot=' + $screenshot + '"'), '--virtual-time-budget=3000', '--dump-dom', $uri)
 Start-Process -FilePath $BrowserPath -ArgumentList $browserArgs -WindowStyle Hidden -Wait -RedirectStandardOutput $stdout -RedirectStandardError $stderr
 $dump = [string](Get-Content -Raw -Encoding utf8 -LiteralPath $stdout)
 $match = [regex]::Match($dump, '<pre id="layout-results"[^>]*>([\s\S]*?)</pre>')
 if (-not $match.Success) { Write-Output "FAIL: no hay resultados de layout $width"; $failed = $true }
 else { $summary = [System.Net.WebUtility]::HtmlDecode($match.Groups[1].Value); Write-Output $summary; if ($summary.StartsWith('FAIL')) { $failed = $true } }
}
if ($failed) { exit 1 }
