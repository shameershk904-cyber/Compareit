# Lightweight PowerShell HTTP Server for PakMobiles
param([int]$Port = 5500)

$basePath = $PSScriptRoot
if (-not $basePath) {
    $basePath = "C:\Users\Shahmeer\.gemini\antigravity\scratch\gsmarena-pakistan-clone"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")

try {
    $listener.Start()
    Write-Host "=========================================================="
    Write-Host " PakMobiles Server is LIVE at: http://localhost:$Port/"
    Write-Host " Press Ctrl+C in terminal to stop the server."
    Write-Host "=========================================================="

    while ($listener.IsListening) {
        try {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response

            $localPath = $request.Url.LocalPath.TrimStart('/').Replace('/', '\')
            if ([string]::IsNullOrWhiteSpace($localPath)) {
                $localPath = "index.html"
            }

            $fullPath = Join-Path $basePath $localPath

            if (Test-Path $fullPath -PathType Leaf) {
                $bytes = [System.IO.File]::ReadAllBytes($fullPath)
                $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
                $response.ContentType = switch ($ext) {
                    ".html" { "text/html; charset=utf-8" }
                    ".css"  { "text/css; charset=utf-8" }
                    ".js"   { "application/javascript; charset=utf-8" }
                    ".json" { "application/json; charset=utf-8" }
                    ".png"  { "image/png" }
                    ".jpg"  { "image/jpeg" }
                    ".jpeg" { "image/jpeg" }
                    ".webp" { "image/webp" }
                    ".svg"  { "image/svg+xml" }
                    default { "application/octet-stream" }
                }
                $response.AddHeader("Access-Control-Allow-Origin", "*")
                $response.ContentLength64 = $bytes.Length
                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                }
            } else {
                $response.StatusCode = 404
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $localPath")
                $response.ContentLength64 = $errBytes.Length
                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
                }
            }
            $response.Close()
        } catch {
            Write-Host "Request handled with notice: $_"
        }
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
