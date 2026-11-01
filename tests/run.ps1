param([string]$BrowserPath = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe')
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
$adapter = Get-Content -Raw -Encoding utf8 -LiteralPath (Join-Path $projectRoot 'firebase.js')
$adapter = [regex]::Replace($adapter, '(?m)^import .*;\r?\n', '')
$adapter = $adapter.Replace('export function createBackend', 'function createBackend')
$setup = Get-Content -Raw -Encoding utf8 -LiteralPath (Join-Path $PSScriptRoot 'setup.js')
$checks = Get-Content -Raw -Encoding utf8 -LiteralPath (Join-Path $PSScriptRoot 'checks.js')
$adapterChecks = Get-Content -Raw -Encoding utf8 -LiteralPath (Join-Path $PSScriptRoot 'adapter-checks.js')
$adapterChecks = $adapterChecks.Replace('ADAPTER_SOURCE', (ConvertTo-Json -Compress -InputObject $adapter))
$failed = $false
foreach ($scenario in @('normal', 'firebase-unavailable', 'local-interactive')) {
  $testApp = $app.Replace("await import('./firebase.js')", 'await Promise.resolve({ createBackend: () => window.fakeBackend })')
  $stage2Checks = Get-Content -Raw -Encoding utf8 -LiteralPath (Join-Path $PSScriptRoot 'stage2-checks.js')
  $testChecks = $checks + [Environment]::NewLine + $adapterChecks + [Environment]::NewLine + $stage2Checks
  $scenarioSetup = $setup
  if ($scenario -eq 'local-interactive') {
    $localAdapter = Get-Content -Raw -Encoding utf8 -LiteralPath (Join-Path $projectRoot 'dev/firebase-simulado.js')
    $localAdapter = $localAdapter.Replace('export function createBackend', 'function createBackend')
    $scenarioSetup += [Environment]::NewLine + $localAdapter + [Environment]::NewLine + 'window.fakeBackend = createBackend();'
    $testChecks = Get-Content -Raw -Encoding utf8 -LiteralPath (Join-Path $PSScriptRoot 'local-checks.js')
  }
  if ($scenario -eq 'firebase-unavailable') {
    $testApp = $app.Replace("await import('./firebase.js')", "await Promise.reject(new Error('offline'))")
    $testChecks = @'
const results = [];
try {
  if (document.querySelectorAll('.card').length !== 10) throw new Error('Catálogo bloqueado');
  if (!document.getElementById('conexionEstado').textContent.includes('Firebase no está disponible')) throw new Error('Fallo silencioso');
  if (![...document.querySelectorAll('.auth-panel [type=submit]')].every(button => button.disabled)) throw new Error('Formularios activos sin Firebase');
  document.querySelector('.search').value = 'Movie 1';
  document.querySelector('.search').dispatchEvent(new Event('input'));
  if ([...document.querySelectorAll('.card')].filter(card => card.style.display !== 'none').length !== 1) throw new Error('Buscador bloqueado');
  results.push('PASS: SDK inaccesible mantiene catálogo y búsqueda, muestra error y bloquea formularios');
} catch (error) { results.push('FAIL: ' + error.message); }
'@
  }
  $report = @'
const report = document.createElement('pre');
report.id = 'test-results';
report.textContent = results.join('\n');
document.body.append(report);
'@
  $scripts = '<script>' + $scenarioSetup + '</script><script type="module">' + $testApp + [Environment]::NewLine + $testChecks + [Environment]::NewLine + $report + '</script>'
  $testHtml = $html.Replace('<script type="module" src="./app.js"></script>', $scripts)
  $testHtml = [regex]::Replace($testHtml, 'url\("https://placehold.co/[^"\r\n]*"\)', 'none')
  $file = Join-Path $outputRoot ($scenario + '.html')
  Set-Content -LiteralPath $file -Value $testHtml -Encoding utf8
  $profile = Join-Path $outputRoot ('edge-' + $scenario)
  $uri = ([System.Uri]$file).AbsoluteUri
  $stdout = Join-Path $outputRoot ($scenario + '-stdout.txt')
  $stderr = Join-Path $outputRoot ($scenario + '-stderr.txt')
  $browserArgs = @('--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '"--host-resolver-rules=MAP * ~NOTFOUND"', ('"--user-data-dir=' + $profile + '"'), '--virtual-time-budget=10000', '--dump-dom', $uri)
  $process = Start-Process -FilePath $BrowserPath -ArgumentList $browserArgs -WindowStyle Hidden -PassThru -Wait -RedirectStandardOutput $stdout -RedirectStandardError $stderr
  $dumpText = [string](Get-Content -Raw -Encoding utf8 -LiteralPath $stdout)
  Set-Content -LiteralPath (Join-Path $outputRoot ($scenario + '-result.html')) -Value $dumpText -Encoding utf8
  $match = [regex]::Match($dumpText, '<pre id="test-results">([\s\S]*?)</pre>')
  if (-not $match.Success) { Write-Output "FAIL: $scenario no produjo resultados. Revisa tests/.generated/$scenario-result.html"; $failed = $true }
  else { $summary = [System.Net.WebUtility]::HtmlDecode($match.Groups[1].Value); Write-Output $summary; if ($summary.Contains('FAIL:')) { $failed = $true } }
}
if ($failed) { exit 1 }
