# v4 visual/UX review: full scene renders (verdict: FAIL; 1 NEW blocker not yet notified: BLOCKER-12)

Reviewer: QA (read-only; only qa/ was written; nothing committed). Updated Sat 2026-10-31, about 05:44 EDT (America/Toronto). This covers the **05:38:36 EDT** renders and supersedes the 05:23 version (backed up at `qa/v4_artefacts/v4_review_0523_backup.md`; older backups: `v4_review_0444_backup.md`, `v4_review_0433_backup.md`, `v4_review_0408_backup.md`, `v4_review_0346_backup.md`, `v4_review_0331_backup.md`).

**Scope.** `ls -la --time-style=full-iso` of preview/v4_*.png and parts/v4/preview was taken at the start (05:39:56 EDT, `qa/v4_artefacts/ls_start_0538.txt`) and the end (05:43:59 EDT, `ls_end_0538.txt`). The two listings are identical (`diff` empty), and `find -newer preview/v4_phone.png` over preview/, parts/v4/ and v4/ returned nothing, so **nothing changed during this review**. All 20 `preview/v4_*.png` were re-rendered together at 05:38:36. They are newer than the latest source (a5_brains.js / a7_ui.js 05:36:38, main.js 05:36:38.32, out.js 05:36:38.34, news.json 05:36:39.07). parts/v4/preview is unchanged since 04:24:54 (newest PNG cardboardBale_crop.png 04:24:54.21), so the parts findings carry over unchanged.

**Method.**
- Every image viewed at full size and as a 390 px-wide copy (`qa/v4_artefacts/*_0538_390w.png`, contact sheet `sheet_0538_390w.png`), plus 1.5-2.5x crops (`c0538_*`), and side-by-side 0500 vs 0538 pairs (`pair_0500_0538_*.png`).
- Diffed each 390 px copy against the 05:00 copy (`*_0500_390w.png`, threshold 24/255) to locate changes: big changes in v4_06 (66% of pixels), v4_10 (63%), v4_05 (38%), v4_09 (36%), v4_02 (24%), v4_08 (17%); moderate in v4_03 (8%), v4_07 (6%); ≤4% (substantively unchanged) in v4_01 (but see MAJOR-21: new foreground worker bottom-right), 04, 11 (worker re-pose only), 12-18, desktop, phone.
- Content checked against ref/ photos (backroom_1/2, wrapped_skid_ref, bev_skid_1-4/wrapped, dsd_truck_blue_trailer, dsd_truck_red_box, egg_case_*, milk_crates_cooler, mckesson_tote_*, cardboard_bale, pop_skid_*; ref sheet `ref_sheet_0538.png`). Style judged only against ref/reel f01-f06 (`reel_sheet_0538.png`: bright, clean, low-poly miniature diorama); toy-like, low-poly, faceless style is **not** penalised.
- Per the user's calibration, the small collapsed "News" chip and the "route" chip are intentional and are only flagged if a still shows them open or covering the scene.

## What changed 05:00 → 05:38 (summary)
- **v4_10 (fixed framing):** Camera pulled back: dock wall, 5 dock doors, a red box truck and a blue tractor-trailer backed in, both with visible seated drivers behind glazing, and Walmart trailers to the right. The step is readable at 390 px. **BLOCKER-10 resolved.** Residuals: the tractor-trailer is decaled "Beverage Vendor" in the *snack* step, the "Snack vendor truck" tag floats over an empty door, and the right-hand Walmart cab is an open shell cut by the edge (→ MAJOR-29, new).
- **v4_09 (improved, still failing):** The vendor (black uniform) now stands clear of the skid holding the jack grip; the receiver (blue vest) is fully in frame. The embedding is gone. But there is still no cutting, no handheld, no film being removed; the base of both skids is a translucent "ghost" block; the two tags stack on top of each other. BLOCKER-11 narrowed, still open.
- **v4_08 (regressed):** A giant foreground worker now fills the bottom-left ~30% of the frame, head hidden under the card, holding a floating yellow jack ring with no jack visible. The DSD associate (in frame at 05:00) is gone, and the "DSD associate · receiving" tag is hidden behind the "Beverage vendor" tag. → **BLOCKER-12 (NEW, not yet notified)**. Beverage skid colours are now muted (dark green, maroon, navy, grey) instead of lime/purple: MAJOR-22 improved.
- **v4_02 (much improved):** The tall skid now has visible stretch film (about 1.9 m, as tall as the worker); the breakdown worker stands at the skid with a hand on it; a second worker pulls an empty jack (hand on grip) toward a stack of 5 empty pallets under an "Empty pallets" wall sign. BLOCKER-4's v4_02 part is resolved. BLOCKER-2 narrowed: the wrapped skid is ~60% hidden behind the card, nobody cuts film, and there is no partner or roller in frame. Two tags are clipped by the right edge (MAJOR-30, new).
- **v4_05 (re-framed):** Low camera at a sales-floor gondola end; the puller walks with his hand on the grip of an engaged jack. MINOR-22 partly resolved (now on the sales floor). Residuals: the tag still floats ~1 m above the skid, the puller is half hidden behind the gondola end, the foreground gondola shows 0.5 m solid-colour monolith "products".
- **v4_06 (still failing):** Camera now at aisle height over the gondolas; the Dept 46 skid (4 cases, black pallet) sits in the aisle with **no jack** (the jack vanished between v4_05 and v4_06), and the worker walks away from it with arms down. Still nobody takes a case off or puts product on a shelf, and no shelf hole is visible. MAJOR-28 still open, now also an appear/disappear defect.
- **v4_01:** A new foreground worker and the edge of a wrapped skid appear bottom-right, cut by the bottom bar and nav buttons (MAJOR-21). A loose case near the dock lip (05:00) is gone.
- **v4_03, v4_07, v4_11:** minor re-poses. v4_11: the associate now holds the jack ring with both hands, but the forks still run alongside the pallet, not under it (BLOCKER-4 still open).
- **v4_04, v4_12-v4_18, desktop, phone:** substantively unchanged.
- **News chip and routechip:** the News chip is collapsed (bottom-left pill) in all 20 stills, and the routechip in v4_18 is a collapsed "How receiving routes items (store receiving notes) ▸" pill inside the card. Neither is open or covers the scene in any still, so per the user's exception **BLOCKER-1 is closed**. (Informational: the live allorigins fetch still exists at a7_ui.js:99, main.js:1021, out.js:17; body.html:32 `#newsBar`, body.html:28 routechip.)

## Files reviewed (EDT, -04:00; identical at the start 05:39:56 and the end 05:43:59)
| Path | mtime | Size (B) | Notes |
|---|---|---|---|
| preview/v4_01_truck.png | 2026-10-31 05:38:36.229315225 | 242816 | New fg worker clipped (MAJOR-21) |
| preview/v4_02_breakdown.png | 2026-10-31 05:38:36.229315225 | 402908 | Film added; BLOCKER-2 narrowed |
| preview/v4_03_roller.png | 2026-10-31 05:38:36.233315164 | 481930 | Minor re-pose |
| preview/v4_04_sort.png | 2026-10-31 05:38:36.237315103 | 797180 | Unchanged |
| preview/v4_05_floor.png | 2026-10-31 05:38:36.237315103 | 186815 | Re-framed at gondola (MINOR-22 partly resolved) |
| preview/v4_06_stock.png | 2026-10-31 05:38:36.237315103 | 310283 | Still no stocking; jack vanished (MAJOR-28) |
| preview/v4_07_milk.png | 2026-10-31 05:38:36.241315043 | 377580 | Minor change |
| preview/v4_08_dsd.png | 2026-10-31 05:38:36.241315043 | 369318 | **Regressed (BLOCKER-12, NEW)** |
| preview/v4_09_bev.png | 2026-10-31 05:38:36.241315043 | 373555 | Embedding fixed; BLOCKER-11 narrowed |
| preview/v4_10_snack.png | 2026-10-31 05:38:36.245314982 | 185080 | **Fixed framing (BLOCKER-10 resolved)**; MAJOR-29 |
| preview/v4_11_pharm.png | 2026-10-31 05:38:36.245314982 | 276908 | Re-pose; forks still beside pallet |
| preview/v4_12_baler.png | 2026-10-31 05:38:36.249314921 | 391403 | Unchanged |
| preview/v4_13_omni.png | 2026-10-31 05:38:36.249314921 | 268221 | Unchanged |
| preview/v4_14_fashion.png | 2026-10-31 05:38:36.249314921 | 278170 | Unchanged |
| preview/v4_15_claims.png | 2026-10-31 05:38:36.253314860 | 306946 | Unchanged |
| preview/v4_16_stairs.png | 2026-10-31 05:38:36.253314860 | 314363 | Unchanged |
| preview/v4_17_upstairs.png | 2026-10-31 05:38:36.253314860 | 171910 | Unchanged |
| preview/v4_18_overview.png | 2026-10-31 05:38:36.257314799 | 571098 | Unchanged; routechip collapsed |
| preview/v4_desktop.png | 2026-10-31 05:38:36.257314799 | 541171 | Unchanged |
| preview/v4_phone.png | 2026-10-31 05:38:36.261314737 | 157028 | 390×844; unchanged |
| parts/v4/preview/ (dir) | 2026-10-31 04:24:54.121188619 | 4096 | Unchanged |
| parts/v4/preview/v4_models.png / v4_models_final.png | 04:24:30.361192377 / 04:24:32.981192083 | 5029936 / 5029936 | Unchanged; still duplicates |
| parts/v4/preview/cardboardBale.png / _crop.png | 04:24:17.997193349 / 04:24:54.213188599 | 181649 / 530536 | Unchanged |
| parts/v4/preview/floor1_test.png | 04:18:02.996798021 | 1367722 | Unchanged |
| parts/v4/preview/trucks_test.png / worker_test.png | 03:29:27.141933867 / 03:29:28.501931454 | 261755 / 286503 | Unchanged (stale) |
| parts/v4/preview/contact.html / floor1_test.html / trucks_test.html / worker_test.html | 04:23:47.905 / 04:17:31.720 / 03:29:23.369 / 03:27:22.258 | 12104 / 10968 / 3708 / 2716 | Not rendered |
| v4/a4_sim.js / a5_brains.js / a6_render.js / a7_ui.js / main.js / out.js / news.json | 05:25:13.077 / 05:36:38.266 / 05:26:47.436 / 05:36:38.270 / 05:36:38.318 / 05:36:38.338 / 05:36:39.071 | 22449 / 28804 / 9612 / 13067 / 121198 / 231963 / 1991 | Grepped only (body.html:28 routechip, body.html:32 newsBar, allorigins at a7_ui.js:99, main.js:1021, out.js:17) |

New artefacts in qa/v4_artefacts/ (all tagged 0538):
- `v4_review_0523_backup.md`, `ls_start_0538.txt`, `ls_end_0538.txt`.
- 390 px copies: `*_0538_390w.png` (20 files) and `sheet_0538_390w.png`; `reel_sheet_0538.png`, `ref_sheet_0538.png`; `pair_0500_0538_{v4_01,02,03,05,06,08,09,10}*.png`.
- Crops: `c0538_01_fg_worker`, `c0538_02_skid_worker`, `c0538_02_jack_pallets`, `c0538_02_fg_boxes`, `c0538_02_trailer_worker`, `c0538_05_worker_jack`, `c0538_06_worker_skid`, `c0538_08_fg_worker`, `c0538_08_vendor_jack`, `c0538_09_vendor_skid`, `c0538_09_right_skid`, `c0538_09_receiver_hands`, `c0538_10_trucks`, `c0538_10_bluecab`, `c0538_10_redcab`, `c0538_10_right_cab`, `c0538_10_tags`, `c0538_11_jack`.

## Findings (worst first)

### BLOCKER-12 (NEW, not yet notified; supersedes the v4_08 part of MAJOR-21): v4_08 is dominated by a headless foreground giant holding a floating jack ring, and the DSD associate is gone
- **File and region:** v4_08_dsd.png, bottom-left to bottom-centre (x≈150-460, y≈260-800 of 1280×800) (c0538_08_fg_worker.png, pair_0500_0538_v4_08_dsd.png).
- **Problem:**
  - The camera is ≈0.5 m behind a worker; his torso and arms fill ~30% of the frame, his head is hidden under the card, and his legs are cut by the bottom bar. At 390 px it reads as a black blob behind the card.
  - His right hand holds a yellow jack ring at the bottom edge with **no jack body, forks or load visible**: a disembodied handle (the "vehicle without visible operator" problem in reverse: an operator without a visible vehicle).
  - The card says "the **DSD associate** checks it with the handheld scanner". At 05:00 a vest-wearing associate stood behind the vendor; at 05:38 he is gone. The "DSD associate · receiving" tag is now hidden behind the "Beverage vendor" tag (only "· receiving" shows) and both point at the vendor.
- **Fix:**
  - Move the camera ≥ 3 m back from any worker (or delete this foreground figure). If a second vendor/jack is wanted, frame the whole figure and the whole jack + skid outside the card.
  - Put the DSD associate back in frame (blue vest), facing the skid with a handheld scanner raised and aimed at a case.
  - Separate the two tags by ≥ 40 px and anchor each over its own person.

### BLOCKER-2 (still open, narrowed; already notified as item 5): Step 2 still doesn't show the wrap being cut, and the wrapped skid is mostly behind the card
- **File and region:** v4_02_breakdown.png, centre-left (x≈370-520, y≈260-560) (c0538_02_skid_worker.png).
- **Resolved this pass:** the tall skid now carries visible stretch film and is about 1.9 m (as tall as the worker, matching wrapped_skid_ref.jpg); an empty-pallet stack (5 high) is present under an "Empty pallets" sign; the jack is operated.
- **Still failing:**
  - About 60% of the wrapped skid (its whole left half and base) is behind the card. At 390 px the film is barely readable; the frame's hero object is the empty jack on the right instead.
  - The "breaking down" worker just rests one hand on the skid: no box cutter, no slit, no hanging film flap. The card's "cuts the wrap, and a partner sends the cases onto the roller" is not shown; no roller or partner is in frame.
  - A second, unwrapped 2-case skid sits directly in front of the wrapped one, and a bare-box skid is cut by the bottom-left corner: clutter that hides the subject.
  - Both pallets are black (MAJOR-2).
- **Fix:** Move the wrapped skid (and the camera target) to the right-centre third, clear of the card. Pose the worker with a cutter at a vertical slit, with a film flap hanging. Add the partner placing a case on the roller head at the frame edge. Remove the low skid in front.

### BLOCKER-11 (still open, narrowed; already notified 05:23): v4_09 still shows no unwrapping or counting
- **File and region:** v4_09_bev.png, centre (c0538_09_vendor_skid.png, c0538_09_receiver_hands.png) and right (c0538_09_right_skid.png).
- **Resolved this pass:** the vendor is no longer inside the skid; he stands ≈0.5 m clear holding the jack grip. The receiver is fully in frame (no longer cut by the edge/card).
- **Still failing:**
  - The card says "Every wrap comes off… the receiver cuts all the stretch wrap off, counts with the handheld". The receiver stands with his back to camera, one hand flat on the top layer; **no handheld, no cutter, no film** being removed. The step's action is not readable.
  - Both skids have a translucent "ghost" block around the bottom 2-3 layers and pallet (reads as glass, not film); on the right skid the case layers overhang each other and the pallet (MAJOR-22).
  - The receiver's feet are on the jack's fork-entry line, ≈0.1 m from the jack head the vendor is pulling (unsafe and visually crowded).
  - "Beverage vendor" and "DSD associate · receiving" tags are stacked and touch the card edge ("DSD" clipped by the card at 390 px).
  - The left skid reads ≈2.1-2.2 m, taller than the 1.75 m receiver (real beverage skids ≈1.5-1.8 m, bev_skid_1-4) (MINOR-24).
- **Fix:** Turn the receiver ¾ to camera, scanner in one hand aimed at a case, cutter in the other, with a cut film sheet hanging/pooled at the skid base (bev_skid_wrapped.jpg). Replace the ghost base with real film (or none). Put the tags on opposite sides. Cap skid height at ≈1.8 m.

### BLOCKER-4 (still open; already notified as item 1): One jack still has no real operator
- **Resolved this pass:** v4_02 (the puller now has his hand on the grip; the jack is empty but clearly being pulled). v4_05, v4_07, v4_08 (vendor), v4_09 (vendor), v4_10 (both visible drivers seated behind glazing) are OK.
- **Still failing:** **v4_11_pharm.png, centre-left (c0538_11_jack.png):** the associate now holds the ring with both hands, but the forks still run diagonally *alongside* the tote pallet's left edge (behind the card), not under it, so the pallet sits on the floor and the jack moves nothing.
- **Fix:** Rotate the jack so its forks go into the pallet's fork openings, and stand the associate in front of the handle in `jackPullPose`.
- Related: v4_08's floating jack ring is covered by BLOCKER-12.

### MAJOR-28 (still open, now also an appear/disappear defect): v4_06 "Filling the holes" shows no stocking, and the jack vanished
- **File and region:** v4_06_stock.png, centre (c0538_06_worker_skid.png).
- **Problem:**
  - Nobody takes a case off the skid or puts product on a shelf; no shelf has a visible hole. The worker walks toward the camera, arms down, away from the skid.
  - In v4_05 the Dept 46 skid is on an engaged yellow jack; in v4_06 the same skid sits in the aisle with **no jack** anywhere in frame. The skid also drops from ≈6 cases (v4_05) to 4 single cases, with no explanation.
  - The "Empty slots get filled" tag points at a full shelf.
- **Fix:** Keep the jack (lowered) under the skid. Show the worker at the shelf with an open case, placing product into a visible gap next to the tag. Keep the case count consistent with v4_05 (minus the case in his hands).

### MAJOR-29 (NEW; supersedes the residuals of BLOCKER-10): v4_10 labels contradict the step, plus an open cab shell
- **File and region:** v4_10_snack.png, centre and right (c0538_10_trucks.png, c0538_10_tags.png, c0538_10_right_cab.png).
- **Problem:**
  - Card: "A snack vendor backs in. The tractor-trailer reverses…". The only tractor-trailer in frame is decaled **"Beverage Vendor"**, while the "Snack vendor" tag sits on the red box truck (which is not a tractor-trailer). The reader can't tell which vehicle is the snack vendor.
  - The "Snack vendor truck" tag floats over an empty dock door, pointing at nothing.
  - The right-edge Walmart tractor cab is an open box shell (no glazing, driver barely visible), cut by the right edge and the nav dots.
  - No motion cue for "reverses slowly" (no reverse lights, no spotter).
- **Fix:** Decal the reversing vehicle "Snack vendor" (box truck like dsd_truck_red_box.jpg, or change the card to "box truck"), anchor one tag to it, and drop the floating door tag. Keep the beverage tractor-trailer out of this step or label it as such. Close the Walmart cab with glazing or frame it out. Add amber reverse lights.

### MAJOR-30 (NEW): Tags clipped by the frame edge or stacked, unreadable at 390 px
- **v4_02_breakdown.png, right edge (y≈130 and y≈255):** "Wrapped mixe…" and "Stocking 2 · pull…" are cut by the right edge and overlap the nav dots.
- **v4_08_dsd.png, centre:** "Beverage vendor" covers "DSD associate · receiving" (BLOCKER-12).
- **v4_09_bev.png, centre-left:** the same two tags stacked and touching the card (BLOCKER-11).
- **Fix:** Clamp tags to a 24 px safe area inside the frame and away from the nav rail, and run a collision pass (offset or hide the lower-priority tag).

### MAJOR-25 (still open): A white horizontal bar crosses dock-door openings
- v4_01_truck.png: across the trailer mouth, with a case resting on it.
- v4_08_dsd.png: the left and centre doors (still visible above the foreground worker).
- v4_13_omni.png: the right door.
- **Fix:** Roll each door fully into its header, or remove the bar.

### MAJOR-22 (still open, improved colours): Beverage skids still read as toy bricks
- **Files and regions:** v4_09_bev.png, centre and right (c0538_09_right_skid.png); v4_08_dsd.png, centre and right; v4_16, right edge.
- **Improved:** the palette is now muted dark green, maroon, navy, white and grey (no more lime/purple).
- **Still:** stud-topped slabs with no can/bottle tops, a translucent ghost block around the bottom layers and pallet, layers overhanging each other and the pallet (right skid in v4_09).
- **Fix:** Can/bottle-top texture instead of studs, printed bands and carton seams, all layers seated within the pallet footprint (bev_skid_1-4.jpg).

### MAJOR-21 (still open, changed): The camera clips or the card hides foreground workers
- **Resolved:** v4_09 (receiver now fully in frame).
- **Moved to BLOCKER-12:** v4_08's foreground giant.
- **Still open:**
  - v4_01_truck.png, bottom-right (c0538_01_fg_worker.png): a new worker's head and shoulders appear, cut by the bottom bar and under the nav buttons, beside a wrapped skid cut by the right edge.
  - v4_03_roller.png, bottom-centre: the foreground carrier is cut at the shins by the bottom bar.
  - v4_05_floor.png, right: the puller is half hidden behind the gondola end panel.
- **Fix:** Keep the camera ≥ 1.5 m from workers; keep people whole and outside the card and nav-button rectangles.

### MAJOR-1 (still open): Trailers are roofless cutaways
v4_18_overview, v4_desktop and v4_phone (open-top Walmart trailers showing their loads). Fix: close the roofs, and show the load through the open rear doors instead.

### MAJOR-2 (still open): Black pallets remain
v4_02 (all three skids), v4_04 (most department skids), v4_05 and v4_06 (the Dept 46 skid, black with yellow/teal), v4_14 (left), v4_18/desktop (empty black pallets near the docks), v4_02 empty-pallet stack (black/red). Fix: natural, CHEP blue or red wood everywhere.

### MAJOR-5 (still open): Toy-block products and unidentified monoliths
- v4_05 foreground gondola (now full-height in frame): orange, purple and blue solid blocks ≈0.5 m each.
- v4_06 gondolas and v4_18: solid-colour bricks.
- v4_14: garment slabs with no hangers.
- v4_12, bottom-left: a lone kraft slab about 1.5 m tall in the foreground.
- v4_18 and desktop: the red and blue 1.5-2 m monoliths.

### MAJOR-8 (still open): Interpenetration and floating objects
- **v4_14_fashion.png, centre:** the worker is inside the garments, and the Z-racks cross at a shared upright.
- **v4_15_claims.png, centre:** the shelf boards still run through the cage uprights with no uprights of their own; the lower row of 3 cases hangs in air below the middle shelf.
- **Fix:** Separate the racks, and move the worker to the open end. Put the shelving inside the cage on its own uprights, and seat every case on a board.

### MAJOR-9 (still open): Too empty compared with backroom_1/2
- No people in v4_13 (4 totes only) or v4_17; v4_16 has one figure at the far bottom-right edge.
- v4_11: one pallet in a white void.
- v4_15: 6 cases.
- **Fix:** Populate each step with the people and objects its card names.

### MAJOR-10 (still open): Phone and 390 px legibility
- v4_17's room plaques ("Training room", "Lunch room", "Sick room", "Cleaning") are illegible at 390 px.
- v4_16's "Cleaning" and wall signs are illegible.
- v4_18 wall signs and the desktop Cooler/Freezer area are at the limit.
- v4_phone: the "Stocking 2 · sorting by dept" tag runs to the right screen edge.
- **Fix:** Larger plaques, a 24 px safe area, and render each step at 390×844.

### MAJOR-11 (still open): Step labels don't match the rail
- v4_08 and v4_10 both say "STEP 7"; v4_13, v4_14 and v4_15 all say "STEP 8".
- v4_07 ("FROZEN & DAIRY"), v4_09 ("DSD · COUNTING"), v4_11 ("PHARMACY"), v4_12 ("MORNING PRE-OP", mid-night), v4_16 ("STAIRS") and v4_17 ("UPSTAIRS") have no number.
- **Fix:** Number 1-18 to match the file NN, and move pre-op to the start or end of the story.

### MAJOR-12 (still open): Aerial dollhouse landing
v4_desktop.png, v4_phone.png and v4_18_overview.png (unchanged).

### MAJOR-26 (still open, unchanged): The v4_16 stairs step is poorly composed
v4_16_stairs.png: the bottom ~40% is the black dock-door header and the receiving desk; only the upper flight shows; nobody is on the stairs. Fix: camera on the floor near the stair foot looking up, header out of the foreground, a climbing worker.

### MINOR-1: The card hides the subject
- v4_02: ~60% of the wrapped skid (BLOCKER-2).
- v4_05: the skid's left half.
- v4_07: a milk skid and most of the jacked skid.
- v4_11: the jack's forks.
- v4_12: the compactor.
- v4_15: the worker's torso.

### MINOR-2: Card promises that aren't shown
- v4_02: no cutting, no partner/roller (BLOCKER-2).
- v4_06: no case off the skid, no product on the shelf (MAJOR-28).
- v4_08: no handheld check (BLOCKER-12).
- v4_09: no cutting and no handheld count (BLOCKER-11).
- v4_10: "the vendor pulls a skid out" not shown (acceptable as a later beat) and no reversing cue (MAJOR-29).
- v4_12: nobody loads the baler.

### MINOR-3: Idle poses
- v4_06: the worker walks away from the skid, arms down.
- v4_12: the worker stands facing the camera with his arms down in front of the open baler.
- v4_15: the worker isn't scanning.
- v4_04: the right-hand sorter stands with his arms down.

### MINOR-4: Tag collisions
- v4_desktop: "Stocking 2 · sorting by dept" covers "Gravity roller".
- v4_14: "Z-racks" and "Fashion · hanging apparel" overlap.
- v4_12: the "Baler" tag covers the "Cardboard baler" sign.
- (v4_02, v4_08, v4_09: see MAJOR-30.)

### MINOR-5 to MINOR-10 and MINOR-13 to MINOR-15: parts-sheet items, unchanged
- MINOR-5: driver tiles show "? × ? × ?".
- MINOR-6 (partly resolved): v4_models_final.png is still a duplicate of v4_models.png (same size 5029936 B).
- MINOR-7: the stale worker and truck tests.
- MINOR-8: the pop skid's black cones.
- MINOR-9: the compactor decal confetti.
- MINOR-10: the driver tiles can't show the drivers.
- MINOR-13: the McKesson tote strap.
- MINOR-14: the egg film highlights.
- MINOR-15: impossible crate dates.

### MINOR-12 (still open): The pharmacy wrap reads as a glass cabinet
v4_11_pharm.png (c0538_11_jack.png): beaded vertical posts and rims, and the film box extends about 0.4 m above the top cartons. Fix: use the wrappedSkid film, shrunk to the load.

### MINOR-16: Unidentified grey planks lie flat
v4_18_overview.png, centre-right, beside the monoliths (unchanged).

### MINOR-17 (partly resolved): The cardboard bale
Bales are in v4_12 (unchanged). cardboardBale.png is still a mostly blank canvas, and the rightmost bale touches the claims-cage fence line.

### MINOR-18: The straight-stairs test variant floats
floor1_test.png. Unchanged; not used in the scene.

### MINOR-19 (partly resolved): v4_17 upstairs framing
The "1st flo…" floor sign is still cut by the bottom bar, the division shelving is cut by the right edge, and there are no people.

### MINOR-20 (still open): The v4_12 card is a 5-bullet checklist
v4_12_baler.png, card: a 5-item checklist panel, the tallest card in the set. Fix: one sentence, plus a worker pressing the baler's stop button.

### MINOR-22 (partly resolved): v4_05 residuals
- **File and region:** v4_05_floor.png, top-centre and right (c0538_05_worker_jack.png).
- **Resolved:** the background is now a sales-floor gondola end, not the backroom compactor wall.
- **Still:** the "Stocking 3 · Dept 46 skid (1 person)" tag floats ≈1 m above the skid near the top bar; the puller is half occluded by the gondola end; the pallet is black/yellow; the left half of the skid is under the card.
- **Fix:** Anchor the tag just above the skid; swing the camera ≈15° left so the puller is fully visible in the aisle mouth; natural or CHEP pallet.

### MINOR-23 (still open): v4_07 residuals
v4_07_milk.png, right half: the two middle milk skids touch with zero gap; the front-right skid is cut by the bottom bar and the nav buttons; the wrapped egg pallet reads taller than the worker in front of it (> 1.9 m vs real ≈1.5-1.8 m, egg_case_1/2); only 4 of the card's 5 milk skids are clearly visible (one partly behind the card). Fix: ≥ 0.2 m gaps, pull the camera back/up ≈10%, cap the egg pallet at ≈1.7 m.

### MINOR-24 (NEW): v4_09 beverage skid too tall
v4_09_bev.png, centre: the jacked skid reads ≈2.1-2.2 m against the ≈1.75 m receiver standing just in front of it. The same model in v4_08 reads ≈1.8 m. Fix: cap DSD beverage skids at ≈1.8 m (bev_skid_1-4.jpg) and check the v4_09 camera FOV/scale.

## Status of previous findings (05:23 review → 05:44)
| ID | Status at 05:44 |
|---|---|
| BLOCKER-1 news/data clutter | **Closed (per user exception)**: the News chip is collapsed in all 20 stills, and the v4_18 routechip is a collapsed pill inside the card; neither is open or covers the scene. Re-open if any still shows either expanded. (Already notified as item 4.) |
| BLOCKER-2 no wrapped skid / breakdown process | **Open, narrowed (already notified)**: film now present and skid ≈1.9 m, pallet stack present; still no cutting, no partner/roller, skid ~60% behind the card |
| BLOCKER-4 no operators | **Open, narrowed (already notified)**: v4_02 resolved; still failing in v4_11 (forks beside the pallet) |
| BLOCKER-10 v4_10 grille close-up | **Resolved** (docks, both vendor trucks and seated drivers in frame; residuals → MAJOR-29) |
| BLOCKER-11 v4_09 vendor in skid, no counting | **Open, narrowed (already notified 05:23)**: embedding fixed and receiver in frame; still no unwrapping/handheld count, ghost film base, stacked tags |
| BLOCKER-12 v4_08 foreground giant, associate gone | **NEW, not yet notified** |
| BLOCKER-3, 5, 7, 8, 9 / MAJOR-3, 4, 6, 7, 14-20, 23, 24, 27 | Remain resolved or superseded |
| MAJOR-28 | **Open, worse** (jack vanished between v4_05 and v4_06) |
| MAJOR-22 | **Open, improved** (muted palette; studs, ghost base, overhang remain) |
| MAJOR-21 | **Open, changed** (v4_09 resolved; v4_08 → BLOCKER-12; v4_01 new; v4_03, v4_05 remain) |
| MAJOR-1, 2, 5, 8, 9, 10, 11, 12, 25, 26 | **Open** (MAJOR-8: v4_09 part resolved) |
| MINOR-22 | **Partly resolved** (now at a gondola) |
| MINOR-11 | Folded into MAJOR-29 |
| MINOR-1 to 5, 7 to 10, 12 to 16, 18, 20, 23 | **Open** |
| MINOR-6, 17, 19 | **Partly resolved**, unchanged |
| New this pass | **BLOCKER-12**, MAJOR-29, MAJOR-30, MINOR-24 |

## Blockers already notified to Soros (for dedupe)
From the 03:17 EDT review:
1. Vehicles have no drivers or operators (BLOCKER-4): **still open** (v4_11 only)
2. No scene render (resolved)
3. Cartoon mannequin worker (resolved)

From the 03:31 EDT review:

4. Dashboard and news clutter (BLOCKER-1): **closed at 05:38 per the user's chip exception** (chips collapsed in every still)
5. No stretch-wrapped skids / breakdown process (BLOCKER-2): **still open, narrowed** (film now present; cutting/partner not shown)
6. Capsule people (resolved)
7. Blank first frame (resolved)
8. Skid and worker vanish between steps 5 and 6 (was MAJOR-18): resolved as such. Note: the **jack** now vanishes between v4_05 and v4_06 (MAJOR-28).

Handed off at about 04:44 EDT (treated as notified):

9. BLOCKER-8: v4_05 subject hidden. Resolved at 05:00.
10. BLOCKER-9: v4_07 cooler almost empty. Resolved at 05:00.

Handed off at about 05:23 EDT (treated as notified):

11. BLOCKER-10: v4_10 grille close-up. **Resolved at 05:38.**
12. BLOCKER-11: v4_09 vendor embedded in skid / no counting. **Still open, narrowed** (embedding fixed).

Not notified and not needed: BLOCKER-7 (resolved before notification).

**NEW, open blockers NOT yet notified (the caller handles notification; not marked as notified here):**
- **BLOCKER-12:** v4_08_dsd.png, bottom-left/centre. A headless foreground worker (head under the card) fills ~30% of the frame holding a floating jack ring with no jack visible, and the DSD associate who should check with the handheld is gone (his tag hidden under "Beverage vendor"). Fix: pull the camera ≥ 3 m back or remove the figure, put the vest-wearing associate back in frame scanning the skid, and separate the two tags.

## Counts
- **BLOCKER (open): 4.** BLOCKER-2, -4 and -11 are already notified (all narrowed). **New and not yet notified: 1** (BLOCKER-12). Resolved/closed this pass: BLOCKER-10 (resolved), BLOCKER-1 (closed per the user's chip exception).
- **MAJOR (open): 15.** MAJOR-1, 2, 5, 8, 9, 10, 11, 12, 21, 22, 25, 26, 28, plus the new 29 and 30.
- **MINOR (open): 23.** MINOR-1 to -10, -12 to -20, -22 (partial), -23, plus the new -24 (MINOR-11 folded into MAJOR-29; MINOR-21 superseded; MINOR-6, -17, -19 partial).
- **Files changed during the review:** none (the start and end listings are identical, and `find -newer` returned nothing).

## Notification handoff (05:46 EDT)
BLOCKER-12 (v4_08_dsd) was handed to trax for delivery to Soros at about 05:46 EDT. Treat it as notified for dedupe.
