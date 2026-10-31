#!/bin/bash
# poll for v4 build every 15s up to 45 min; require size stable for 10s
F=/workspace/gateflow/builds/walmart-store_v4.html
for i in $(seq 1 180); do
  if [ -f "$F" ]; then s1=$(stat -c %s "$F"); sleep 10; s2=$(stat -c %s "$F");
    if [ "$s1" = "$s2" ] && [ "$s1" -gt 0 ]; then echo "READY $(date +%T) size=$s2"; exit 0; fi; echo "growing $s1->$s2"; continue; fi
  echo "$(date +%T) not yet ($i)"; sleep 15
done; echo "TIMEOUT $(date +%T)"; exit 1
