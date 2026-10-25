#!/bin/bash
# raw/*.glb -> assets/*.glb : prune (keeping empty leaf nodes = hitch/marker empties), then meshopt + WebP,
# keeping the node hierarchy/names (no flatten/join/instancing/simplify/palette)
cd "$(dirname "$0")/.."
GT="npx -y @gltf-transform/cli@4.5.1"
for f in raw/*.glb; do
  n=$(basename "$f")
  [ -n "$1" ] && [ "$n" != "$1.glb" ] && continue
  { $GT prune "$f" /tmp/pr_$n --keep-leaves true --keep-attributes false --keep-solid-textures false &&
    $GT optimize /tmp/pr_$n "$n" --compress meshopt --flatten false --join false --instance false \
      --simplify false --palette false --prune false --texture-compress webp; } > /tmp/gt_$n.log 2>&1 || { echo "FAIL $n"; tail -5 /tmp/gt_$n.log; }
  rm -f /tmp/pr_$n
  echo "$n $(stat -c%s raw/$n) -> $(stat -c%s $n)"
done
