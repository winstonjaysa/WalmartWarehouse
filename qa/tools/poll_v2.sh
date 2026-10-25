#!/bin/bash
# poll for v2 every 20s until 09:15Z; snapshot on arrival
while [ $(date -u +%H%M) -lt 0915 ]; do
  if [ -f builds/walmart-dc_v2.html ] && grep -q " v2 " builds/CANDIDATES.txt; then
    sleep 3; f=builds/walmart-dc_v2.html
    cp -p $f qa/snapshots/walmart-dc_v2.html
    echo "$(date -u +%FT%TZ) v2 $(stat -c %s $f) $(sha1sum $f|cut -d' ' -f1) mtime $(date -u -r $f +%FT%TZ)" > qa/snapshots/v2.meta
    exit 0
  fi
  sleep 20
done
echo timeout > qa/snapshots/v2.meta
