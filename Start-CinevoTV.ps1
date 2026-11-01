param(
  [ValidateRange(1024, 65535)][int]$Port = 8080,
  [string]$FirebaseConfigPath,
  [string]$AdminEmail = 'admin@cinevo.test'
)
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
if (-not $FirebaseConfigPath) {
  $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
  $nodePath = if ($nodeCommand) { $nodeCommand.Source } else { Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' }
  if (-not (Test-Path -LiteralPath $nodePath)) { throw 'No se encontro Node.js. Esta version usa solo modulos incluidos en Node, sin instalar paquetes. Indica una instalacion de Node existente antes de continuar.' }
  & $nodePath (Join-Path $projectRoot 'dev/server.mjs') --port $Port --admin-email $AdminEmail
  exit $LASTEXITCODE
}
$utf8 = [System.Text.UTF8Encoding]::new($false)
$adapter = [System.IO.File]::ReadAllText((Join-Path $projectRoot 'dev/firebase-simulado.js'), $utf8)
$mode = 'PRUEBA LOCAL AISLADA: Firebase simulado. Usa correos ficticios y contrasenas de prueba. Las cuentas y listas se reinician al recargar la pagina; no se comparten entre pestanas.'
if ($FirebaseConfigPath) {
  $config = Get-Content -Raw -Encoding utf8 -LiteralPath $FirebaseConfigPath | ConvertFrom-Json
  foreach ($key in @('apiKey', 'authDomain', 'projectId', 'appId')) {
    if (-not ($config.$key -is [string]) -or [string]::IsNullOrWhiteSpace($config.$key)) { throw "Falta el campo $key en la configuracion del proyecto de pruebas." }
  }
  $serialized = ConvertTo-Json -Depth 5 -Compress -InputObject $config
  if ($serialized -match '(?i)cinevotv-a3378|495427023735') { throw 'Se rechazo la configuracion de produccion. Usa exclusivamente un proyecto Firebase de pruebas separado.' }
  $adapter = [System.IO.File]::ReadAllText((Join-Path $projectRoot 'firebase.js'), $utf8)
  $match = [regex]::Match($adapter, 'const firebaseConfig = [\s\S]*?;')
  if (-not $match.Success) { throw 'No se encontro la configuracion Firebase. No se iniciara el servidor.' }
  $adapter = $adapter.Substring(0, $match.Index) + 'const firebaseConfig = ' + $serialized + ';' + $adapter.Substring($match.Index + $match.Length)
  $mode = 'FIREBASE DE PRUEBAS REAL: ' + $config.projectId + '. Registrar o guardar favoritos escribira datos ficticios en este proyecto de pruebas.'
}
$banner = '<aside role="note" style="padding:12px;background:#483600;color:white;border-bottom:2px solid #efb900">' + [System.Net.WebUtility]::HtmlEncode($mode) + '</aside>'
$html = [System.IO.File]::ReadAllText((Join-Path $projectRoot 'index.html'), $utf8).Replace('<body>', '<body>' + $banner)
$app = [System.IO.File]::ReadAllText((Join-Path $projectRoot 'app.js'), $utf8)
$routes = @{
  '/' = @{ Type = 'text/html; charset=utf-8'; Body = $html }
  '/index.html' = @{ Type = 'text/html; charset=utf-8'; Body = $html }
  '/policies.mjs' = @{ Type='text/javascript; charset=utf-8'; Body=[System.IO.File]::ReadAllText((Join-Path $projectRoot 'dev/policies.mjs'), $utf8) }
  '/brand-mark.svg' = @{ Type='image/svg+xml'; Body=[System.IO.File]::ReadAllText((Join-Path $projectRoot 'brand-mark.svg'), $utf8) }
  '/i18n.mjs' = @{ Type = 'text/javascript; charset=utf-8'; Body = [System.IO.File]::ReadAllText((Join-Path $projectRoot 'i18n.mjs'), $utf8) }
  '/app.js' = @{ Type = 'text/javascript; charset=utf-8'; Body = $app }
  '/styles.css' = @{ Type = 'text/css; charset=utf-8'; Body = [System.IO.File]::ReadAllText((Join-Path $projectRoot 'styles.css'), $utf8) }
  '/firebase.js' = @{ Type = 'text/javascript; charset=utf-8'; Body = $adapter }
}
# Solo loopback y una lista cerrada de rutas. Nunca se sirven .git, configuraciones ni otros archivos.
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
try {
  $listener.Start()
  Write-Host "CinevoTV: http://localhost:$Port/"
  Write-Host $mode
  Write-Host 'Deja esta terminal abierta. Pulsa Ctrl+C para detener el servidor.'
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $client.ReceiveTimeout = 5000
      $client.SendTimeout = 5000
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
      $request = $reader.ReadLine()
      if (-not $request) { continue }
      $parts = $request.Split(' ')
      $headerSize = 0
      while ($true) {
        $line = $reader.ReadLine()
        if ([string]::IsNullOrEmpty($line)) { break }
        $headerSize += $line.Length
        if ($headerSize -gt 16384) { throw 'Cabecera demasiado grande' }
      }
      $path = ($parts[1] -split '[?]')[0]
      $status = '200 OK'
      $type = 'text/plain; charset=utf-8'
      $body = 'No encontrado'
      if ($parts[0] -notin @('GET', 'HEAD')) { $status = '405 Method Not Allowed'; $body = 'Metodo no permitido' }
      elseif ($routes.ContainsKey($path)) { $type = $routes[$path].Type; $body = $routes[$path].Body }
      else { $status = '404 Not Found' }
      $bytes = $utf8.GetBytes($body)
      $headers = "HTTP/1.1 $status
Content-Type: $type
Content-Length: $($bytes.Length)
Cache-Control: no-store
X-Content-Type-Options: nosniff
Connection: close

"
      $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
      $stream.Write($headerBytes, 0, $headerBytes.Length)
      if ($parts[0] -ne 'HEAD') { $stream.Write($bytes, 0, $bytes.Length) }
    } catch { Write-Warning ('Solicitud local interrumpida: ' + $_.Exception.Message) }
    finally { $client.Dispose() }
  }
} finally { $listener.Stop() }
