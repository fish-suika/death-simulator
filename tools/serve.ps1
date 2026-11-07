# 開発用の簡易サーバー（動画の Range 要求に対応）。使い方: powershell -File tools/serve.ps1 -Port 8765
param([int]$Port = 8765)
$root = Split-Path -Parent $PSScriptRoot
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
$types = @{ '.html'='text/html; charset=utf-8'; '.js'='text/javascript'; '.mp4'='video/mp4'; '.png'='image/png'; '.css'='text/css'; '.md'='text/plain; charset=utf-8' }
while ($l.IsListening) {
  $c = $l.GetContext()
  try {
    $p = [Uri]::UnescapeDataString($c.Request.Url.AbsolutePath.TrimStart('/'))
    if ($p -eq '') { $p = 'death-simulator.html' }
    $f = Join-Path $root $p
    if (-not (Test-Path $f -PathType Leaf) -or -not ((Resolve-Path $f).Path.StartsWith($root))) { $c.Response.StatusCode = 404; $c.Response.Close(); continue }
    $bytes = [IO.File]::ReadAllBytes($f)
    $ext = [IO.Path]::GetExtension($f).ToLower()
    $c.Response.ContentType = $(if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' })
    $c.Response.AddHeader('Accept-Ranges', 'bytes')
    $r = $c.Request.Headers['Range']
    if ($r -and $r -match 'bytes=(\d*)-(\d*)') {
      $s = if ($Matches[1]) { [int]$Matches[1] } else { 0 }
      $e = if ($Matches[2]) { [int]$Matches[2] } else { $bytes.Length - 1 }
      if ($e -ge $bytes.Length) { $e = $bytes.Length - 1 }
      $c.Response.StatusCode = 206
      $c.Response.AddHeader('Content-Range', "bytes $s-$e/$($bytes.Length)")
      $c.Response.ContentLength64 = $e - $s + 1
      $c.Response.OutputStream.Write($bytes, $s, $e - $s + 1)
    } else {
      $c.Response.ContentLength64 = $bytes.Length
      $c.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    }
    $c.Response.Close()
  } catch { try { $c.Response.Abort() } catch {} }
}
