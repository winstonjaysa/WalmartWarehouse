F=/workspace/gateflow/walmart-dc.html
end=$(( $(date +%s) + 20*60 ))
while [ ! -f $F ] && [ $(date +%s) -lt $end ]; do echo "$(date +%T) waiting2"; sleep 60; done
[ -f $F ] || { echo NEVER_APPEARED; exit 1; }
prev=""; stable=0
for i in $(seq 1 40); do cur=$(stat -c '%s %Y' $F); if [ "$cur" = "$prev" ]; then stable=$((stable+30)); else stable=0; fi; prev=$cur; echo "$(date +%T) $cur stable=$stable"; [ $stable -ge 120 ] && { echo READY; exit 0; }; sleep 30; done
echo READY_UNSTABLE
