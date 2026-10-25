# Walmart DC 3D Ops Dashboard — Reference Quality Checklist

Target: `/workspace/gateflow/walmart-dc.html`. Quality bar = **match or beat** the three references.

Reference frame key (all paths relative to `/workspace/gateflow/`):
- **GF** = ref.mp4 "Gateflow" airport app: `frames/f_012.png` (night ops + full chrome), `frames/f_016.png` (night runway, glow), `frames/f_020.png` (day inspector "DE-ICING TRUCK"), `app/b_01.png` (day overview), `app/a_12.png` (night aircraft), crops `z/d_tl.png` (KPI cards), `z/d_insp.png` (toast + world label), `z/n_right.png` (map toolbar + inspector), `z/n_top.png` (top bar), `z/n_bl.png` (bottom flight card), `z/contact.png`. Extra frames: `qa/ref_frames/ref/`.
- **LI** = li_ref.mp4 warehouse dashboard: `li/l_01..l_15.png`, `qa/ref_frames/li/li_001..039.png` (1 frame / 2 s), sheet `qa/ref_frames/li_sheet.png`.
- **IMG** = real Walmart DC photos `imgref/01..08`, pallet photos `09..12`, forklift detail `13`, iso cutaway/composition refs `14,15,18`, Supercenter frontage `16,17` (16 converted to `qa/ref_frames/16_supercentre_facade.png`).
- **R3** = ref3.mp4 clay-render warehouse: `r3/r_01..r_40.png`, `qa/ref_frames/r3/r3_001..059.png` (4 fps; frame n ≈ t=(n-1)/4 s), sheet `qa/ref_frames/r3_sheet.png`.

Measured motion facts (frame-difference analysis, 10 fps sampling):
- R3 opening camera dolly/orbit runs 0→5.2 s with a long **ease-out tail** (motion energy falls from peak ~25 to 0 over the final ~2.5 s → easeOutCubic/easeOutExpo, no linear stop).
- R3 3D→2D morph (r3_026→r3_034, t≈6.6–7.4 s): **~0.8–1.0 s**, energy peaks in first 0.2 s then decays → ease-out (or easeInOutCubic with fast attack). 3D blocks desaturate/flatten to grey 2D symbols; icons/route labels fade in *after* geometry settles.
- R3 multi-floor section (t≈9.4–14.8 s): continuous, smooth cinematic truck/pan; constant velocity mid-move, eased ends.
- LI camera zooms (t≈50.7, 56.0, 62.3 s): **~450–550 ms**, ease-out (largest frame delta in the first 100 ms). Between zooms the camera is still; only agents move (forklift, workers) and panel content updates (instant swaps every 3–7 s).
- LI KPI counters tick live (Movements today 194→195→196→202→208; Stock on hand 24,380→24,320→24,260→24,390→24,400 across li_001..li_034); activity feed prepends rows; "AutoCount synced 27s ago" counter counts.

Scoring: each item Pass = 1, Partial = 0.5, Fail = 0, multiplied by weight. **Section A, Section R (flawless render & motion) and Section S (continuous automation) and Section V (vehicle realism), X (pallet scale), Y (lift & stack) and Z (fleet kinematics) items carry weight 3; Section W (authenticity vs real Walmart DC photos in `imgref/`) and Section P (post-processing/GLB) weight 2**; all others weight 1. Scoring is at a **shippable-product bar**: anything a paying customer would notice as rough is a Fail, not a Partial. Overall score = weighted points / weighted max × 100.

---

## A. MODEL DETAIL, CARRY CONTINUITY & ANIMATION QUALITY (weight ×3 — "nothing half-made")

Hard rule: anything that reads as a placeholder (plain unbevelled box/cylinder standing in for a vehicle, robot, rack, truck or person) = **FAIL** for that item. Any cargo that slides with nothing carrying it, pops in, or vanishes = **FAIL**.

A1. **Forklifts / pallet stackers are real models.** R3 `r3/r_01.png`, `qa/ref_frames/r3/r3_001.png`, `r3_040.png`, `r3_050.png` (mast stackers: chassis + twin mast rails + fork tines + overhead guard/handle, yellow/black body); LI `li/l_01.png` (yellow counterbalance forklift with mast and cab). Pass: each forklift has ≥8 distinct parts: chassis with bevelled/rounded edges, counterweight, 2 mast uprights, carriage, 2 fork tines (thin, ~0.04 of truck height), overhead guard (4 posts + roof), seat or operator, 4 wheels (cylinders, dark rubber). Forks visibly raise/lower (carriage translates on mast). Manual-truck detail per imgref/13_forklift_detail.jpg & 08: slatted overhead-guard roof on 4 tapered posts, 2-stage mast with chains/hydraulic cylinder, carriage with **load backrest grille**, L-shaped tines (~1.1 m long), seat + steering wheel + levers, rear counterweight curve, LPG tank (red) at back, pneumatic tyres with yellow rims, yellow body #F2B705 / grey frame #4A5560 / black mast #222.
A2. **AMRs / robots are real models.** R3 r3_001 (green/black tugger robots), r3_040/050 (low disk AMRs with yellow rim, shelf-tower "Kiva" robots carrying racks, green unit robots with screen face), r3_010 (top-down robots with directional fronts). Pass: AMR = rounded-rect or disc base with bevel (radius ≥ 8% of width), visible wheel slot/bumper strip, status light (emissive), lidar puck or top plate; reads its heading (front is distinguishable). No plain box.
A3. **Robotic arms (if present) are articulated.** R3 r3_001, r3_010 (yellow 6-axis arms: base drum, shoulder, upper arm, elbow, forearm, wrist, gripper). Pass: ≥4 jointed segments with rounded joints, animated pick/place swing (not static).
A4. **Racks are real pallet racking.** LI l_01/li_034 (blue uprights, orange beams, letter end-signs "A..F", stock on each level); R3 r3_040. Pass: uprights with cross-bracing (diagonal or X), horizontal beams in contrasting colour (per real photos imgref/06–07: deep blue #1D3F9A uprights, safety-orange #E8641F beams), ≥3 levels, deck/pallets with cartons per level, aisle end signs with letters/numbers. Not one solid box per rack.
A5. **Trucks / trailers are real models.** LI l_01 (blue cab + white trailer docked at bays, wheels, logo); GF b_01 (tugs, service trucks). Pass: separate cab (rounded nose, windshield dark glass, grille/bumper, side mirrors), chassis rail, ≥6 wheels with hubs, trailer box with Walmart blue livery + spark/logo, rear doors toward dock; trailer lines up with a dock door/leveller.
A6. **Workers are readable people.** LI l_01 (worker figures with yellow hi-vis, at stations); R3 r3_040 (small figures). Pass: head (sphere), torso (capsule) with hi-vis vest colour (#FFC220 or safety yellow) and reflective strip, legs and arms as separate capsules; walk cycle (legs swing ±25°, arms counter-swing, bob 2–3% height) when moving; idle sway when stationary.
A7. **Cartons/pallets are detailed.** R3 r3_050 (stacked cartons with gaps/bevel lines between units), LI l_01 (cardboard boxes on pallets, tape). Pass: pallets have slats/blocks (not a slab); cartons bevelled (RoundedBoxGeometry radius ~3–5% of size), kraft colour #C89B6A–#D8B07A with tape strip; stacks have per-carton gaps so silhouettes read as many units.
A8. **Building / dock detail.** LI l_01 (walls with branding banner "INSTEEL", dock doors, office glass box, zone floor decals "RECEIVING / STORAGE / PACKING & QC / DISPATCH"); R3 r3_040 (columns, slab edges). Pass: dock doors with levellers/bumpers, wall thickness visible, columns, zone floor tints with painted labels, yellow aisle lines, Walmart sign/spark on façade.
A9. **Carry continuity — pick-up.** Pass (verify in 30-frame sequence): a carrier arrives, decelerates to stop (ease-out ≥300 ms), forks/gripper/robot top align under/at the load, the load **re-parents** to the carrier (world transform preserved; no jump > 1 px between frames), then forks lift (~0.4–0.6 s easeInOut) before driving away.
A10. **Carry continuity — transport.** Pass: while moving, load stays rigidly attached to the carrier (moves exactly with it, rotates with heading); no load moves without a carrier, conveyor belt, or worker's hands under it.
A11. **Carry continuity — drop-off.** Pass: carrier stops, lowers (~0.4–0.6 s), load re-parents to the rack slot/floor/conveyor at its current world position, carrier reverses/backs out. Load count at the destination increments at the moment of drop (feeds KPIs).
A12. **No pop-in / pop-out.** Pass: across ≥60 sampled frames no object (carton, pallet, vehicle) appears or disappears between consecutive frames except via spawn points that are physically plausible (truck trailer unloading, dock door, conveyor entry) and with a fade/scale ease ≥200 ms.
A13. **Vehicle motion quality.** R3 r3_010/r3_020 (AMRs follow green/red route polylines with smooth corners), LI li_001→li_005 (forklift moves along aisle). Pass: path-following with curved corners (Catmull-Rom / arc fillets, radius ≥ 1 vehicle length), heading = path tangent with smoothed yaw (no snapping >15°/frame), accel/decel eased (no instant start/stop), collision-free spacing (no overlapping vehicles).
A14. **Secondary animation / life.** R3 arms swinging, LI workers moving between stations, GF beacon blink + glowing lights (f_016). Pass: ≥3 kinds of ambient motion (e.g. beacon/strobe blink on forklifts, conveyor belt texture scroll or roller rotation, worker idle, dock door roll, status-light pulse) and wheels rotate proportional to speed.
A15. **Frame-to-frame smoothness.** Pass: in 30×100 ms sequence, per-agent displacement between frames varies smoothly (no frame where a moving agent stops dead or jumps > 2× its average step), camera has no jitter.

A16. **Pallets built plank by plank** (imgref/09_pallet_wood_euro.jpg, 10_pallet_wood_stacked.jpg, 11_pallet_blue_wood.jpg, 12_pallet_blue_steel.jpg). Pass: every pallet is an assembly, never a single slab: (wood block pallet, 09/11) **5 top deck boards** (EUR 1200×800: 5 boards, 3 wide 145 mm + 2 narrow 100 mm, 22 mm thick) or GMA 48×40 in (1219×1016 mm: 7 top boards ~89–140 mm wide, 16–19 mm thick) with **visible gaps** (~30–80 mm) between boards; **3 stringer boards** (bottom-of-deck, perpendicular, 22 mm) on top of **9 blocks** (3×3 grid, ~145×100×78 mm); **3 bottom boards** running along the long side; overall height 144 mm (EUR) / ~140 mm (GMA). Stringer variant (10): 3 long stringers notched, top boards nailed across. Steel pallet (12): 8–9 hollow box-section top slats with gaps, 3 longitudinal runners with rectangular **fork pockets cut through the runners** on both ends, 4 short legs. Edges slightly chamfered (1–3 mm bevel) to catch light in the clay look.
A17. **Fork openings on the correct sides.** Pass: block pallets show 2 openings on **all four** sides (4-way entry, between the 3 blocks); stringer pallets show 2 openings on the 2 short ends only (2-way) and the forklift enters from those ends; opening clear height ≥ 95 mm (≈ 0.66 of pallet height) and visibly darker inside (AO). Pallets in racks are oriented with openings facing the aisle.
A18. **Pallet colours & materials match photos.** Pass: natural wood top #EBDAB6 lit / blocks #D6B380 (render base ~#D9B98A, roughness 0.85, subtle per-board tint jitter ±6% and 1–2 board-end darkening); blue painted wood #2E86DE–#3E9AF0 with worn/darker patches (roughness 0.8) (11); blue steel #289CD5 top / #438BB6 sides (render base #2B8FD0, roughness 0.45, metalness 0.3) (12); blue plastic pallets (imgref/01, #2D5DA8) acceptable as an extra type. Wood should dominate (≥60% of pallets) as in imgref/01, 03.
A19. **Fork engagement motion.** Pass (verify frame-by-frame, add a zoomed sequence if needed): forklift approaches square to the pallet, slows (easeOut ≥ 400 ms over final ~1 pallet length), forks are already at **opening height** (tine centre ≈ 70 mm above pallet base; tines inside the openings, not above deck or below floor), forks **slide into the openings** in a straight line to ≥ 80% depth, **no tine intersects any board/block** (no clipping), then carriage lifts 100–150 mm (ease-in-out 400–600 ms) and the pallet rises *with* the forks from that moment — never before contact (no lifting from air), never hovering above tines with a gap.
A20. **Attached through carry and set-down.** Pass: pallet + load stay rigidly parented to the fork carriage during travel (lean/accel sway allowed but identical for load and forks); at destination forks lower until pallet blocks touch the floor/beam exactly (no sinking into beam, no drop from height), pallet re-parents to rack/floor at that exact world transform, forks lower a further ~30 mm and the truck reverses straight out. No snapping of pallet orientation at handoff (yaw delta 0).

## R. FLAWLESS RENDER & MOTION (weight ×3 — highest, alongside Section A; strict pass/fail, no partials)

Bar: user requires "flawless and sharp". Any single instance visible in the 60 fps deterministic capture (`qa/frames60/`) or in the 1440×900 stills = **FAIL**, logged in review.md with frame number and a zoomed crop in `qa/artefacts/fNNNN_<kind>_<where>.png`.

R1. **Aliasing / jaggies.** Edges, thin rack beams/bracing, fork tines, outlines and route lines show no stair-stepping at 100% and no crawling between frames during a camera move. Pass requires: `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))` and composer `setPixelRatio`/`setSize` matched; with EffectComposer, MSAA render target (`samples: 4`) or SMAA/FXAA pass *after* outline; no antialias-false canvas without a post AA pass. Test: sub-pixel edge crawl in consecutive frames < 1% of edge pixels.
R2. **Shadow acne / peter-panning.** No moiré/striping on lit faces, no shadow detached from its caster's contact point (gap > 1 px at hero zoom). Pass: `shadow.bias` ≈ −0.0005…−0.0001, `normalBias` 0.02–0.05, shadow map ≥ 2048² (4096² for whole-DC frustum), camera frustum fitted to scene bounds (or CSM/cascades), PCFSoft/VSM; no shadow-edge swimming as camera moves.
R3. **Z-fighting.** Floor markings, hazard hatches, decals, dock numbers, slab/edge band and coplanar walls show no flicker. Pass: decals lifted ≥ 0.01 m or `polygonOffset: true, polygonOffsetFactor: -1..-4`; camera near/far ratio ≤ 1:5000 (e.g. near 0.5, far 2500) or logarithmicDepthBuffer.
R4. **Sharp text & labels.** Labels/wordmarks are crisp at DPR 1 and 2: CSS2D/HTML labels, or SDF text (troika), or canvas textures at ≥ 2× displayed px × DPR with mipmaps + anisotropy ≥ 4; no blurry/smeared or shimmering glyphs; no UI text rendered into post-processed buffer with bloom halos.
R5. **No clipping / interpenetration.** Agents never pass through racks, walls, each other, trucks; cartons don't intersect cartons or pallets; forks don't penetrate pallet deck boards or blocks.
R6. **Ground contact.** Every wheel, foot and pallet base contacts the floor: gap or sink ≤ 1 cm world / 0 px at hero zoom; wheels rotate at v/r (no skating) and steer with yaw.
R7. **Seated loads.** Pallets sit on fork tines (tine top = pallet underside) and on rack beams (pallet bottom = beam top, overhang ≈ 50–75 mm each side); cartons sit on pallet deck; no hover, no sink.
R8. **No jitter.** Positions/rotations of moving agents and camera have smooth second differences (no frame-to-frame direction reversals, no oscillating yaw); damped camera settles without micro-shake.
R9. **No popping / teleporting.** No object appears, disappears or jumps > 2× its median per-frame displacement in one frame; spawns/despawns fade/scale ≥ 200 ms at a plausible origin (dock door, lift, out of frame).
R10. **Frame pacing.** On real GPU hardware: 60 fps sustained, p95 frame time ≤ 18 ms, no long frames > 33 ms in steady state. Headless SwiftShader is software GL, so the hard number is relative: report p50/p95/max and long frames; motion must be **delta-time driven** (`clock.getDelta()`/rAF timestamp) with dt clamped (≤ 0.1 s), verified by identical world positions at the same virtual time regardless of frame rate (30 vs 60 fps virtual capture).

## S. CONTINUOUS AUTOMATION (weight ×3 — hard bar; strict pass/fail)

Bar: the scene runs fully automated from page load, forever, with no stalls. Tested with a ≥ 3 simulated-minute session at 8× (app speed control if present, else virtual time stepped 8×1000/60 ms per frame), scene graph sampled every frame via a `__THREE_DEVTOOLS__` observe hook (scene + renderer + camera), logged to `qa/automation/`. Every offender logged in review.md with sim time, frame, object name/uuid and crop in `qa/artefacts/`.

S1. **Autostart.** Agents move within 2 s of load with no click/keypress; no "press start" gate; no console errors over the whole session.
S2. **No on-screen pop-in/out.** No box, tote, pallet, carton, vehicle or person is added/removed or toggles `visible` while its projected centre is inside the camera frustum and not fogged (fog factor < 0.9). Spawns/despawns only off-screen, behind fog, inside a building/trailer, or via a ≥ 200 ms fade/scale. 0 events = pass.
S3. **Trucks enter/leave only past the fogged edge.** Truck add/remove/visibility events only where fog factor ≥ 0.9 or outside frustum; trucks drive in/out on a road path, reverse into docks, never appear at a door.
S4. **No teleports.** Per-frame world displacement of any object ≤ plausible max (vehicles ≤ 15 m/s sim, people ≤ 2.5 m/s, carried loads follow carrier) — any jump > 3× its plausible max in one frame = fail (re-parenting must preserve world transform).
S5. **No stalls / deadlocks.** No mobile agent (forklift, AMR, truck, worker, tug) stationary > 30 s sim while not at a scripted dwell (dock dwell allowed ≤ 120 s sim); counts of in-flight tasks/queues stay bounded (no monotonic growth of objects/boxes over the session; scene object count drift ≤ ±5%).
S6. **Forever loop.** After the session: same agent population, no NaN positions, no objects drifting beyond the site bounds, memory/object count stable, FPS not degrading > 10% between first and last minute.
S7. **Camera tour.** Automated tour cycles a fixed shot list with eased transitions (no frame-to-frame camera jump > 3× median moving speed, velocity continuous at shot boundaries), no camera position inside walls/racks/geometry (near plane never clips solid objects), loops back to shot 1 cleanly; record shot list and timings; user input pauses tour and it resumes after idle (8–15 s).
S8. **UI keeps up.** KPIs/feed keep updating throughout the session; "synced Ns ago" never grows unbounded; no frozen panels.

## V. VEHICLE REALISM (weight ×3 — hard bar; strict pass/fail)

Tested from per-frame transforms in the accelerated automation run (`qa/automation/track.jsonl`: world pos, world yaw, parent, and local transforms of wheel/mast/fork/trailer sub-nodes), plus frame-scrub crops in `qa/artefacts/`.

V1. **No pivoting in place.** No vehicle yaw change > 2°/frame-equivalent (> 15°/s sim) while translation < 0.05 m/s (exception: none — real forklifts/trucks need forward motion to turn; AMRs with differential drive may spin in place only if modelled as such and slowly ≤ 90°/s).
V2. **No sideways slide.** Slip angle (heading vs velocity direction, mod 180° for reversing) ≤ 5° whenever speed > 0.2 m/s. Reversing allowed (angle ≈ 180°) but heading must still follow the path tangent.
V3. **Truck front-wheel steer.** Front wheel nodes' local yaw relative to the cab varies through turns, sign matches curve direction (left turn → positive yaw about +Y for +Z-forward models), magnitude ≈ atan(wheelbase × curvature), max 35–45°; 0 on straights.
V4. **Wheel spin ∝ distance.** Wheel rotation angle Δθ = distance / r (±10%) for every vehicle (truck r ≈ 0.52 m, forklift front r ≈ 0.33 m, rear r ≈ 0.27 m); no spin while stationary, reverse spin when reversing.
V5. **Articulated trailer.** Trailer is a separate body pivoting at the fifth wheel/kingpin: articulation angle (trailer yaw − tractor yaw) ≠ 0 on curves, → 0 on straights, trailer rear off-tracks inside the tractor's path on curves. FAIL if rigid (articulation always 0) or trailer locked to cab heading.
V6. **Forklift rear-wheel steer.** Rear wheel nodes yaw (±0–75°), front drive wheels never yaw; turning radius consistent with rear steer (body swings out at rear).
V7. **Forks low while travelling.** Fork carriage height 0.10–0.20 m above floor (carrying or empty) whenever speed > 0.3 m/s; mast tilted back 3–5° when loaded.
V8. **Eased, telescoping lift.** Carriage lift/lower eased (ease-in-out, no linear snap, no per-frame jump > 3× median lift step); inner mast stage rises relative to outer once carriage exceeds free-lift (~1.5 m); lift only while vehicle speed < 0.2 m/s.
V9. **Pallet handling order.** Sequence per handling event: approach (slow to ≤ 0.5 m/s last 2 m) → forks enter openings at pallet entry height → lift 0.1–0.15 m → carry low → stop → raise → place/seat → lower forks → back out straight ≥ 1.2 m → turn. Any missing/out-of-order step = fail.
V10. **Load attachment.** Pallet parented to (moving with) the fork carriage only while lifted; never floating (gap between tine top and pallet underside ≤ 1 cm), never intersecting forks or racks, seated flush on beam (pallet bottom = beam top ±1 cm) or floor (y = 0 ±1 cm) when released; no world-position jump on attach/detach (≤ 1 cm).

## X. PALLET SCALE & LOAD MIX at 1 unit = 1 m (weight ×3)

X1. **Pallet footprint** 1.2 × 1.0 m (ISO/GMA-metric) or 1.219 × 1.016 m (48×40 in), deck height 0.144–0.15 m; measured from bounding boxes in scene (`__track` + `Box3.setFromObject`).
X2. **Loaded heights** mix: full ≈ 1.5 m total (≤ 1.8 m), smaller 0.9–1.2 m, partial 0.3–0.8 m, plus empty pallet stacks (8–15 high, ≈ 1.2–2.2 m). FAIL if > 70% of visible loads share one size/content (cloned look).
X3. **Relative scale.** Pallet reads small next to racks (beam bay 2.7 m clear = 2 pallets + 3×75 mm gaps; beam pitch 1.6–1.8 m; frame depth 1.07–1.1 m so pallet overhangs 50–75 mm front/back), trailer interior (≈ 2.48 m wide × 2.7 m high × 16.0 m: 26 pallets in 2 rows of 13), forklift tines 1.07 m (pallet overhangs tine tips ~0.13 m), human 1.75 m (loaded pallet ≈ shoulder height).
X4. **Load content variety.** Kraft cartons in ≥3 sizes with labels/tape, wrapped loads (film opacity 0.25–0.35), totes, sacks, Great Value / Walmart-blue branded cases ≥ 15% of loads.

## Y. FORKLIFTS ACTUALLY LIFT & STACK (weight ×3)

Y1. **Double-stacking in staging**: pallets stacked 2-high in floor staging lanes, top pallet set down level on bottom load (pitch/roll ≤ 0.5°).
Y2. **Putaway into multiple rack levels** (≥ 3 distinct beam heights used over a 3-min session) with mast telescoping (inner stage rises above free-lift) during high lifts.
Y3. **Set down level and seated**: pitch/roll of released pallets ≤ 0.5°, pallet bottom = beam top ±1 cm, centred in bay (gap to upright 75–100 mm).
Y4. **Retrieval** from racks (reverse sequence) and **trailer loading**: pallets carried over dock plate into trailer, left in 2 rows from nose to doors; trailer fill count rises; truck departs only when full/timed and doors close before departure.

## Z. FLEET KINEMATICS — every wheeled machine (weight ×3)

For each type (report presence; missing type = finding):
Z1. **Tractor-trailer**: front-wheel steer (Ackermann), articulated trailer at kingpin with off-tracking inside on curves, reverses into dock with correct trailer-leads geometry (tractor counter-steers; trailer swings toward door first), landing gear down when dropped.
Z2. **Counterbalance forklift**: rear-wheel steer, tail swing outward on turns, forks low in travel.
Z3. **Reach truck**: present in aisles; pantograph/reach mechanism extends forks into rack; steer on drive wheel.
Z4. **Pallet jack**: tiller angle = steer angle of drive wheel and matches turn direction; operator walks with tiller.
Z5. **Yard tractor (shunter)**: present; hooks/unhooks trailers (fifth-wheel lift), shunts trailers between yard and doors.
Z6. **Tugs & cart trains**: carts follow the tug path (each cart tracks the hitch of the one ahead, tractrix), no cart sliding sideways.
Z7. **All machines**: wheel angle Δθ = distance / radius (±10%); no in-place rotation; slip ≤ 5°; smooth acceleration/deceleration (speed vs time continuous, |accel| ≤ 1.5 m/s² for forklifts, ≤ 1.0 m/s² trucks; no velocity steps > 0.3 m/s in one frame).

## K. SLOT-EXACT HANDLING (BLOCKER class; strict, default FAIL)
For every pickup and drop (rack beam, floor lane, trailer, conveyor induct, sorter lane):
- **K1** At the attach/detach frame, fork-tip world Y = slot beam or surface Y within ±2 cm.
- **K2** Yaw error < 2°, lateral error < 5 cm against the slot axis.
- **K3** The load is visibly seated in its source slot before pickup and in its target slot after the drop (no float or sink > 1 cm).
- **K4** The load moves ≤ 5 cm between consecutive 60 fps frames, including the ±10 frames around attach and detach.
- **K5** The console has 0 builder `[slot-assert]` lines (fork-to-slot > 2 cm); log any exact text.
- **K6** The target height choice has no off-by-one (level N vs N+1), and the vehicle maxH ≥ the highest beam it is sent to.
Evidence: `qa/tools/auto2.js` + `slot_analyze.py` table (event, slot, fork Y, slot Y, error, yaw err, lateral err, max jump, PASS/FAIL) plus crops.

## L. PROCESS LEGIBILITY: a layperson understands the Walmart DC flow just by watching (weight ×3; strict, default FAIL)

Reference: `/home/box/shared/walmart-dc/SIM_SPEC.md` §A–B (layout, steps B1–B8) and `SIM_SPEC_WALMART.md` (SS/DA docks, automated gate, Mode A conventional RDC, RDC-7041 stays fictional).

Each stage passes only when **all** of the following hold:
- (a) it exists as geometry **and** as visible behaviour (agents doing the step);
- (b) it happens in spec order, with the item visibly handed on to the next stage;
- (c) an upright zone sign and/or caption names it with spec vocabulary;
- (d) a first-time viewer can say what is happening within 5 s of the camera arriving.

| # | Stage | Spec | Must see |
|---|---|---|---|
| L1 | Gate check-in | B1.1; W A7 | Truck stops at gate lane, boom rises, (QR/OCR camera flash), proceeds. Sign "GATE / CHECK-IN". In and out lanes separate. |
| L2 | Yard | B1.2–B1.4, B8 | Truck drops trailer in a numbered slot (YA-xx); yard tractor hooks, pulls to an assigned door, backs in (trailer leads), unhooks. |
| L3 | Inbound unload + scan | B2.1–B2.4; W B0 | Door opens, leveler drops, forklift/pallet jack pulls pallets to the stage lane `STG-DRxxx`; associate scans (RF beam/flash); SS vs DA dock naming. |
| L4 | Disposition: put-away **or** cross-dock | B2.4, B3, XDK | Visible split: some pallets go into reserve racks (reach truck, mast up to level), others run straight up the XDK lane to an OBS lane. |
| L5 | Replenishment | B4 | Reach truck lets a pallet down from reserve and feeds a pick-face flow lane from the rear. |
| L6 | Pick | B5 | Freight handlers at pick faces put labelled cases on takeaway conveyor (voice/RF/PTL cue). |
| L7 | Sorter | B6 | Cases merge, induct, pass a scan tunnel, ride the sorter and **divert** into door lanes (not a closed racetrack). |
| L8 | Pallet build + wrap | B5 (NCV), W B6 | Non-conveyable/mixed pallets are built and stretch-wrapped at a wrap station (turntable plus film). |
| L9 | Outbound load | B7.1–B7.4 | Empty trailer spotted at a DS door; cases/pallets load nose-first; trailer fill % rises; door closes when cubed out. |
| L10 | Departure | B7.5–B7.6 | Seal, pull to YE, road tractor hooks, exits through the gate out-lane and leaves through the fog edge. |
| L11 | Order and continuity | — | Stages chain spatially S→N (RCV→RES/XDK→PM→CNV/SRT→OBS) and temporally; one tracked pallet/case can be followed end to end. |
| L12 | Captions and signs | — | Short captions (≤ 8 words) appear in sync with each stage; zone signs readable at hero zoom; vocabulary matches spec (SS/DA, RES, XDK, PM, SRT, OBS); facility named **RDC-7041 (fictional)** everywhere. |
| L13 | Camera tour | — | A guided tour follows **one item** gate → departure with eased cuts, a shot per stage, total ≤ 3 min, then loops cleanly. |

## W. AUTHENTICITY VS REAL WALMART DC PHOTOS (weight ×2 — just below Section A)

Photos (pallet photos 09–12 are covered in A16–A20): `imgref/01_interior_dock_forklifts.jpg`, `02_exterior_docks_walmartcom_trailers.png`, `03_interior_orange_racks_mezzanine.jpg`, `04_aerial_building_roof.png`, `05_facade_logo_parking.jpg`, `06_aisle_blue_racks.jpg`, `07_overhead_aisle_wire_decks.jpg`, `08_forklift_racks_render.jpg` (08 is a generic stock render: use for forklift/rack proportions only, not branding).
Sampled colours (median of patch; "photo" = as lit in photo, "render" = recommended base colour for a clay render with ACES):

| Element | Photo sample | Render base colour |
|---|---|---|
| Façade blue panel (05 shaded / 04 sunlit) | #004DA3 / #037ECB | #0071CE (shadow side reads ~#004C91) |
| Spark logo (05) | #EEA002 | #FFC220 |
| Façade light tilt-up panels (05, 04) | #96A1A9 (shade) / #BBB9B5 (sun) | #D4D8DB |
| Façade dark base band (05) | #536B86 | #6B7885 |
| Façade horizontal blue stripe (05) | #035DB2 | #0071CE |
| Dock wall upper / mid band (02) | #EBE4EA / #92868F | #E9EBEE / #9AA1A9 |
| Roof membrane (04) | #CFD2D6 | #E3E6E9 (TPO, near-white, roughness 0.9) |
| Rack upright (06/07, deep blue) | #0E1D4A (in shade) | #1D3F9A (darker/more royal than #0071CE) |
| Rack beam (06/03/07) | #916F5C / #90513C (under sodium light) | #E8641F (safety orange) |
| Mezzanine steel (03) | #233225 | #2F5B3A (dark forest green) |
| Safety yellow gates/rails/bollards (01/02/03) | #AC8C28 / bright | #F6C600 |
| Autonomous forklift body (01) | #D58029 | #E9822A + black #242526 base |
| Dock floor green pads (01) | #72A768 | #6FAE63 |
| Interior concrete (01/06) | #9A998E / #AFAB9C | #BDBBB2 (polished, roughness 0.45, faint streak texture) |
| Kraft carton (03) | #856B3A | #C79A62 |
| Stretch-wrapped pallet (01) | #A09282 | carton colour under translucent film (opacity 0.25–0.35, roughness 0.2, white specular) |

W1. **Façade composition** (05, 04). Pass: light-grey tilt-up wall with visible vertical panel joints every ~8–10 m (thin dark seams), darker grey base band ~1/3 wall height, one **tall full-height blue panel** (width ≈ 0.12–0.18 of façade length, from ground to parapet, slightly proud of wall) carrying the **spark centred in its upper third** with white "Walmart" wordmark directly beneath; a continuous horizontal blue stripe at ~55–65% height along the office side; 2–4 narrow vertical blue accent stripes near corners (04).
W2. **Spark logo geometry** (05, 04). Pass: 6 rounded-end petals (capsules) radiating at 60° intervals, colour #FFC220, petal length ≈ 2.2× width, centre gap ≈ 0.6 petal length; placed on blue panel, not on grey wall. Not a star, asterisk glyph, or emoji.
W3. **Dock wall** (02). Pass: long side wall with **many** (≥16 visible) dock doors at regular spacing (~4 m centres), each with a dark dock seal/shelter frame, leveller and door numbers; downpipes between doors; horizontal grey mid-band; yellow bollards/guide rails at door bases; door count/spacing consistent along the whole wall.
W4. **Walmart.com trailers** (02). Pass: 53-ft white trailers (L:W:H ≈ 16:2.6:4.1), white sides with blue "Walmart" + spark + ".com" wordmark centred on side (text ~1/3 trailer height), rear doors against the dock, landing gear legs, tandem rear axles; trailers butt square to doors; some bays empty. Also yellow parking-stripe angled bays in the yard, red fire-lane line (02).
W5. **Roof** (04). Pass: flat, near-white/light-grey roof (#E3E6E9) with small parapet lip, scattered **rooftop HVAC units** (small grey boxes ~2×1.5×1 m, 10–20 of them) in loose grid, a few skylights/roof hatches, faint seam lines; when the cutaway is on, roof lifts/fades with eased animation.
W6. **Exterior site** (04, 05, 02). Pass: dark asphalt car park with white/yellow stall lines and red/grey cars by the office façade; vast light concrete truck court on dock side; landscaped verges (green #7FA35A grass), light poles, perimeter fence.
W7. **Rack colours & proportions** (06, 07, 03). Pass: selective pallet racking with **deep blue uprights + orange step beams**; tall: ≥5 beam levels, height:aisle-width ≈ 3.5–5:1 (06 is very narrow-tall); upright frames with diagonal bracing; wire mesh decks visible (07 grid pattern texture/alpha); bays ~2.7 m wide with 2 pallets per level; pallets overhang beam slightly; aisle end protectors yellow at upright bases (07 shows yellow footplates).
W8. **Rack contents** (06, 07). Pass: levels loaded with kraft cartons, some white boxes with labels, black/blue plastic totes (06 left), mixed heights; ~10–20% empty slots; label plates on beams.
W9. **Autonomous forklift look** (01). Pass: Walmart's AMR stackers are **orange body (#E9822A) on black chassis**, low profile, tall black mast with fork carriage, a **sensor/lidar mast or tablet** on top, blue status light, **no operator seat/cab**; at least some forklifts in the sim are this autonomous type (manual yellow counterbalance trucks as in 08 also fine as a second type).
W10. **Green mezzanine / pick module** (03). Pass: elevated multi-tier steel platform in dark green (#2F5B3A) with yellow handrails/stairs (01, 03), grated deck, inclined/spiral conveyors feeding off it; used as the upper floor(s) in the multi-floor cutaway.
W11. **Stretch-wrapped pallets** (01, 03). Pass: outbound/inbound pallets show cartons under translucent film with soft specular streaks and slightly rounded top edges (wrap), on wooden (#C8A06A) or blue plastic (#2D5DA8) pallets; film visibly different from bare carton stacks.
W12. **Floor markings** (01, 02, 06, 07). Pass: polished grey concrete with yellow aisle/pedestrian lines (~10 cm), green rectangular pads in front of dock doors (01), hatched no-park zones, aisle numbers on the floor; yellow pedestrian crosswalks.
W13. **Interior structure & lighting** (01, 03, 06). Pass: tall open-web steel joist roof, columns in grid, rows of round high-bay LED lights (emissive discs, bloom at night), blue wall signage at dock area; feeling of height: racks reach to within ~1–2 m of the joists (06), clear height ≈ 10–12 m ≈ 6× human height.
W14. **Dock interior** (01). Pass: inside each dock door: dock leveller plate, yellow-and-black bumpers, vehicle restraint, staged pallets in front lanes; doors roll up/down animated when trucks arrive/depart.
W15. **Scale consistency.** Pass: human ≈ 1.75 units; forklift ≈ 2.2 m tall mast lowered; trailer 16 m; dock door 2.7 × 3 m; rack beam level pitch ≈ 1.5–1.8 m. Nothing toy-proportioned unless the clay style deliberately rounds edges.

### W-b. Hero composition, Supercenter frontage & prop density (weight ×2; refs imgref/14–18)

Sampled: 14 slab edge band #EE8D30 (shadow side #E2772A); 14 background #F3F3F3 with soft floor reflection; 14 interior floor #C8C5C0; 14 cut-wall concrete #E4DDD6 lit / #B0A8A1 shade; 15 slab side off-white #FFFFFF→#E8E2D8, floor #9F9182 (warm); 17 parapet blue #2665A8 (lit) → render #0071CE; 17 bollards #3366A1 → render #0071CE; 17 EIFS wall #A8A697 shade → render #E6E0CF (warm beige); 17 spark #D6A35E (shade) → #FFC220; 18 wall stripe #00436E → #004C91; 18 floor #E0E1DC.

W16. **Isometric cutaway diorama read** (14, 15, 18). Pass: default 3D hero view is an **orthographic camera or perspective FOV ≤ 25°**, azimuth ≈ 45° (±10°), elevation ≈ 30–35.26° (true iso 35.26°), whole building framed with ≥ 6% margin; reads as a model on a table, not a street-level view.
W17. **Thick base slab with coloured edge band** (14, 15). Pass: the site/floor sits on a slab whose vertical edge is visible in the hero shot, thickness ≈ 2.5–4% of the slab's longest side (e.g. 3–5 m on a 120 m DC, or ≥ 18 px on screen at 1440×900), with a **coloured edge band**: Walmart blue #004C91 (with a 0.4 m #FFC220 pinstripe at the top lip) — or ref-14 orange #EE8D30 — not the same colour as the floor; slab top edge bevelled (r ≈ 0.3 m); multi-floor slabs each show their own edge band.
W18. **Near walls cut away / lowered** (14, 15, 18). Pass: the two camera-facing walls are lowered to ≤ 25% height (or removed) with a visible cut section (wall thickness 0.3–0.5 m, cut face lighter #E4DDD6), the two far walls stay full height; interior racks, forklifts and floor markings fully visible from the hero camera; roof hidden/lifted in hero view (or partial canopy like 15). Walls rebuild/raise when camera orbits so the cut always faces the camera (nice-to-have).
W19. **Soft light background** (14, 15). Pass: background is light and soft — #F3F3F3–#F6F7F9 (or very light blue-grey #EEF3F8) with a radial vignette ≤ 6% darkening and a soft contact shadow / faint reflection under the slab; no dark void, no horizon line, no hard ground plane edge visible. (Night mode may go dark navy, but day hero must match this.)
W20. **Supercenter-style front parapet** (16, 17). Pass: the office/front entrance has a raised **blue parapet** block (#0071CE, roughness 0.6) taller than the main roofline by ~20–30%, with the characteristic **gabled "M"/peaked top edge** (two slopes meeting in a central dip/peak, 16/17) and grey metal cap; white "Walmart" wordmark + yellow #FFC220 spark to the right of the wordmark on the parapet face; glazed entrance (dark glass #1C2A3A, mullions) beneath; beige EIFS wall #E6E0CF with panel joints either side.
W21. **Blue bollards & light poles** (16, 17). Pass: a row of **blue bollards** (#0071CE, cylinder r≈0.15 m, h≈1.0 m, rounded cap, spacing ≈ 2.5–3 m) along the storefront/office kerb (≥ 12 visible); **light poles** (grey #9AA3AD, 9–12 m tall, single or double arm with flat LED head) around the car park at ~25–30 m spacing; head emissive at night.
W22. **Wall stripe & door detailing** (18, 05). Pass: exterior walls carry a horizontal blue band (#004C91, ~12% of wall height) with a thin yellow/pale line (#FFC220 or #F2E7A0) below it as in 18; personnel doors and dock doors framed in contrasting colour.
W23. **Prop density & variety** (14, 15, 18, imgref/01, 03). Pass (hero shot at 1440×900): **≥ 12 distinct prop types** visible, from: wood pallets (empty stacks of 5–10), stretch-wrapped pallets, pallet jacks (manual, 15: yoke handle + forks + steer wheel), electric pallet trucks (14 yellow rider), drums/barrels (14 blue #2A5DA8 + green lids; 18 red/yellow banded), wire mesh cages/roll containers (14), carts/trolleys (15), sacks (14 red/blue bag stacks), cartons loose & stacked, totes, safety cones, yellow bollards/rack-end protectors, signage (aisle signs, dock numbers 1-2-3 as in 15, zone hanging signs), fire extinguisher stations, workstations/packing tables, trash/recycling bins, dock levellers. Each type ≥ 2 instances placed in plausible spots (drums & cages in corners along walls, wrapped pallets staged in lanes in front of dock doors, empty pallet stacks near receiving, pallet jacks parked beside dock doors, carts by packing tables).
W24. **No empty floor.** Pass: divide the visible interior floor into a 6×6 grid in the hero screenshot — **no more than 4 of 36 cells** may contain only bare floor (no racks, props, agents or markings); floor markings (yellow aisle lines, hatched zones, dock-lane rectangles with black/yellow hatch borders as in 15) count as content only if they occupy < 50% of a cell.
W25. **Floor marking craft** (15, 01). Pass: dock lanes outlined in black/yellow hazard hatch (0.1 m stripes at 45°), numbered dock door plates above each door, pedestrian walkways in yellow with hatching at crossings.

## P. POST-PROCESSING, COLOUR MANAGEMENT & EMBEDDED GLB ASSETS (weight ×2; shippable bar)

Bar: "would a paying customer notice this as rough?" → if yes, FAIL.

P1. **SSAO/GTAO visible but not muddy.** Ref: R3 r3_040/r3_050 (soft dark contact under stacks/robots, clean bright tops). Pass: contact darkening under every object and in rack/floor corners; open floor stays ≥ 92% of its no-AO luminance; AO radius ≈ 0.5–1.5 m world (kernelRadius ~8–16 for SAOPass/GTAOPass at DC scale), intensity tuned so no grey halo > 6 px around silhouettes against the background; no noise/grain visible at 100% (denoise/blur on); AO not applied to UI or sky.
P2. **Outlines clean.** Ref: GF b_01, LI l_01 (thin, crisp). Pass: 1–1.5 px (CSS px) at 1440×900, consistent width across near/far objects, colour dark navy #0B2545 @ 35–60% (not pure black), no double lines, no broken/dotted lines on thin geometry (fork tines, rack bracing), **no shimmer** between consecutive frames of a slow camera move (compare 2 frames 100 ms apart: edge pixels flicker < 1% of outline pixels); outline pass after FXAA/SMAA or using an AA'd edge shader; selected-object outline may be thicker (2–3 px) in #FFC220.
P3. **Bloom subtle.** Ref: GF f_016/app/a_12 (glow only around lights). Pass: day mode — bloom effectively off for diffuse surfaces (threshold ≥ 0.9 on linear HDR, strength ≤ 0.35); white roof/floor/trailers do not glow; night — only emissives (lights, beacons, screens, windows) bloom, radius 0.3–0.6, strength 0.6–1.0; no screen-wide haze.
P4. **No banding.** Pass: background gradient, sky, fog and bloom falloff show no visible 8-bit steps (use HalfFloat render targets, dither/noise 1/255 in final pass); check zoomed crops of background gradient.
P5. **Colour management.** Pass: renderer.outputColorSpace = SRGBColorSpace, toneMapping = ACESFilmic or AgX (exposure 0.9–1.2), textures colour-space tagged (baseColor sRGB, normal/ORM linear), EffectComposer ends in OutputPass (so tone mapping/sRGB not applied twice — symptom: washed-out greys or crushed blacks); brand blue #0071CE renders within ΔE ≈ 8 of target on a lit, unshadowed face (measure screenshot pixel).
P6. **Anti-aliasing with post.** Pass: MSAA render target (samples 4) or SMAA/FXAA pass; rack bracing/fork tines/lines not jaggy or crawling.
P7. **Embedded GLBs load cleanly.** Pass: zero console errors/warnings from GLTFLoader/DRACO/KTX2/Meshopt; no 404s for decoders; all assets visible (none missing/invisible/black); correct scale on load (forklift ≈ 2.2 m, trailer ≈ 16 m) and correct up-axis; materials keep clay look (no glossy default metalness 1).
P8. **Asset performance.** Pass: hero GLB total ≤ ~3–5 MB embedded (base64 inflates 33%), each vehicle ≤ 15–25k tris, repeated props (pallets, cartons, racks) instanced (InstancedMesh or BatchedMesh), draw calls ≤ 300 in hero view, FPS with post ≥ 50 on GPU (headless SwiftShader: relative; post must not drop FPS > 50% vs. post disabled if a toggle exists).
P9. **Shadows with post.** Pass: no shadow acne/peter-panning (bias tuned, normalBias ~0.02), shadow map ≥ 2048 covering the DC with tight frustum, soft edges.
P10. **Shippable polish.** Pass: no z-fighting (floor decals/markings offset or polygonOffset), no flicker on coplanar faces, no visible seams on slabs, no geometry poking through walls, no text overflow in UI, no default browser focus rings on canvas, no unstyled scrollbars inside panels.

## B. Render & materials (clay-toy look)

B1. **Clay/soft-toy material.** R3 r3_001/r3_050 (matte satin plastic, soft speculars), GF b_01. Pass: MeshStandard/Physical with roughness 0.55–0.8, metalness 0–0.1 on most objects; no shiny chrome; no flat MeshBasic on 3D geometry.
B2. **Bevelled edges everywhere.** R3 cartons and slabs have rounded edges catching light (r3_050). Pass: primary props use rounded/bevelled geometry; edge highlight visible at 1440×900.
B3. **Ambient occlusion / contact shadows.** R3 r3_040 (dark contact under stacks and vehicles), LI l_01 (soft drop shadows under trees, trucks). Pass: SSAO/GTAO or baked contact-shadow blobs under every object; objects never look floating.
B4. **Soft shadows.** R3 r3_001, LI l_01 trees cast soft ellipse shadows. Pass: shadow map ≥2048, PCFSoft/VSM, penumbra visible; directional key light casting.
B5. **Lighting.** R3: bright key + sky fill, light-blue ambient (sky #859AB5→#B9C8DA). Pass: hemisphere light (sky ~#DCE8F5, ground ~#B8B0A0, ~0.6–0.9) + directional key (~2.0–3.0, warm white #FFF4E6) with shadows; ACES Filmic tone mapping, sRGB output; no blown-out whites, no muddy greys.
B6. **Palette.** Walmart blue #0071CE / #004C91 dominant brand colour, spark yellow #FFC220 accents; neutrals: floor ~#E7ECF5–#CBD1D8 (LI floor #E7ECFD, R3 floor #CBD1D8), dark walls in LI #161C3D (use #004C91 instead). Pass: ≥80% of chroma in scene is blue/yellow/neutral; status colours green #2A8703, amber #FFC220, red #DE1C24 used only for state.
B7. **Outlines/edges.** GF b_01, LI l_01: crisp silhouette, thin dark linework on racks/walls. Pass: either subtle outline pass (1px, ~#00264D at 30–40% opacity) or strong AO-defined edges; no aliasing shimmer (MSAA/FXAA on, pixelRatio ≥ 1).
B8. **Background.** R3 soft blue gradient sky; LI white void; GF warm grey. Pass: gradient or fog that blends floor edge into background (no hard black void, no harsh horizon line).
B9. **Branding in-world.** LI l_01 "INSTEEL" wall banner, GF b_01 "SANJAI INTERNATIONAL AIRPORT" façade sign. Pass: Walmart wordmark + spark on building façade/trailers, readable at default zoom.

## C. Scene content & density

C1. **Zones.** LI l_01 (Receiving, Storage, Packing & QC, Dispatch with tinted floors and floor text). Pass: ≥5 DC zones (Inbound/Receiving docks, Reserve storage racks, Pick modules, Sortation/conveyor, Outbound/Shipping docks) each with floor tint + label.
C2. **Density.** R3 r3_001/r3_040 (hundreds of units, 10+ vehicles per floor); LI l_01 (6 racks × 4 bays × levels, 4 trucks, forklift, workers). Pass: ≥8 rack rows, ≥200 cartons, ≥10 moving agents, ≥4 trucks at doors visible in default view; no empty expanses > 20% of floor.
C3. **Conveyor/sortation.** R3 r3_001 (conveyor with arm), Walmart DC essential. Pass: conveyor runs with rollers/belt and side rails, cartons riding it (attached to belt motion), merge/divert.
C4. **Exterior context.** LI trees around building, trucks in yard; GF parking lot/trees. Pass: yard with parked trailers, truck lanes, trees/greens, perimeter, so the building sits in a world.
C5. **Route visualisation.** R3 r3_010/r3_020 (green/red route lines on floor), GF f_012 (yellow taxi paths). Pass: active agent paths drawn as floor lines (green normal, red blocked/late), animated dash flow.
C6. **World labels/callouts.** GF z/d_insp.png ("GF 215 Cleaning & catering" pill), LI l_10 (hover card "E-02-1 BS Flexible Conduit 20mm"), LI l_01 ("Bay 1 · Loading" chips), R3 r3_034 (numbered badges). Pass: HTML/CSS2D pills anchored to objects, track them smoothly, occlusion-aware or declutter, readable 11–12px.

## D. Camera & motion

D1. **Default camera.** LI isometric-ish 35–45° elevation; GF ~40°; R3 ~35°. Pass: perspective FOV 25–35° (or ortho) with 35–50° pitch, whole DC framed on load.
D2. **Intro fly-in.** R3 t=0–5.2 s eased dolly (r3_001→r3_012). Pass: on load camera eases in over 1.5–3 s with easeOutCubic/Expo; ends exactly on default view.
D3. **Focus/zoom transitions.** LI zoom ~0.5 s ease-out (li_026→li_027, li_034). Pass: clicking object or zoom button tweens position+target over 400–700 ms, easeOutCubic (or easeInOutCubic), no instantaneous jumps.
D4. **Damped orbit/pan.** Pass: OrbitControls with enableDamping (dampingFactor 0.06–0.1), polar clamp (no going under floor), zoom clamp, pan bounded to site.
D5. **Idle life.** LI: camera static, world alive; R3: slow drift. Pass: when idle the scene keeps moving (agents, counters); optional subtle camera drift ≤0.3°/s.
D6. **Toolbar zoom/rotate/home.** GF z/n_right.png (+, −, rotate, recenter, camera, eye); LI l_01 (+, −, rotate-left, rotate-right, home). Pass: vertical icon toolbar, each button animates camera with D3 easing.

## E. 2D/3D morph

E1. **Toggle exists.** R3 r3_020/r3_034 (segmented "2D | 3D" pill bottom-left of map, active = blue fill). Pass: segmented control with icons, active state blue #0071CE fill/white text.
E2. **Real morph, not a cut.** R3 r3_026→r3_034 (~0.8–1.0 s). Pass: camera tweens to top-down (pitch → 90°, perspective → ortho or FOV narrowing) AND geometry height scales/flattens (scale.y → ~0.05) with easeInOutCubic 700–1000 ms; reversible mid-transition without snapping.
E3. **2D symbology.** R3 r3_034 (grey racks, green pick zones, device icons with numeric badges, route lines coloured by state, alert badges red "!"). Pass: in 2D, materials go flat/desaturated, icons/badges/labels fade in after ~60% of morph, route lines stay visible, scale bar (10 m / 50 ft) shown.
E4. **Top-down readability.** Pass: in 2D the layout reads like a floor plan (racks as hatched rectangles, aisles clear, labels non-overlapping).

## F. Multi-floor cutaway

F1. **Multiple levels.** R3 r3_040/r3_050 (4+ stacked slabs, columns, each floor fully populated). Pass: ≥2 (target 3–4) floors (e.g. ground docks/sortation, mezzanine pick module, upper reserve), each with distinct content.
F2. **Floor selector.** R3 r3_020 ("Floor 4" dropdown). Pass: floor picker (All / L1 / L2 / L3) in UI.
F3. **Cutaway animation.** R3 t=9.4–14.8 s smooth reveal. Pass: selecting a floor lifts/fades floors above (translate up 30–60 units or opacity → 0.1–0.15 over 500–800 ms eased), camera re-targets that floor; floors below dim; slab edges thick and white (#F2F4F7) with visible thickness.
F4. **Exploded view.** Pass: "All floors" view spaces slabs apart so every level's contents are visible (as r3_040), with columns connecting.

## G. UI chrome

G1. **Layout.** LI li_001 (KPI row top-left, search top, map toolbar right-centre, inspector right 240–260px of 1024 → ~330px at 1440, activity feed bottom-left, order tracker bottom-centre); GF f_012 same skeleton (dark). Pass: at 1440×900: top bar 56–64px; KPI cards row; right inspector 320–360px; bottom-left feed ~340×200px; bottom-centre tracker; 3D canvas full-bleed behind.
G2. **Panels.** LI cards white #FFFFFF @ 92–96% with backdrop-blur 12–20px, radius 12–16px, shadow `0 8px 24px rgba(16,24,40,.08)`, 1px border rgba(16,24,40,.06); GF dark variant rgba(20,22,30,.85). Pass: consistent radius/shadow/blur; 12/16/24 spacing scale.
G3. **Typography.** LI/GF: geometric sans (Inter-like), KPI value 20–24px bold tabular-nums, labels 11–12px #667085, uppercase eyebrow 10–11px letter-spacing .08em (LI "RACK A · BAY 1 · LEVEL 1" in blue). Pass: one sans family loaded (Inter / Bogle-like), tabular numerals on all live numbers.
G4. **KPI cards.** LI li_001 (icon tile + label + value + delta "+1,920 today" green); GF z/d_tl.png ("On-time departures 94.2% +1.3%"). Pass: ≥5 KPI cards, each with tinted icon tile 28–32px, value, delta coloured green/red, values tick live with count-up easing (300–600 ms).
G5. **Charts.** LI bin-fill progress bar; GF f_012 bottom timeline; R3 r3_020 timeline scrubber with 8:00–12:00 ticks and "Live" pill. Pass: ≥1 sparkline/bar chart + ≥1 progress bar + a timeline; animated on update.
G6. **Inspector panel.** LI li_001 (breadcrumb "‹ Warehouse overview", eyebrow, title 18–20px bold, code chips, status pill "In stock", 2×2 stat tiles, bin-fill bar, recent movements list with +/− coloured, primary/secondary buttons "Stock out −10"/"Stock in +10"); GF f_020 ("DE-ICING TRUCK DI-01", status pill "Servicing", tiles Speed/Fuel bar/Tasks today/Speed limit, key-value rows). Pass: clicking any object type opens a type-specific inspector with ≥4 stat tiles, ≥5 key/value rows, a status pill, ≥1 action button; slides in 250–350 ms ease-out (translateX 24px→0 + fade).
G7. **Activity feed.** LI li_001 (tags PICK/COUNT/PUT/SYNC coloured chips, text, time, "synced 27s ago"). Pass: live feed prepends rows with slide/fade 200–300 ms, coloured type chips, max ~6 visible.
G8. **Toasts / notifications.** GF z/d_insp.png ("GF 507 landed" toast with icon). Pass: event toasts appear top-centre, auto-dismiss 3–5 s, eased in/out.
G9. **Top bar.** GF z/n_top.png (search with ⌘K hint, site selector "Terminal 1 · Gates A1–A5", season selector, "Live 16:07:44" green clock); R3 r3_020 (search, Live pill, user avatar). Pass: brand (Walmart spark + DC name/number), search, site/floor selector, day/night toggle, live clock ticking each second with green dot.
G10. **Iconography.** All refs use consistent 1.5px stroke line icons (Lucide-like). Pass: one icon set, consistent stroke/size (16–20px); no emoji, no mixed styles.
G11. **Legend / view mode chips.** LI li_001 ("Cartons | Stock level" segmented + legend OK/Low/Empty/Full dots); li_022 shows colour remap of stock. Pass: a heatmap/stock-level view mode recolouring stock with legend, transition ≤400 ms.
G12. **Hover affordance.** LI l_10 (hover card), GF z/d_insp.png (cursor + pill). Pass: hovered object gets outline/emissive lift + cursor pointer + tooltip within 100 ms.
G13. **Selection ring.** GF f_012 (orange ground ring around selected aircraft, pulsing). Pass: selected object shows animated ground ring/halo in #FFC220 (or #0071CE), pulse 1.2–1.8 s period.

## H. Day / night

H1. **Toggle.** R3 r3_020 moon icon; GF f_012 night vs f_020 day. Pass: toggle switches both scene lighting and UI theme.
H2. **Night scene.** GF f_012/f_016/app/a_12: deep navy #0B1020–#141A2E ambient, warm window glow (#FFB86B façade strips), emissive vehicle lights with bloom halo, runway/aisle lights as glowing dots. Pass: emissive lights + UnrealBloom (strength 0.6–1.0, threshold ~0.8), dock lights, headlights on trucks/forklifts; scene still legible.
H3. **Transition.** Pass: day↔night crossfades light colours/intensities/background and UI theme over 800–1500 ms (no hard cut).
H4. **Dark UI.** GF f_012 dark glass panels rgba(18,20,28,.85), text #F2F4F7, secondary #98A2B3. Pass: all panels re-theme with sufficient contrast (≥4.5:1 body text).

## I. Interactions

I1. Click any object (rack, truck, forklift, AMR, worker, dock door, conveyor) → inspector + camera focus (G6, D3). Pass for ≥5 object types.
I2. Hover → highlight + tooltip (G12).
I3. Search filters/locates (type "A-01" → flies to rack). Pass: works or at least highlights.
I4. Esc / close button / click empty → deselect with eased camera return.
I5. Keyboard: 2/3 for morph, N for night, 1–4 floors (nice-to-have).
I6. Live simulation drives UI: KPI counts change when drops happen (A11).

## J. Performance & robustness

J1. Zero console errors; zero failed network requests (CDN import map resolves).
J2. FPS: ≥55 fps on real GPU at 1440×900; in headless SwiftShader treat as relative (target ≥ 15 fps there). Use InstancedMesh for cartons/rack parts; draw calls < 300.
J3. Resize/responsive: 390×844 mobile shows usable layout (panels collapse to bottom sheet, no overflow, canvas fills).
J4. Single file, loads < 3 s on broadband; no blocking alerts.
J5. devicePixelRatio capped at 2; shadows/bloom degrade gracefully.
