# Install Helm on Windows
# This script downloads and installs Helm 3.x

param(
    [string]$InstallPath = "$env:ProgramFiles\Helm"
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Failed {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║   Helm Installation Script for Windows ║" -ForegroundColor Blue
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Failed "This script must be run as Administrator!"
    Write-Host ""
    Write-Host "Please:"
    Write-Host "  1. Right-click PowerShell"
    Write-Host "  2. Select 'Run as Administrator'"
    Write-Host "  3. Run this script again"
    exit 1
}

Write-Success "Running as Administrator"

# Get latest Helm version
Write-Step "Fetching latest Helm version..."
try {
    $latestRelease = Invoke-RestMethod -Uri "https://api.github.com/repos/helm/helm/releases/latest"
    $version = $latestRelease.tag_name
    Write-Success "Latest version: $version"
} catch {
    Write-Failed "Failed to fetch latest version"
    $version = "v3.13.1"
    Write-Host "Using fallback version: $version" -ForegroundColor Yellow
}

# Construct download URL
$downloadUrl = "https://get.helm.sh/helm-$version-windows-amd64.zip"
$tempZip = "$env:TEMP\helm.zip"
$tempExtract = "$env:TEMP\helm-extract"

Write-Step "Downloading Helm $version..."
try {
    # Enable TLS 1.2
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    
    Invoke-WebRequest -Uri $downloadUrl -OutFile $tempZip -UseBasicParsing
    Write-Success "Downloaded to $tempZip"
} catch {
    Write-Failed "Failed to download Helm: $_"
    exit 1
}

# Extract archive
Write-Step "Extracting archive..."
try {
    if (Test-Path $tempExtract) {
        Remove-Item -Path $tempExtract -Recurse -Force
    }
    Expand-Archive -Path $tempZip -DestinationPath $tempExtract -Force
    Write-Success "Extracted successfully"
} catch {
    Write-Failed "Failed to extract archive: $_"
    exit 1
}

# Create install directory
Write-Step "Creating installation directory..."
if (-not (Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
    Write-Success "Created $InstallPath"
} else {
    Write-Success "Directory already exists: $InstallPath"
}

# Copy helm.exe
Write-Step "Installing Helm..."
try {
    $helmExe = Get-ChildItem -Path $tempExtract -Filter "helm.exe" -Recurse | Select-Object -First 1
    Copy-Item -Path $helmExe.FullName -Destination "$InstallPath\helm.exe" -Force
    Write-Success "Copied helm.exe to $InstallPath"
} catch {
    Write-Failed "Failed to install Helm: $_"
    exit 1
}

# Add to PATH
Write-Step "Adding Helm to PATH..."
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if ($currentPath -notlike "*$InstallPath*") {
    $newPath = "$currentPath;$InstallPath"
    [Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")
    Write-Success "Added $InstallPath to system PATH"
} else {
    Write-Success "Helm directory already in PATH"
}

# Update current session PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

# Clean up
Write-Step "Cleaning up..."
Remove-Item -Path $tempZip -Force -ErrorAction SilentlyContinue
Remove-Item -Path $tempExtract -Recurse -Force -ErrorAction SilentlyContinue
Write-Success "Temporary files removed"

# Verify installation
Write-Step "Verifying installation..."
try {
    $helmVersion = & "$InstallPath\helm.exe" version --short 2>$null
    Write-Success "Helm installed successfully!"
    Write-Host ""
    Write-Host "Helm Version: $helmVersion" -ForegroundColor Green
} catch {
    Write-Failed "Installation verification failed"
    Write-Host "Helm.exe is located at: $InstallPath\helm.exe"
}

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   Installation Complete!               ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Important Notes:" -ForegroundColor Yellow
Write-Host "  • Close and reopen PowerShell/Terminal windows for PATH changes to take effect"
Write-Host "  • Or run: " -NoNewline
Write-Host '$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine")' -ForegroundColor Cyan
Write-Host ""
Write-Host "To verify Helm is working:"
Write-Host "  helm version" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next step: Run the monitoring deployment script"
Write-Host "  cd monitoring"
Write-Host "  .\deploy-monitoring.ps1" -ForegroundColor Cyan
