# TCOC Application - Desktop Shortcut Creator
# This PowerShell script automatically creates a desktop shortcut with an icon

Write-Host "Creating TCOC Application Desktop Shortcut..." -ForegroundColor Cyan
Write-Host ""

# Get the current script directory (project root)
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$vbsLauncher = Join-Path $projectPath "start-tcoc-app.vbs"
$appLogo = Join-Path $projectPath "public\assets\images\app_logo.png"

# Get the user's desktop path
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "TCOC Application.lnk"

# Create the shortcut
$WScriptShell = New-Object -ComObject WScript.Shell
$shortcut = $WScriptShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $vbsLauncher
$shortcut.WorkingDirectory = $projectPath
$shortcut.Description = "Launch TCOC Care Management Application"
$shortcut.WindowStyle = 1

# Try to set the icon to the app logo
if (Test-Path $appLogo)
{
    $shortcut.IconLocation = $appLogo
    Write-Host "Using app logo as icon" -ForegroundColor Green
}
else
{
    $shortcut.IconLocation = "%SystemRoot%\System32\imageres.dll,1"
    Write-Host "App logo not found, using default icon" -ForegroundColor Yellow
}

# Save the shortcut
$shortcut.Save()

Write-Host ""
Write-Host "Desktop shortcut created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Location: $shortcutPath" -ForegroundColor Gray
Write-Host ""
Write-Host "To customize the icon:" -ForegroundColor Cyan
Write-Host "  1. Right-click the desktop shortcut" -ForegroundColor White
Write-Host "  2. Select Properties" -ForegroundColor White
Write-Host "  3. Click Change Icon..." -ForegroundColor White
Write-Host "  4. Browse to select a different icon" -ForegroundColor White
Write-Host ""
Write-Host "Double-click the shortcut to launch the application!" -ForegroundColor Green
Write-Host ""

# Clean up COM object
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($WScriptShell) | Out-Null

# Made with Bob
