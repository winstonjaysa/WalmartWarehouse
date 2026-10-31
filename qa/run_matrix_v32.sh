#!/bin/bash
cd /workspace/gateflow; U=https://raw.githack.com/winstonjaysa/WalmartWarehouse/e9d306e0898c596c1b7a9e00fa46fb818c31bf3e/index.html
export NODE_PATH=qa/tools/node_modules
for i in 1 2; do
  node qa/smoke.js $U --out qa/smoke_out/v32_run$i; echo "EXIT std run$i: $?"
  node qa/smoke.js $U --q high --spoof-gpu --only desktop --out qa/smoke_out/v32_mac_run$i; echo "EXIT mac run$i: $?"
done
