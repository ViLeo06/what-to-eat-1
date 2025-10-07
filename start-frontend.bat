@echo off
setlocal ENABLEEXTENSIONS

cd /d "%~dp0"

echo 正在启动前端开发服务器……
start "开发服务器" cmd /k "npm run dev"

echo 等待服务器就绪（最多 60 秒）……
set "RETRY_COUNT=0"

:CHECK_SERVER
timeout /t 1 >nul
curl -s -o nul -w "%%{http_code}" http://localhost:5173 | findstr "200" >nul 2>&1
if errorlevel 1 (
    set /a RETRY_COUNT+=1
    if %RETRY_COUNT% GEQ 60 (
        echo 未能在预期时间内确认服务启动，请手动检查。
        goto END
    )
    goto CHECK_SERVER
)

echo 服务已就绪，正在打开浏览器……
start "" "http://localhost:5173/"

:END
endlocal
echo.
echo 按任意键关闭此窗口……
pause >nul

