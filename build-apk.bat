@echo off
echo ===================================================
echo  APEX-CS: Exporting Standalone Release APK
echo ===================================================
echo Bundling latest screens, QR camera scanner, and UI...
echo.
cd android
call gradlew.bat assembleRelease --stacktrace
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================================
    echo  [SUCCESS] Standalone APK exported successfully!
    echo  File: app-release.apk
    echo  Ready to install on any Android phone!
    echo ===================================================
    echo Opening output folder...
    explorer app\build\outputs\apk\release
) else (
    echo.
    echo [ERROR] Build failed. Check the error log above.
)
cd ..
if "%~1"=="" pause
