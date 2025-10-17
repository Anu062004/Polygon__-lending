# Set Node.js in PATH
$env:PATH = "C:\Program Files\nodejs;$env:PATH"

# Navigate to app directory
Set-Location -Path $PSScriptRoot

# Start the development server
Write-Host "Starting development server..." -ForegroundColor Green
npm run dev


