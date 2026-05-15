@echo off
REM sunagent15 - Windows installer entry point (cmd / PowerShell / Git Bash 共通)
REM
REM 使い方:
REM   cmd:        install.cmd
REM   PowerShell: .\install.cmd
REM   Git Bash:   ./install.cmd
REM
REM 引数は PowerShell の scripts\install.ps1 にそのまま渡されます。
REM 対応引数: -Profile <minimal|standard|full> / -Update / -Fresh / -Force / -ListProfiles
REM
REM ref: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_powershell_exe

setlocal
set "SCRIPT_DIR=%~dp0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%scripts\install.ps1" %*
exit /b %ERRORLEVEL%
