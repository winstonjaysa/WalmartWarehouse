#!/bin/bash
# waits for wait_v4.sh to report READY, then runs desktop, phone, mac (x2 if run 2 requested)
cd /workspace/gateflow
F=builds/walmart-store_v4.html
for r in ${RUNS:-1}; do
  node qa/smoke.js $F --only desktop --out qa/smoke_out/v4_desktop_run$r > qa/smoke_out/v4_desktop_run$r.log 2>&1
  node qa/smoke.js $F --only phone --out qa/smoke_out/v4_phone_run$r > qa/smoke_out/v4_phone_run$r.log 2>&1
  node qa/smoke.js $F --only desktop --q high --spoof-gpu --out qa/smoke_out/v4_mac_run$r > qa/smoke_out/v4_mac_run$r.log 2>&1
done; echo DONE
