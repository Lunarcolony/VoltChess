@echo off

setlocal EnableExtensions

cd /d "%~dp0"



echo.

echo VoltChess - deploy everything

echo =============================

echo.

echo One pipeline: Pi backend -^> tunnel URL -^> build -^> voltchess.me -^> Vercel

echo.



where python >nul 2>&1

if errorlevel 1 (

  echo ERROR: Python not found. Install Python 3.

  pause

  exit /b 1

)



python -c "import paramiko" >nul 2>&1

if errorlevel 1 (

  echo Installing paramiko...

  python -m pip install paramiko

  if errorlevel 1 (

    echo ERROR: pip install paramiko failed.

    pause

    exit /b 1

  )

)



where npm >nul 2>&1

if errorlevel 1 (

  echo ERROR: npm not found. Install Node.js from https://nodejs.org/

  pause

  exit /b 1

)



set ARGS=

set PASSWORD=



:parse

if "%~1"=="" goto run

if /i "%~1"=="backend" (

  set ARGS=%ARGS% --backend-only

  shift

  goto parse

)

if /i "%~1"=="sync" (

  set ARGS=%ARGS% --frontend-only

  shift

  goto parse

)

if /i "%~1"=="no-push" (

  set ARGS=%ARGS% --no-push

  shift

  goto parse

)

if not defined PASSWORD (

  set PASSWORD=%~1

  shift

  goto parse

)

shift

goto parse



:run

echo Default: full deploy + git push to Vercel

echo Options:

echo   deploy.bat backend   - Pi backend only

echo   deploy.bat sync      - frontend only (no Pi upload)

echo   deploy.bat no-push   - full deploy without git push

echo.



if defined PASSWORD (

  python "%~dp0scripts\deploy_all.py" %PASSWORD% %ARGS%

) else (

  python "%~dp0scripts\deploy_all.py" %ARGS%

)



set EXIT_CODE=%ERRORLEVEL%

if %EXIT_CODE% NEQ 0 (

  echo.

  echo Deploy failed (exit %EXIT_CODE%).

  pause

  exit /b %EXIT_CODE%

)



echo.

pause

exit /b 0

