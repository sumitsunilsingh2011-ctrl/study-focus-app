# server.ps1 - Lightweight Local Web Server for Mobile & Laptop
$Port = 8080
$Root = $PSScriptRoot

# Get local LAN IP address
$LocalIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notmatch '^169\.' } | Select-Object -First 1).IPAddress
if (-not $LocalIP) { $LocalIP = "127.0.0.1" }

$Listener = New-Object System.Net.HttpListener
$Listener.Prefixes.Add("http://localhost:$Port/")
$Listener.Prefixes.Add("http://127.0.0.1:$Port/")
try {
    $Listener.Prefixes.Add("http://${LocalIP}:$Port/")
} catch {}

$Listener.Start()

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  📱 FOCUS SIM APP SERVER RUNNING" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  💻 On Laptop: Open http://localhost:$Port" -ForegroundColor Cyan
Write-Host "  📱 On Mobile Phone: Open http://${LocalIP}:$Port" -ForegroundColor Cyan
Write-Host "  (Ensure Phone and Laptop are connected to the same Wi-Fi)" -ForegroundColor DarkGray
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server.`n" -ForegroundColor DarkGray

# Open in browser automatically
Start-Process "http://localhost:$Port"

while ($Listener.IsListening) {
    try {
        $Context = $Listener.GetContext()
        $Request = $Context.Request
        $Response = $Context.Response

        $UrlPath = $Request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($UrlPath)) { $UrlPath = "index.html" }

        $FilePath = Join-Path $Root $UrlPath

        if (Test-Path $FilePath -PathType Leaf) {
            $Bytes = [System.IO.File]::ReadAllBytes($FilePath)
            
            # Content Types
            if ($FilePath.EndsWith(".html")) { $Response.ContentType = "text/html; charset=utf-8" }
            elseif ($FilePath.EndsWith(".css")) { $Response.ContentType = "text/css" }
            elseif ($FilePath.EndsWith(".js")) { $Response.ContentType = "application/javascript" }
            elseif ($FilePath.EndsWith(".json") -or $FilePath.EndsWith(".webmanifest")) { $Response.ContentType = "application/manifest+json" }
            elseif ($FilePath.EndsWith(".png")) { $Response.ContentType = "image/png" }
            else { $Response.ContentType = "application/octet-stream" }

            $Response.ContentLength64 = $Bytes.Length
            $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
        } else {
            $Response.StatusCode = 404
            $ErrBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $Response.OutputStream.Write($ErrBytes, 0, $ErrBytes.Length)
        }
        $Response.Close()
    } catch {
        # Handle client disconnect gracefully
    }
}
