# v4 visual/UX review: full scene renders (verdict: FAIL, with a new blocker)

Reviewer: QA (read-only; only qa/ was written). Updated Sat 2026-10-31, about 04:07 EDT (America/Toronto). Supersedes the 03:46 EDT version, backed up at `qa/v4_artefacts/v4_review_0346_backup.md` (the 03:31 version is at `v4_review_0331_backup.md`).

**Scope.** At the start (about 04:02 EDT), `ls -la --time-style=full-iso` showed v4_01-v4_14, v4_desktop and v4_phone re-rendered at 03:55:59. v4_15 was still the 03:22 file. The contact sheet was re-rendered at 04:01:18. **The builder was still writing during the review.** At 04:05:11 the builder wrote two new story frames, `v4_07_milk.png` and `v4_09_bev.png`, and re-wrote v4_desktop and v4_phone. v4/main.js, body.html, a7_ui.js and news.json changed at 04:04. I reviewed those 04:05 files too. The rail now has **17 dots**, but v4_08-v4_14 are still the 03:55 renders.

**Method.** I viewed every image at full size and as a 390 px-wide copy (`qa/v4_artefacts/*_0355_390w.png`, `*_0405_390w.png` and `v4_models_0401_390w.png`), plus 2-3x crops. I compared content against ref/ (backroom_*, wrapped_skid_ref, bev_skid_1-4, bev_skid_uniform, bev_skid_wrapped, egg_case_1/2, milk_crates_cooler, snack_case_stacks, mckesson_tote_1/2; strip at `ref_strip_bev_egg_milk_snack.png`). I judged the look only against ref/reel f01-f06 (`reel_strip.png`). The toy-like, low-poly, faceless style matches the reel and is **not** penalised.

**What changed 03:42 → 03:55.** I diffed the 390 px copies (`diff_0342_vs_0355_*.png`). The changes are small. The largest is v4_05, where the skid went from 2 cases to 1. v4_07 now has the DSD associate pulling a jack. Otherwise every 03:46 finding reproduces. **The first 16 contact-sheet tiles are pixel-identical to the 03:32 sheet.** The sheet just gained 12 tiles: milkCrateSkid ×3, snackCaseStack ×2, eggPallet ×2 and beverageSkid ×5.

## Files reviewed (EDT, -04:00; listed at about 04:02, 04:05:57 and 04:06:42)
| Path | mtime | Size (B) | Notes |
|---|---|---|---|
| preview/v4_desktop.png | 2026-10-31 03:55:59.545403420 → **04:05:11.841056148** | 488700 → 494598 | Both versions reviewed. 04:05 has 17 rail dots and a milk skid near the cooler |
| preview/v4_phone.png | 03:55:59.545403420 → **04:05:11.845056141** | 149490 → 151795 | Both versions reviewed |
| preview/v4_01_truck.png | 03:55:59.549403425 | 230631 | |
| preview/v4_02_breakdown.png | 03:55:59.557403434 | 366944 | |
| preview/v4_03_roller.png | 03:55:59.565403443 | 428009 | |
| preview/v4_04_sort.png | 03:55:59.569403447 | 656008 | |
| preview/v4_05_floor.png | 03:55:59.577403456 | 349148 | |
| preview/v4_06_stock.png | 03:55:59.581403460 | 327818 | |
| preview/v4_07_dsd.png | 03:55:59.589403469 | 395666 | |
| preview/v4_07_milk.png | **04:05:11.837056156 (NEW file)** | 572158 | "Frozen & dairy" frame |
| preview/v4_08_snack.png | 03:55:59.593403474 | 260364 | |
| preview/v4_09_bev.png | **04:05:11.841056148 (NEW file)** | 356333 | "DSD · Counting" frame |
| preview/v4_09_pharm.png | 03:55:59.597403479 | 280930 | |
| preview/v4_10_baler.png | 03:55:59.601403483 | 249217 | |
| preview/v4_11_omni.png | 03:55:59.601403483 | 251015 | |
| preview/v4_12_fashion.png | 03:55:59.605403487 | 266451 | |
| preview/v4_13_claims.png | 03:55:59.609403492 | 270449 | |
| preview/v4_14_overview.png | 03:55:59.613403496 | 514344 | |
| preview/v4_15_overview.png | 03:22:06.873321320 | 403227 | Stale and orphaned |
| parts/v4/preview/v4_models.png | 04:01:18.597392109 | 3839098 | 1800×2940, a 4×7 grid of 450×420 tiles |
| parts/v4/preview/v4_models_final.png | 04:01:18.801391911 | 3839098 | Byte-identical to v4_models.png (`cmp`) |
| parts/v4/preview/contact.html | 04:00:12.685445235 | 11705 | |
| parts/v4/preview/trucks_test.png / worker_test.png | 03:29:27.141933867 / 03:29:28.501931454 | 261755 / 286503 | Unchanged |
| parts/v4/README.md | 04:01:27.569383239 | 9263 | Read in full |
| parts/v4/beverageSkid.js | 04:01:06.449403514 | 17463 | |
| parts/v4/eggPallet.js | 03:56:21.141425409 | 9357 | |
| parts/v4/milkCrateSkid.js | 03:45:45.638153406 | 10685 | |
| parts/v4/snackCaseStack.js | 03:47:13.463058078 | 7601 | |
| v4/main.js / body.html / a7_ui.js / news.json | 04:04:19.893 / 04:04:12.937 / 04:04:19.849 / 04:04:20.561 | 114104 / 8302 / 12584 / 1991 | Grepped only. main.js:556 builds beverage skids with `detail:'low'`; main.js:576 hides the milk jugs; body.html:33 still has `#newsBar`; a7_ui.js:95 still fetches through allorigins |

New artefacts in qa/v4_artefacts/:
- 390 px copies: `*_0355_390w.png`, `*_0405_390w.png`, `v4_models_0401_390w.png`, `sheet_0355_390w.png`.
- Diffs: `diff_0342_vs_0355_*.png`.
- Scene crops: `c0355_01_worker_roller`, `c0355_04_red_slab`, `c0355_05_worker_skid`, `c0355_06_worker_shelf`, `c0355_07_pop_float`, `c0355_07_vendors_jack`, `c0355_07_left_skid`, `c0355_08_snack_truck`, `c0355_08_yard_cab`, `c0355_09_tote_pallet`, `c0355_12_zrack`, `c0355_13_cage_boxes`, `c0355_14_sort_area`, `c0355_desk_pharm_pull`, `c0355_desk_trailer_load`, `c0355_desk_tags`, `c0405_07milk_overlap`, `c0405_07milk_puller`, `c0405_09bev_skid`, `c0405_09bev_vendor`.
- Contact-sheet tiles: `m0401_<tile>.png` (28 tiles), `m0401_rows5_7.png`, plus zooms `m0401_bev4_top_zoom`, `m0401_bev7_top_zoom`, `m0401_bev1_wrapped_zoom` and `m0401_egg1_zoom`.

## Findings (worst first)

### BLOCKER-7 (NEW, NOT YET NOTIFIED): The "milk and eggs" frame shows the pharmacy tote pallet instead of an egg pallet, and it is fused into the milk-crate skid
- **File and region:** v4_07_milk.png, centre (c0405_07milk_overlap.png).
- **Wrong object:** The card says "5 milk skids … + wrapped egg pallet go straight to the cooler". The wrapped pallet on the jack is the **McKesson pharmacy pallet**: maroon totes, kraft cartons on top, a blue memo label, and the same glass-case film with corner posts as v4_09_pharm. No egg cases are visible. eggPallet.js exists (tiles `m0401_egg1/2`), but it isn't what's in frame.
- **Intersection:** The black milk-crate stack and the wrapped pallet occupy the same space. Crates show through the film inside the wrap volume, and the two pallets overlap by about 0.5 m.
- **Also wrong:** Only 1 milk skid is visible, not 5. The crates are empty because main.js:576 hides the jugs, whereas milk_crates_cooler.jpg shows full crates. The second worker is cut off by the header at the top.
- **Fix:**
  - Build this pallet with `buildEggs` (6 layers, natural pallet), not the tote pallet.
  - Space the milk skids at least 0.2 m apart, with no overlap, and show several of them.
  - Re-enable the jugs, or at least the cap tops, so the crates aren't empty.
  - Reframe so no worker is clipped by the header.

### BLOCKER-4 (still open; notified as item 1): Jacks still have no operator with hands on the grip, and the new pullers fake the pose
- **New instances (04:05 renders):**
  - v4_09_bev.png, right (c0405_09bev_vendor.png): the beverage vendor leans about 25° backwards, like a falling plank. His right arm is stretched sideways, and his hand is about 0.5 m from the jack's grip ring. The grip ring is beside the green compactor on the left, so the handle runs across behind him. He is not holding anything, and the figure is cropped by the right edge and the dot rail.
  - v4_07_milk.png, right (c0405_07milk_puller.png): the same leaning pose. The hand is in mid-air about 0.4 m past the grip ring, so the jack isn't being pulled.
- **Instances carried over (03:55 renders):**
  - v4_02: the jack at the dock door is unattended.
  - v4_03: the right-hand jack is unattended.
  - v4_05 and v4_06: the jack is detached, about 1 m from the pallet, with no one at it.
  - v4_07_dsd, left: the jack under the banded kraft skid has no one at it. The "Beverage vendor" stands with arms down about 1.2 m from any jack, even though the card says "The vendor pulls the skid in".
  - v4_09_pharm: a few yellow fork tips show, but there is no handle and no puller. The associate walks behind the load.
  - v4_desktop (c0355_desk_pharm_pull.png): the puller walks ahead of the handle, and his hand isn't on it.
  - v4_08: the red box truck's cab is hidden behind the Beverage trailer, so no driver is visible. The yard-truck driver is OK.
- **Partly improved:** v4_07_dsd's DSD associate now leans into a pull with a jack carrying the pop skid (c0355_07_vendors_jack.png), and it reads as pulling. The @jackPull contact tile is correct, but it is unchanged since 03:32.
- **Fix:**
  - Use the README's jack-pull recipe exactly: get `gripPoint` world → handle angle about −0.76 → place the worker about (−0.13, −0.35) from the grip → `jackPullPose` → nudge by the residual distance and re-pose.
  - Clamp the spine lean to ≤ 10° and assert that the hand-to-grip distance is < 3 cm before rendering.
  - Put an operator on every jack that is shown under a load. Seat a driver in the box truck, and frame its windshield.

### BLOCKER-1 (still open; notified as item 4): The news ticker is on every frame, and v4_14 is still a data panel
- **Files and regions:**
  - Every story frame, including the new v4_07_milk and v4_09_bev, bottom-left: "News · Walmart Canada launches AI shopping assistant Sparky - BNN Bloomber…". body.html:33 still has `#newsBar`, and a7_ui.js:91-95 still has the live allorigins/Google News fetch. news.json was re-written at 04:04.
  - v4_14_overview.png, left 45%: the "High-shrink ('put line items'): Div 1: 2, 5, 46, 72 · Div 31: 6 · …" code line and the 9-line "Pay-for-scan" vendor callout.
  - v4_15_overview.png (03:22) still shows KPI tiles.
- **Fix:** Delete `#newsBar`, the news IIFE, news.json and the third-party fetch. Cut v4_14 to one plain sentence. Delete v4_15.

### BLOCKER-2 (still open; notified as item 5): The step about stretch-wrapped skids still shows bare boxes
- **File and region:** v4_02_breakdown.png, centre and right. The card says "Mixed skids, stretch-wrapped … about 1.9 m tall", but there is no wrap anywhere in the frame. The 3 front skids are one layer, about 0.6 m tall. The right skid is about 1.9 m tall but bare, in 2 columns with a gap.
- **Status:** No change since 03:42 (diff: 1438 px). The 5 wrappedSkid instances are still at x = −4.45, z 13.5-19.9 (main.js:623), outside the step 2 camera. No wrapped 1.9 m skid appears in any story frame:
  - v4_09_bev shows the skid after unwrapping, and no cut film is shown.
  - The only wrapped load in a frame is the tote pallet, which appears in v4_09_pharm and is mis-cast in v4_07_milk.
- **Improved:** The contact sheet now has good 1.9 m wrapped skid parts: wrappedSkid seeds 1, 4 and 7, eggPallet 1.90 m, and snackCaseStack 1.94 m.
- **Fix:** Aim the step 2 camera at the wrapped skids, or move one to the breakdown spot. Show it at 1.9 m against the 1.78 m worker, with the film partly cut, a worker cutting it, and an empty-pallet stack by the wall.

### MAJOR-22 (NEW): Beverage skids read as coloured toy bricks, not drinks
- **Files and regions:**
  - v4_models.png, rows 6-7, the beverageSkid tiles for seeds 1, 4, 7 and 2 (m0401_bev4_top_zoom, m0401_bev7_top_zoom, m0401_bev1_wrapped_zoom).
  - v4_09_bev.png, centre (c0405_09bev_skid.png).
- **Problem:** In the default `detail:'low'` (the setting main.js:556 uses), every case is a flat saturated slab: lime, magenta, purple, red or green. The can tops are rendered as rows of studs, so the stack reads as LEGO/Duplo. The refs (bev_skid_1-4 and bev_skid_wrapped) show printed can cartons, shrink-wrapped bottle trays and visible bottles.
  - Seed 7 (m0401_bev7_top_zoom): a red top case overhangs the stack edge by about 1/3 of its width, unsupported.
  - Seed 4 (m0401_bev4_top_zoom): a pale-yellow translucent block (the 4 L jugs) sits at the top corner, ghost-like.
  - Uniform seed 2: a featureless blue monolith with no carton seams. Compare bev_skid_uniform, which has printed 12-pack faces.
  - The `detail:'high'` tile (the last tile in row 7) reads much better, with visible bottles.
- **Fix:**
  - In 'low', show a bottle-top or can-top texture instead of studs, and a mid-tone print band per case (the low-saturation palette of the refs). Keep "no logos".
  - Add carton seams on the uniform skid, and support every top case.
  - Or use 'high' for the one skid in the hero frame.

### MAJOR-17 (still open): The unloader is fused into the roller head (v4_01)
- **File and region:** v4_01_truck.png, centre (c0355_01_worker_roller.png). The image is unchanged since 03:42 (diff: 3328 px, mostly tags).
- **Problem:** The worker's hips are inside the roller's end, his hands hang empty, and a grey slab crosses at chest height. The "Roller head" tag sits on his torso, and the stray "Wa…" trailer graphic floats outside the right trailer wall. There is 1 case on the roller.
- **Fix:** As before: feet on the trailer floor beside the roller, `carryPose` with a case, a sloped dock plate, and 3-5 cases on the roller.

### MAJOR-18 (still open, worse): The v4_05 → v4_06 skid is now a single case
- **Files and region:** v4_05_floor.png, centre (c0355_05_worker_skid.png).
- **Problem:** The "finished Dept 46 skid" is now **1 case** on a black pallet (it was 2 at 03:42). The worker walks away from it empty-handed, and the jack sits detached about 1 m away. In v4_06 (c0355_06_worker_shelf.png) the pallet is empty and the worker faces the shelf with his hands at his sides. The kraft cartons on the shelf are unopened, while the card says "the product goes into the empty spots".
- **Fix:** A 6-10 case skid on an engaged jack with a puller (v4_05). Then 3 cases left, one open, with product going into a gap (v4_06).

### MAJOR-23 (NEW): A giant red slab fills the v4_04 foreground
- **File and region:** v4_04_sort.png, bottom-centre/right (c0355_04_red_slab.png).
- **Problem:** An untextured red plane, about 25% of the frame, cuts diagonally across the bottom. It is either the near clip of a red pallet or the red monolith (MAJOR-5) intersecting the camera. It reads as a rendering error.
- **Fix:** Move the camera or the object so nothing is within 1.5 m of the camera, or hide near-frustum objects for that shot.

### MAJOR-19 (still open): A Zebra handheld floats above the pop skid
- **File and region:** v4_07_dsd.png, bottom-right (c0355_07_pop_float.png). It hovers about 0.25 m above the cans, not in anyone's hand.
- **Fix:** Put it in the DSD associate's hand (`attachHandsTo`), or rest it on the pack top.

### MAJOR-20 (still open): The breakdown step's only worker is hidden behind the card
- **File and region:** v4_02_breakdown.png, left. The worker is ghosted through the card, and no person is visible outside it.
- **Fix:** As before: frame the action in the right 60% of the viewport.

### MAJOR-21 (still open): The camera clips a foreground worker
- **File and region:** v4_03_roller.png, bottom-left. A giant cropped vest and arm, unchanged.
- **Fix:** Keep the camera at least 1.5 m from workers.

### MAJOR-1 (still open): Trailers are roofless cutaways
v4_08_snack.png, right (the "FDS" Walmart trailer is open from above); v4_14; v4_desktop (c0355_desk_trailer_load.png); v4_phone. Fix: close the roofs.

### MAJOR-2 (still open): Pallets are still mostly black
- **Black:** v4_02 (all), v4_04 (most), v4_05 and v4_06 (black with teal slats), v4_12 left.
- **Correct:** the new 04:05 frames use correct pallets (natural, CHEP blue and red).
- **Fix:** `PM.woodVC` plus the `_pallet.js` seed paint everywhere.

### MAJOR-3 (still open): Roller zig-zag
v4_04_sort.png, centre-left: the sections meet at angles, and the joins are hidden by the card. Fix as before.

### MAJOR-4 (still open): Signs render as barcode stripes
v4_11_omni.png, top; v4_12_fashion.png, top; v4_02 upper-left; v4_desktop right wall; v4_14 top-left (c0355_14_sort_area.png). Fix as before.

### MAJOR-5 (still open): Toy-block products and unidentified monoliths
- **Files and regions:**
  - v4_05 and v4_06 gondolas: solid-colour 0.4-0.5 m bricks.
  - v4_12: garment slabs with no hangers.
  - v4_10 left: a lone 1 m cardboard cube.
  - v4_desktop centre-right and v4_14 centre (c0355_14_sort_area.png): a red monolith and a blue monolith, each about 1.5-2 m.
- **Fix:** As before. For the beverage version of this problem, see MAJOR-22.

### MAJOR-8 (still open): Interpenetration and ghost poses
- **Files and regions:**
  - v4_12_fashion.png, centre (c0355_12_zrack.png): a worker is fully hidden in the garments, so only the legs show.
  - v4_12: the two Z-rack frames intersect at their shared upright.
  - The v4_07_milk overlap is in BLOCKER-7.
- **Fix:** Separate the racks, and put the worker at the open end, hanging an item.

### MAJOR-9 (still open): Too empty compared with backroom_1/2
- **Files:** v4_09_pharm (a white void around one pallet), v4_11 (no people, 4 totes), v4_13 (nearly empty cage), v4_07_milk and v4_09_bev (bare floor, with 1 skid each).
- **Fix:** As before.

### MAJOR-10 (still open): Phone and 390 px legibility
- **v4_phone.png:** the "Stocking 2 · sorting by dept" tag is clipped at the right edge, and the news ticker is truncated.
- **390 px copies:** v4_07's "Receiving · Check-in · invoices · memos" subtitle, the "FDS" placard in v4_08, the desktop Cooler/Freezer plaques and all contact-tile captions are illegible.
- **v4_09_bev:** the "Beverage vendo…" tag is clipped at the right edge, even at full size.
- **Fix:** As before. Render every step at 390×844 and keep tags inside a safe area at least 24 px from the dot rail.

### MAJOR-11 (still open, worse): Step and frame numbering
- **Rail versus renders:** The rail now has 17 dots (04:05), but v4_08-v4_14 were rendered at 03:55 for a 15-dot rail.
- **File-name collisions:** Two files share each step number: `v4_07_dsd` and `v4_07_milk`, and `v4_09_pharm` and `v4_09_bev`.
- **Card labels:** "STEP 7" is on both v4_07_dsd and v4_08. The new frames say "FROZEN & DAIRY" and "DSD · COUNTING" with no step number. "STEP 8" is on v4_11, v4_12 and v4_13. v4_10 says "MORNING PRE-OP" mid-night.
- **Fix:** Renumber every step 1-17 to match the rail, re-render all frames in one pass, and name the files `v4_NN_*` with unique NN.

### MAJOR-12 (still open): Aerial dollhouse landing
v4_desktop.png and v4_phone.png (both 03:55 and 04:05), and v4_14. Fix as before.

### MINOR-1: The card hides the subject
v4_02 (MAJOR-20), v4_13 (the worker is half behind the card and isn't scanning), v4_10 (the compactor is behind the card), v4_07_dsd (the banded skid and jack on the left are behind the card; c0355_07_left_skid.png).

### MINOR-2: Card promises that aren't shown
- v4_02: no empty-pallet stack, though the card mentions one.
- v4_01: no "CP" placard visible on the trailer.
- v4_09_bev: the card says the receiver "cuts all the stretch wrap off, counts with the handheld", but no receiver, cut film or handheld is in frame.

### MINOR-3: Idle workers
v4_04: the sorters stand arms-down, and the centre worker walks with empty hands. v4_13: the worker isn't scanning.

### MINOR-4: Tag collisions
- v4_10: the "Baler" tag covers the "Cardboard baler" sign.
- v4_desktop and v4_phone: a second dark tag is hidden under "Stocking 2 · sorting by dept" (c0355_desk_tags.png).
- v4_12: "Z-racks" and "Fashion · hanging apparel" overlap.

### MINOR-5: Dev chrome on the contact sheet
v4_models.png: the composed tiles still read "? × ? × ? m", and two tiles are labelled "beverageSkid seed 1" with no indication of which is 'low' or 'high', or wrapped or bare. Fix: add detail and wrapped state to the captions.

### MINOR-6: Stale or duplicate renders
v4_15_overview.png (03:22) is orphaned and shows KPI tiles. v4_models_final.png is byte-identical to v4_models.png. Fix: delete v4_15, and stamp a build hash and the rail index on each render.

### MINOR-7: worker_test.png is stale
It is the 03:29 render with painted faces. Fix: re-render it.

### MINOR-8: The pop skid's bottles are black cones
v4_models.png row 1 tile 2 (unchanged) and v4_07_dsd bottom-right. Fix as before (coloured label bands, caps, pack gaps).

### MINOR-9: Compactor decals read as confetti
The tile is unchanged. Fix as before.

### MINOR-10: Driver tiles can't show the drivers
The tiles are unchanged; the cab fills them, and at 390 px no driver is visible. Fix as before.

### MINOR-11: The v4_08 card and tags disagree
- **File:** v4_08_snack.png.
- **Problem:** The card says "the tractor-trailer reverses". "Snack Vendor reversing to door" points at a red box truck, while the second yellow tag, "Snack vendor", points at a skid at a different door.
- **Fix:** Make the text and the vehicles match, and use one tag.

### MINOR-12: The pharmacy pallet's wrap reads as a glass cabinet
v4_09_pharm.png, centre (c0355_09_tote_pallet.png): vertical tube "posts" at the corners and mid-faces, and empty film above the load. The same film is on the mis-cast pallet in v4_07_milk. Fix: use the wrappedSkid film.

### MINOR-13: The McKesson tote has a strap the refs don't show
The tile is unchanged. Fix as before.

### MINOR-14 (NEW): The egg pallet's wrap has the same glass-post look
- **File and region:** v4_models.png, row 6, tiles 1-2 (m0401_egg1_zoom.png).
- **Problem:** There are vertical highlight tubes at the corners and the mid-face. The film skirt hides the pallet, and the blue print band and hand-holes of egg_case_1/2 barely read through the film.
- **Fix:** Reduce the film opacity and drop the post highlights so the case print shows.

### MINOR-15 (NEW): The milk-crate stencils show impossible dates
- **File and region:** v4_models.png, row 5 tiles 1-2 and row 6 tile 3 (m0401_milk1.png): stencils read "33/11 31" and "27/01 31".
- **Fix:** Generate valid dd/mm (day ≤ 28), or use plain numbers.

### MINOR-16 (NEW): Unidentified grey planks lie flat in the overview
- **File and region:** v4_14_overview.png, centre-right, near the red and blue monoliths (c0355_14_sort_area.png): 8 grey boards with no uprights visible. They are probably OGP shelves seen from above, but they read as loose planks.
- **Fix:** Make the uprights readable from above, or label the area.

## Status of previous findings (03:46 review)
| ID | Status at 04:07 |
|---|---|
| BLOCKER-1 news/data clutter | **Open**: unchanged, and it is on the new frames too |
| BLOCKER-2 no wrapped skid in step 2 | **Open**: v4_02 is unchanged; the parts are good but not in the shot |
| BLOCKER-4 no operators | **Open**: v4_07_dsd's associate is improved, but the 2 new pullers (v4_07_milk and v4_09_bev) have their hands off the grip and lean impossibly |
| MAJOR-17, 18, 19, 20, 21 | **Open**; MAJOR-18 is worse (1 case) |
| MAJOR-1, 2, 3, 4, 5, 8, 9, 10, 11, 12 | **Open**; MAJOR-11 is worse (17-dot rail, duplicate file numbers) |
| MINOR-1 to MINOR-13 | **Open**: the 16 original contact-sheet tiles are pixel-identical to 03:32 |
| BLOCKER-3, 5 / MAJOR-6, 7, 14, 15, 16 | Remain resolved |

## Blockers already notified to Soros (for dedupe)
From the 03:17 EDT review:
1. Vehicles have no drivers or operators (BLOCKER-4)
2. No scene render (resolved)
3. Cartoon mannequin worker (resolved)

From the 03:31 EDT review:
4. Dashboard and news clutter (BLOCKER-1)
5. No stretch-wrapped skids (BLOCKER-2)
6. Capsule people (resolved)
7. Blank first frame (resolved)
8. Skid and worker vanish between steps 5 and 6 (downgraded to MAJOR-18)

**NEW and NOT YET NOTIFIED:** BLOCKER-7 (v4_07_milk: the pharmacy tote pallet is shown in place of the egg pallet and intersects the milk-crate skid).

## Counts
- **BLOCKER: 4.** BLOCKER-1, -2 and -4 are open and already notified. BLOCKER-7 is **NEW**.
- **MAJOR: 17.** MAJOR-22 and -23 are new. Open: 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 17, 18, 19, 20, 21.
- **MINOR: 16.** MINOR-14, -15 and -16 are new; MINOR-1 to -13 are open.
- **Files changed during the review:** yes. v4_07_milk.png and v4_09_bev.png were created at 04:05:11, v4_desktop.png and v4_phone.png were re-written at 04:05:11, and v4/main.js, body.html, a7_ui.js and news.json changed at 04:04. v4_08-v4_14 have not been re-rendered for the 17-step rail. Nothing changed between 04:05:57 and 04:06:42.
