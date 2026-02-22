#!/bin/bash
echo "=== 1. Smart Contract Compilation ==="
cd aleph-qis
npm install
npx @alephium/cli compile

echo "=== 2. Copying Artifacts ==="
mkdir -p ../alephqis-ui/src/artifacts
cp -r artifacts/* ../alephqis-ui/src/artifacts/

echo "=== 3. Starting UI ==="
cd ../alephqis-ui/src
npm install
npm run dev