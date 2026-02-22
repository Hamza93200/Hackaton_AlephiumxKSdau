@echo off
echo === 1. Smart Contract Compilation ===
cd aleph-qis
call npm install
call npx @alephium/cli compile

echo === 2. Copying Artifacts ===
xcopy /E /I /Y artifacts ..\alephqis-ui\src\artifacts

echo === 3. Starting UI ===
cd ..\alephqis-ui\src
call npm install
call npm run dev