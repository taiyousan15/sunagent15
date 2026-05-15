@echo off
REM sunagent15 - Windows 1-command update (cmd / PowerShell / Git Bash 共通)
REM
REM 使い方:
REM   cmd:        update.cmd
REM   PowerShell: .\update.cmd
REM   Git Bash:   ./update.cmd
REM
REM scripts\install.ps1 -Update を委譲で呼び出し、git pull → 失敗時 reset → 失敗時 ZIP の順で更新します。
REM ローカルに未コミットの変更がある場合は中断します。-Force で強制上書き可能。
REM
REM ref: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_powershell_exe

setlocal
set "SCRIPT_DIR=%~dp0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%scripts\install.ps1" -Update %*
exit /b %ERRORLEVEL%
