@echo off
setlocal

:: 切换到脚本所在目录，便于 npm 命令找到项目配置
cd /d "%~dp0"

:: 检查 npm 是否可用
where npm >nul 2>&1
if errorlevel 1 (
    echo 未检测到 npm 命令，请先安装 Node.js（包含 npm）后重试。
    goto :END
)

:: 若未安装依赖，则自动执行 npm install（仅在 node_modules 不存在时）
if not exist "node_modules" (
    echo 检测到未安装依赖，正在执行 npm install...
    call npm install
    if errorlevel 1 (
        echo npm install 执行失败，请检查错误信息后重试。
        goto :END
    )
)

:: 启动前端开发服务器，使用独立窗口保持运行
echo 正在启动前端开发服务器，新窗口标题为 what-to-eat-dev。
start "what-to-eat-dev" /D "%~dp0" cmd /k npm run dev

:: 等待服务器启动后打开浏览器，可按需调整等待秒数
echo 等待服务器启动中，准备打开浏览器...
timeout /t 8 /nobreak >nul

echo 尝试打开 http://localhost:5173/
start "" http://localhost:5173/

:END
echo 如需停止开发服务器，请切换到 what-to-eat-dev 窗口按 Ctrl+C，或直接关闭该窗口。
pause
endlocal
