@echo off
echo ============================================
echo   AI Performance Dashboard - Setup Windows
echo ============================================
echo.

REM Verifica se Python está instalado
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Python nao encontrado. Instale em https://python.org
    pause
    exit /b 1
)

REM Cria ambiente virtual se nao existir
IF NOT EXIST ".venv" (
    echo [1/4] Criando ambiente virtual...
    python -m venv .venv
) ELSE (
    echo [1/4] Ambiente virtual ja existe. OK
)

REM Ativa o ambiente virtual
echo [2/4] Ativando ambiente virtual...
call .venv\Scripts\activate.bat

REM Copia .env.example para .env se nao existir
IF NOT EXIST ".env" (
    echo [3/4] Criando arquivo .env...
    copy .env.example .env
) ELSE (
    echo [3/4] Arquivo .env ja existe. OK
)

REM Instala dependencias
echo [4/4] Instalando dependencias...
pip install -r requirements.txt --quiet

echo.
echo ============================================
echo   Tudo pronto! Abrindo o dashboard...
echo   Acesse: http://localhost:8501
echo   Para parar: pressione Ctrl+C
echo ============================================
echo.

REM Roda o Streamlit
streamlit run app.py

pause
