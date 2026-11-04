param(
    [ValidateRange(1, 65535)][int]$Port = 8000,
    [switch]$NoBrowser,
    [switch]$PrepareOnly,
    [switch]$Portable
)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$runtimeDirectory = Join-Path $PSScriptRoot '.runtime'
$portablePython = Join-Path $runtimeDirectory 'python\python.exe'

function Test-Python($Candidate) {
    try {
        & $Candidate.Path @($Candidate.Arguments) -c 'import sys; raise SystemExit(sys.version_info < (3, 10))' 2>$null | Out-Null
        return $LASTEXITCODE -eq 0
    } catch { return $false }
}

try {
    $candidates = @()
    if (-not $Portable) {
        foreach ($command in Get-Command python, python3, py -CommandType Application -ErrorAction SilentlyContinue) {
            if ($command.Source -notmatch '[\\/]WindowsApps[\\/]') {
                $arguments = @()
                if ($command.Name -match '^py(\.exe)?$') { $arguments = @('-3') }
                $candidates += @{ Path = $command.Source; Arguments = $arguments }
            }
        }
        $bundledPython = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
        $candidates += @{ Path = $bundledPython; Arguments = @() }
    }
    $candidates += @{ Path = $portablePython; Arguments = @() }
    $python = $null
    foreach ($candidate in $candidates) {
        if ((Test-Path -LiteralPath $candidate.Path -PathType Leaf) -and (Test-Python $candidate)) {
            $python = $candidate
            break
        }
    }

    if (-not $python) {
        $version = '3.13.17'
        $architecture = $env:PROCESSOR_ARCHITECTURE
        if ($env:PROCESSOR_ARCHITEW6432) { $architecture = $env:PROCESSOR_ARCHITEW6432 }
        switch ($architecture.ToUpperInvariant()) {
            'AMD64' { $platform = 'amd64'; $sha256 = '9e35319bffedab8b36ad44d8f377cb4f1733bcec257a0b6d04d94f01486ddb38' }
            'ARM64' { $platform = 'arm64'; $sha256 = '7b58787a047b400edbfcb539aa3cdb4e2ed77bf0f22cae42b7c01cedd7dd6614' }
            'X86' { $platform = 'win32'; $sha256 = '4afd37bc88ed1391209a4c58deb902cd0741a476692412b23d340aff6e9285e7' }
            default { throw "Unsupported Windows architecture: $architecture" }
        }
        $archive = Join-Path $runtimeDirectory 'python.zip'
        $destination = Join-Path $runtimeDirectory 'python'
        $downloadUrl = "https://www.python.org/ftp/python/$version/python-$version-embed-$platform.zip"
        New-Item -ItemType Directory -Path $runtimeDirectory -Force | Out-Null
        Write-Host 'Preparing portable Python inside this project (first launch only)...'
        [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
        if (-not (Test-Path -LiteralPath $archive -PathType Leaf) -or (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne $sha256) {
            try { Invoke-WebRequest -Uri $downloadUrl -OutFile $archive -UseBasicParsing -TimeoutSec 180 }
            catch { throw "Download failed. Check your internet and run start.bat again. For offline setup, download $downloadUrl and extract it into $destination" }
        }
        if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne $sha256) {
            throw 'Python package checksum mismatch. Remove .runtime\python.zip and run start.bat again.'
        }
        Expand-Archive -LiteralPath $archive -DestinationPath $destination -Force
        $python = @{ Path = $portablePython; Arguments = @() }
        if (-not (Test-Python $python)) { throw 'Portable Python could not start. Check .runtime\python or install Python 3.10+.' }
    }

    Write-Host "Python ready: $($python.Path)"
    if ($PrepareOnly) { exit 0 }
    $serverArguments = @((Join-Path $PSScriptRoot 'server.py'), '--port', "$Port")
    if (-not $NoBrowser) { $serverArguments += '--open' }
    Write-Host "Opening http://127.0.0.1:$Port - keep this window open. Press Ctrl+C to stop."
    & $python.Path @($python.Arguments) @serverArguments
    exit $LASTEXITCODE
} catch {
    Write-Host "Start failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
