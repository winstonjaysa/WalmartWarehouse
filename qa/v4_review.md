# v4 visual/UX review: full scene renders (verdict: FAIL; 3 open BLOCKERs, all already notified; NO new un-notified blockers; BLOCKER-12 resolved)

Reviewer: QA (read-only; only qa/ was written; nothing committed). Updated Sat 2026-10-31, about 06:00 EDT (America/Toronto). This covers the **05:49:39 EDT** renders and supersedes the 05:44 version (which covered 05:38:36), backed up at `qa/v4_artefacts/v4_review_0538_backup.md` (older backups: `v4_review_0523_backup.md`, `_0444_`, `_0433_`, `_0408_`, `_0346_`, `_0331_`).

**Notification state (carried over; see the bottom section for detail).**
- Already notified to Soros: BLOCKER-1 (closed), BLOCKER-2 (open), BLOCKER-4 (open), BLOCKER-7/8/9/10 (resolved), BLOCKER-11 (open).
- BLOCKER-12: the 05:44 header said "new, not yet notified"; a footer note in the same file says it was handed to trax for Soros at about 05:46 EDT. Per the caller's instruction it is treated here as **not confirmed notified**. It is now **resolved** (05:49 render), so it no longer needs notification. If the 05:46 handoff did go out, a "resolved" follow-up would be enough.
- **Open blockers not yet notified: none.**

**Scope.** `ls -la --time-style=full-iso` of preview/v4_*.png, parts/v4/preview/ and v4/ was taken at the start (05:54:20 EDT, `qa/v4_artefacts/ls_start_0549.txt`) and the end (05:59:40 EDT, `ls_end_0549.txt`). The two are identical (`diff` empty), and `find -newer preview/v4_phone.png` over preview/, parts/v4/ and v4/ returned nothing, so **nothing changed during this review**. All 20 `preview/v4_*.png` were re-rendered together at 05:49:39.94-.96. They are newer than the latest source (a7_ui.js 05:48:40.06, main.js 05:48:40.10, out.js 05:48:40.13, news.json 05:48:40.74). Since 05:38, only a7_ui.js, main.js, out.js and news.json changed (a1-a6 unchanged; a5_brains.js still 05:36:38). **parts/v4/preview is verified unchanged since 04:24:54** (dir mtime 04:24:54.121, newest PNG cardboardBale_crop.png 04:24:54.21), so the parts findings carry over unchanged.

**Method.**
- Every changed image was viewed at full size and as a 390 px-wide copy (`qa/v4_artefacts/*_0549_390w.png`, contact sheet `sheet_0549_390w.png`), plus 1.2-5x crops (`c0549_*`) and side-by-side 0538|0549 pairs at 2x of the 390 px copies (`pair_0538_0549_*.png`).
- Each 0549 390 px copy was diffed against the 0538 390 px copy (threshold 24/255; masks `diff_0538_0549_*.png`):
  - Big changes: v4_08 (43%), v4_06 (38%), v4_02 (23%), v4_05 (22%).
  - Moderate: v4_07 (7.5%), v4_phone (5.3%), v4_11 (4.5%), v4_03 (4.4%).
  - ≤ 2.6% (animation jitter or tag moves only): v4_15, 14, 09 (tag change, see BLOCKER-11), 04, 13, desktop (tag re-layout), 01, 12, 16, 10, 18, 17.
- Content was checked against the ref/ photos (backroom_1/2, wrapped_skid_ref, bev_skid_1-4/wrapped, dsd_truck_*, egg_case_*, milk_crates_cooler, mckesson_tote_*, cardboard_bale, pop_skid_*). Style was judged only against ref/reel f01-f06 (`reel_sheet_0538.png`, re-used: a bright, clean, low-poly miniature diorama). Toy-like, low-poly and faceless styling is **not** penalised.
- The collapsed "News" chip and the "route" chip are intentional. They are collapsed in all 20 stills, and neither is open or covers the scene.

## What changed 05:38 → 05:49 (summary)
- **v4_08 (fixed): BLOCKER-12 resolved.**
  - The headless foreground giant and the floating jack ring are gone. The camera is pulled back to a clean ¾ view of three dock doors, the beverage vendor truck, the receiving desk and the skid.
  - The vendor (black uniform) pulls the skid with his hand on the jack grip.
  - The DSD associate (blue vest) is back, facing the skid, with both hands on the cases and a small black handheld.
  - The "Beverage vendor" and "DSD associate · receiving" tags are now side by side, not stacked.
  - Residuals: see MINOR-25 (new).
- **v4_02 (much improved; BLOCKER-2 narrowed again).**
  - The ≈1.9 m stretch-wrapped skid is now centre frame, clear of the card. The film is readable at 390 px, and the worker stands at its side with his hands on it.
  - Both tags are inside the frame (MAJOR-30's v4_02 part is resolved).
  - Still missing: no visible cut or film flap, the roller is behind the card, there's no partner, and a low bare-box skid in front hides the wrapped skid's base.
- **v4_05 (improved and regressed).**
  - The puller is now fully visible, with his hand on the grip and the forks under the pallet (MAJOR-21's v4_05 part is resolved).
  - But the background is the **backroom trash compactor** wall again, although this is the "To the sales floor" step (MINOR-22 regressed).
  - The tag still floats about 1.5 m above the skid against the top bar.
- **v4_06 (re-framed, still failing; MAJOR-28 open).**
  - Higher camera. The worker now stands beside the 4-case skid, arms down, facing the camera.
  - A second worker stands idle behind the left gondola next to a case lying on a shelf.
  - Still nobody puts product on a shelf, and still **no jack** under the skid.
- **v4_09 (tag change only).** The "Beverage vendor" tag was removed. The "DSD associate · receiving" tag remains, with its "D" clipped by the card. The receiver raises one hand to the top layer, but there is still no film removal and no readable handheld (BLOCKER-11 open).
- **v4_11 (worse labelling).** A new "Pharmacy pallet · jack to pharmacy" tag sits on the top bar and **covers the associate's head**. The jack forks still run beside the pallet, not under it (BLOCKER-4 open).
- **v4_phone / v4_desktop (tag re-layout).**
  - Phone: "Stocking 2 · sorting by dept" no longer runs off the right edge (MAJOR-10's phone part is resolved). The tags are now a 3-pill stack (Stocking 2 / Department skids / Gravity roller) that covers the sort area.
  - Desktop: "Stocking 2" no longer covers "Gravity roller" (MINOR-4's desktop part is resolved).
- **v4_14:** the "Z-racks" and "Fashion · hanging apparel" tags are now separated (MINOR-4's v4_14 part is resolved).
- **v4_07:** the tag moved over the puller; the rest is unchanged.
- **v4_01, 03, 04, 10, 12, 13, 15-18:** substantively unchanged.

## Files reviewed (EDT, -04:00; identical at the start 05:54:20 and the end 05:59:40)
| Path | mtime | Size (B) | Notes |
|---|---|---|---|
| preview/v4_01_truck.png | 2026-10-31 05:49:39.940685355 | 240490 | Unchanged; MAJOR-21, MAJOR-25 |
| preview/v4_02_breakdown.png | 2026-10-31 05:49:39.940685355 | 423351 | Wrapped skid now clear; BLOCKER-2 narrowed |
| preview/v4_03_roller.png | 2026-10-31 05:49:39.940685355 | 482388 | Minor re-pose |
| preview/v4_04_sort.png | 2026-10-31 05:49:39.944685522 | 797397 | Unchanged |
| preview/v4_05_floor.png | 2026-10-31 05:49:39.944685522 | 202368 | Puller visible; compactor background (MINOR-22 regressed) |
| preview/v4_06_stock.png | 2026-10-31 05:49:39.944685522 | 308870 | Re-framed; still no stocking or jack (MAJOR-28) |
| preview/v4_07_milk.png | 2026-10-31 05:49:39.948685689 | 385260 | Tag moved |
| preview/v4_08_dsd.png | 2026-10-31 05:49:39.948685689 | 416967 | **Fixed (BLOCKER-12 resolved)**; MINOR-25 |
| preview/v4_09_bev.png | 2026-10-31 05:49:39.948685689 | 371218 | Vendor tag removed; BLOCKER-11 open |
| preview/v4_10_snack.png | 2026-10-31 05:49:39.952685856 | 185030 | Unchanged; MAJOR-29 |
| preview/v4_11_pharm.png | 2026-10-31 05:49:39.952685856 | 289091 | New tag covers the head; forks beside the pallet |
| preview/v4_12_baler.png | 2026-10-31 05:49:39.952685856 | 391229 | Unchanged |
| preview/v4_13_omni.png | 2026-10-31 05:49:39.956686023 | 268130 | Unchanged |
| preview/v4_14_fashion.png | 2026-10-31 05:49:39.956686023 | 278390 | Tags separated |
| preview/v4_15_claims.png | 2026-10-31 05:49:39.956686023 | 306752 | Unchanged |
| preview/v4_16_stairs.png | 2026-10-31 05:49:39.960686190 | 316832 | Unchanged |
| preview/v4_17_upstairs.png | 2026-10-31 05:49:39.960686190 | 171830 | Unchanged |
| preview/v4_18_overview.png | 2026-10-31 05:49:39.960686190 | 572331 | Unchanged; routechip collapsed |
| preview/v4_desktop.png | 2026-10-31 05:49:39.964686357 | 541960 | Tag re-layout |
| preview/v4_phone.png | 2026-10-31 05:49:39.964686357 | 161240 | 390×844; tag re-layout |
| parts/v4/preview/ (dir) | 2026-10-31 04:24:54.121188619 | 4096 | Verified unchanged |
| parts/v4/preview/v4_models.png / v4_models_final.png | 04:24:30.361192377 / 04:24:32.981192083 | 5029936 / 5029936 | Unchanged; still duplicates |
| parts/v4/preview/cardboardBale.png / _crop.png | 04:24:17.997193349 / 04:24:54.213188599 | 181649 / 530536 | Unchanged |
| parts/v4/preview/floor1_test.png | 04:18:02.996798021 | 1367722 | Unchanged |
| parts/v4/preview/trucks_test.png / worker_test.png | 03:29:27.141933867 / 03:29:28.501931454 | 261755 / 286503 | Unchanged (stale) |
| v4/a7_ui.js / main.js / out.js / news.json | 05:48:40.064 / 05:48:40.104 / 05:48:40.128 / 05:48:40.740 | 13447 / 121578 / 232242 / 1991 | Changed since 05:38 (not read; listing only) |
| v4/a1-a6 *.js, body.html, style.css | ≤ 05:36:38.266 | n/a | Unchanged since 05:38 |

New artefacts in qa/v4_artefacts/ (all tagged 0549):
- `v4_review_0538_backup.md`, `ls_start_0549.txt`, `ls_end_0549.txt`.
- 390 px copies: `*_0549_390w.png` (20 files) and `sheet_0549_390w.png`.
- Diff masks: `diff_0538_0549_*.png` (20 files).
- Pairs: `pair_0538_0549_{v4_01,02,03,04,05,06,07,08,09,10,11,12,13,14,15,16,18,desktop,phone}*.png`.
- Crops: `c0549_02_skid_cutter`, `c0549_02_hand`, `c0549_02_right_jack`, `c0549_02_left_roller`, `c0549_05_bg`, `c0549_05_jack_skid`, `c0549_06_left_worker`, `c0549_06_worker_skid`, `c0549_08_vendor_assoc`, `c0549_08_assoc`, `c0549_08_left`, `c0549_08_bg_door`, `c0549_08_fgskid`, `c0549_09_receiver`, `c0549_10_tags`, `c0549_11_jack`.
- (`c0549_08_associate.png` / `c0549_08_fg_skid.png` are mis-cropped and can be ignored.)

## Findings (worst first)

### BLOCKER-11 (still open, unchanged in substance; already notified 05:23): v4_09 still shows no unwrapping or counting
- **File and region:** v4_09_bev.png, centre (x≈420-660, y≈280-600 of 1280×800) (c0549_09_receiver.png).
- **Problem:**
  - The card says "the receiver cuts all the stretch wrap off, counts with the handheld". The receiver stands with his back to the camera and one hand raised to the top layer. There is **no visible handheld, no cutter, and no film** being removed or lying on the floor. The step's action is not readable at full size or at 390 px.
  - Both skids still have a translucent "ghost" block around the bottom 2-3 layers and the pallet (it reads as glass). The right skid's layers overhang each other and the pallet (MAJOR-22).
  - The receiver's feet are on the jack's fork line, about 0.1 m from the jack head the vendor is holding.
  - The "Beverage vendor" tag was removed this pass. The remaining "DSD associate · receiving" tag is clipped by the card ("D" cut off) and points at the skid top, not the receiver.
  - The left skid reads about 2.1 m, taller than the receiver (MINOR-24).
- **Fix:**
  - Turn the receiver ¾ to the camera, with a scanner in one hand aimed at a case and a cutter in the other.
  - Show a cut film sheet hanging or pooled at the skid base (bev_skid_wrapped.jpg).
  - Replace the ghost base with real film (or none).
  - Move the tag ≥ 24 px clear of the card and anchor it over the receiver's head.
  - Cap skid height at about 1.8 m.

### BLOCKER-4 (still open; already notified as item 1): The v4_11 jack still moves nothing
- **File and region:** v4_11_pharm.png, centre-left (x≈380-720, y≈50-560) (c0549_11_jack.png).
- **Problem:** The associate now pulls the grip with one hand. But the forks still run diagonally *alongside* the tote pallet's left edge, partly behind the card, not under it. The wrapped pallet sits on the floor, so the jack is pulling nothing.
- **Fix:** Rotate and translate the jack so its forks enter the pallet's fork openings (the pallet should sit on the forks). Keep the associate in `jackPullPose` in front of the handle.
- Resolved elsewhere: v4_02, 05, 07, 08 (vendor and the jack in the left door), 09 (vendor) and 10 (seated drivers) are OK.

### BLOCKER-2 (still open, narrowed again; already notified as item 5): Step 2 still doesn't show the wrap being cut or the cases going to the roller
- **File and region:** v4_02_breakdown.png, centre (x≈460-680, y≈270-560) (c0549_02_skid_cutter.png, c0549_02_hand.png) and left edge (c0549_02_left_roller.png).
- **Resolved this pass:**
  - The wrapped ≈1.9 m skid is centre frame and fully clear of the card. The film is readable at 390 px, and its height matches the worker (wrapped_skid_ref.jpg).
  - The tags are inside the frame.
  - The empty-pallet stack sits next to the jack puller.
- **Still failing:**
  - The worker rests both hands on the film. There is no cutter, slit or hanging flap, so "cuts the wrap" is not shown.
  - The gravity roller is behind the card at the far left (only its legs show under the card), and there is no partner. "A partner sends the cases onto the roller" is not shown.
  - A low 2-layer bare-box skid sits directly in front of the wrapped skid and hides its base and pallet. A third bare-box skid in the bottom-left foreground is clutter.
  - The "Empty pallets" wall sign is about 250 px left of the stack it labels. The stack is black/red (MAJOR-2) and is cut by the nav dots.
- **Fix:**
  - Pose the worker with a cutter at a vertical slit, with a film flap hanging.
  - Swing the camera about 20° left (or move the roller right) so the roller head and a partner placing a case on it are visible outside the card.
  - Delete the low skid in front of the wrapped one.
  - Move the sign above the stack.

### MAJOR-28 (still open): v4_06 "Filling the holes" shows no stocking, and the jack vanished
- **File and region:** v4_06_stock.png, centre (x≈560-800, y≈260-620) (c0549_06_worker_skid.png) and left (c0549_06_left_worker.png).
- **Problem:**
  - The main worker stands beside the 4-case skid, arms down, facing the camera.
  - The second worker stands idle behind the left gondola. A lone case lies on the shelf under the "Empty slots get filled" tag with nobody touching it.
  - No product goes onto a shelf, and no shelf has a visible gap being filled.
  - The v4_05 jack is still absent under the same skid (the appear/disappear defect).
  - The case count drops from about 6 (v4_05) to 4.
  - Black pallet (MAJOR-2).
- **Fix:**
  - Keep the jack (lowered) under the skid.
  - Pose the main worker at the shelf with an open case, placing product into a visible gap under the tag.
  - Give the second worker a case in his hands, or remove him.
  - Keep the case count consistent with v4_05.

### MAJOR-29 (still open, unchanged): v4_10 labels contradict the step, plus an open cab shell
- **File and region:** v4_10_snack.png, centre and right (c0549_10_tags.png).
- **Problem:**
  - The card says "A snack vendor backs in. The tractor-trailer reverses…". The only tractor-trailer is decaled **"Beverage Vendor"**, while the "Snack vendor" tag sits on the red box truck.
  - The "Snack vendor truck" tag floats over an empty door.
  - The right-edge Walmart cab is an open shell cut by the edge and the nav dots.
  - There is no reversing cue.
- **Fix:**
  - Decal the reversing vehicle "Snack vendor" (or change the card to "box truck").
  - Anchor one tag to it and drop the floating tag.
  - Close or frame out the Walmart cab.
  - Add amber reverse lights.

### MAJOR-30 (still open, changed): Tags clipped by the frame, the card or the top bar, or covering people
- **Resolved:** v4_02 (both tags now inside the frame) and v4_08 (tags side by side).
- **Still open / new:**
  - **v4_11_pharm.png, top-centre (x≈255-510, y≈50-75), NEW:** the "Pharmacy pallet · jack to pharmacy" tag butts against the top bar and **covers the associate's head**.
  - **v4_09_bev.png, centre-left (x≈415-590, y≈280-300):** "DSD associate · receiving" is clipped by the card.
  - **v4_phone.png, centre-right (y≈220-300):** three pills stacked (Stocking 2 / Department skids / Gravity roller) cover the sort area they label.
- **Fix:** Clamp tags to a 24 px safe area away from the top bar, card and nav rail. Never draw a tag over a person's head (offset it above). Cap the phone view at 2 visible tags, or fan them out.

### MAJOR-25 (still open): A white horizontal bar crosses dock-door openings
- v4_01_truck.png: across the trailer mouth, with a case resting on it.
- v4_08_dsd.png: the left, centre and right door openings (y≈230-260), now fully visible since the camera pulled back. The left-door jack worker walks "through" it.
- v4_13_omni.png: the right door.
- **Fix:** Roll each door fully into its header, or remove the bar.

### MAJOR-22 (still open): Beverage skids still read as toy bricks
- **Files and regions:** v4_09_bev.png, centre and right; v4_08_dsd.png, centre and bottom-left (c0549_08_fgskid.png); v4_16, right edge.
- **Problem:** stud-topped slabs with no can or bottle tops, a translucent ghost block around the bottom layers and the pallet, and layers overhanging each other and the pallet.
- **Fix:** Use can/bottle-top texture, printed bands and carton seams, and seat all layers within the pallet footprint (bev_skid_1-4.jpg).

### MAJOR-21 (still open, narrowed): The camera clips, or the card hides, foreground workers
- **Resolved:** v4_05 (the puller is fully visible), v4_08 (the giant is gone), v4_09.
- **Still open:**
  - v4_01_truck.png, bottom-right: a worker's head and shoulders are cut by the bottom bar and under the nav buttons, next to a wrapped skid cut by the right edge.
  - v4_03_roller.png, bottom-centre: the foreground carrier is cut at the shins by the bottom bar.
- **Fix:** Keep the camera ≥ 1.5 m from workers, and keep people whole and outside the card and nav-button rectangles.

### MAJOR-1 (still open): Trailers are roofless cutaways
v4_18_overview, v4_desktop and v4_phone show open-top Walmart trailers with their loads visible. Fix: close the roofs, and show the load through the open rear doors instead.

### MAJOR-2 (still open): Black pallets remain
- v4_02: the two bare-box skids and the empty-pallet stack (black/red).
- v4_04: most department skids.
- v4_05 and v4_06: the Dept 46 skid (black with yellow/teal).
- v4_14: left.
- v4_18/desktop: the empty pallets near the docks.
- (v4_08 and v4_09 beverage pallets are blue: OK.)
- **Fix:** natural, CHEP blue or red wood everywhere.

### MAJOR-5 (still open): Toy-block products and unidentified monoliths
- v4_05, right foreground gondola: orange, purple and blue solid blocks of about 0.5 m each.
- v4_06 gondolas and v4_18: solid-colour bricks.
- v4_14: garment slabs with no hangers.
- v4_12, bottom-left: a lone kraft slab about 1.5 m tall.
- v4_18 and desktop: the red and blue 1.5-2 m monoliths.

### MAJOR-8 (still open): Interpenetration and floating objects
- **v4_14_fashion.png, centre:** the worker stands inside the garments, and the Z-racks cross at a shared upright.
- **v4_15_claims.png, centre:** the shelf boards run through the cage uprights with no uprights of their own, and the lower row of cases hangs in air.
- **Fix:** Separate the racks and move the worker to the open end. Put the shelving inside the cage on its own uprights, and seat every case on a board.

### MAJOR-9 (still open): Too empty compared with backroom_1/2
- v4_13 (4 totes, no people) and v4_17 have no people. v4_16 has one figure at the far bottom-right edge.
- v4_11: one pallet in a white void.
- v4_15: 6 cases.
- **Fix:** Populate each step with the people and objects its card names.

### MAJOR-10 (still open, narrowed): Phone and 390 px legibility
- **Resolved:** v4_phone's "Stocking 2" tag no longer runs off the edge.
- **Still open:**
  - v4_17's room plaques and v4_16's wall signs are illegible at 390 px.
  - v4_18 wall signs and the desktop Cooler/Freezer area are at the limit.
  - v4_08's DSD associate's handheld is a few pixels at 390 px (MINOR-25).
- **Fix:** Larger plaques, a 24 px safe area, and render each step at 390×844.

### MAJOR-11 (still open): Step labels don't match the rail
- v4_08 and v4_10 both say "STEP 7"; v4_13, v4_14 and v4_15 all say "STEP 8".
- v4_07, 09, 11, 12 ("MORNING PRE-OP", mid-night), 16 and 17 have no number.
- **Fix:** Number 1-18 to match the file NN, and move pre-op to the start or end of the story.

### MAJOR-12 (still open): Aerial dollhouse landing
v4_desktop.png, v4_phone.png and v4_18_overview.png (unchanged).

### MAJOR-26 (still open, unchanged): The v4_16 stairs step is poorly composed
v4_16_stairs.png: the bottom ~40% is the dock-door header and the receiving desk, and nobody is on the stairs. Fix: put the camera at the stair foot looking up, and add a climbing worker.

### MINOR-22 (regressed): The v4_05 "To the sales floor" step is set in the backroom
- **File and region:** v4_05_floor.png, top-left (x≈0-330, y≈50-300) (c0549_05_bg.png) and top-centre.
- **Resolved:** the puller is fully visible and the forks are under the pallet.
- **Regressed:** the background is again the backroom "Trash compactor" wall, with the compactor, the roller and a worker. The sales-floor gondola appears to stand inside the backroom.
- **Still:** the "Stocking 3 · Dept 46 skid (1 person)" tag floats about 1.5 m above the skid against the top bar. Black/yellow pallet.
- **Fix:** Point the camera down a sales-floor aisle (gondolas both sides, no compactor), anchor the tag just above the skid, and use a natural or CHEP pallet.

### MINOR-25 (NEW; residuals of resolved BLOCKER-12): v4_08 polish
- **File and region:** v4_08_dsd.png (c0549_08_assoc.png, c0549_08_fgskid.png, c0549_08_left.png).
- **Problem:**
  - The associate's handheld is a tiny dark sliver against the cases and is unreadable at 390 px.
  - His legs are visibly over-long (about 60% of his height) compared with the vendor.
  - A second beverage skid in the bottom-left is half under the card, with the ghost base and overhanging layers.
  - A faint figure shows through the card's translucency at the left.
- **Fix:**
  - Enlarge the scanner (yellow/black, about 0.25 m) and raise it to chest height aimed at a case.
  - Fix the leg scale.
  - Move the foreground skid out from under the card, or delete it.
  - Make the card opaque.

### MINOR-1: The card hides the subject
- v4_02: the roller and partner (BLOCKER-2).
- v4_07: a milk skid and most of the jacked skid.
- v4_08: the foreground skid (MINOR-25).
- v4_11: the jack's forks.
- v4_12: the compactor.
- v4_15: the worker's torso.
- (v4_02's wrapped skid and v4_05's skid are now clear: resolved.)

### MINOR-2: Card promises that aren't shown
- v4_02: no cutting, no partner or roller (BLOCKER-2).
- v4_06: no product put on the shelf (MAJOR-28).
- v4_09: no cutting and no handheld count (BLOCKER-11).
- v4_10: no reversing cue (MAJOR-29).
- v4_12: nobody loads the baler.
- (v4_08: the handheld check is now shown, though tiny: resolved, see MINOR-25.)

### MINOR-3: Idle poses
- v4_06: both workers stand with their arms down.
- v4_12: the worker faces the camera with his arms down at the open baler.
- v4_15: the worker isn't scanning.
- v4_04: the right-hand sorter stands with his arms down.

### MINOR-4 (narrowed): Tag collisions
- **Resolved:** v4_desktop ("Stocking 2" vs "Gravity roller") and v4_14 ("Z-racks" vs "Fashion").
- **Still:** v4_12's "Baler" tag covers the "Cardboard baler" sign.
- (v4_09, v4_11 and phone: see MAJOR-30.)

### MINOR-23 (still open): v4_07 residuals
- v4_07_milk.png, right half: the two middle milk skids touch with zero gap.
- The front-right skid is cut by the bottom bar and the nav buttons.
- The wrapped egg pallet reads taller than the worker.
- Only 4 of the 5 milk skids are clearly visible.
- **Fix:** ≥ 0.2 m gaps, pull the camera back about 10%, and cap the egg pallet at about 1.7 m.

### MINOR-24 (still open): v4_09 beverage skid too tall
v4_09_bev.png, centre: the jacked skid reads about 2.1 m against the receiver (the same model reads about 1.8 m in v4_08). Fix: cap it at about 1.8 m and check the v4_09 camera FOV.

### MINOR-12 (still open): The pharmacy wrap reads as a glass cabinet
v4_11_pharm.png (c0549_11_jack.png): beaded vertical posts and rims, and the film box extends about 0.4 m above the top cartons. Fix: use the wrappedSkid film, shrunk to the load.

### MINOR-20 (still open): The v4_12 card is a 5-bullet checklist
Fix: one sentence, plus a worker pressing the baler's stop button.

### MINOR-5 to MINOR-10 and MINOR-13 to MINOR-19: parts-sheet and other items, unchanged
- MINOR-5: driver tiles show "? × ? × ?".
- MINOR-6 (partly resolved): v4_models_final.png is still a duplicate of v4_models.png (same 5029936 B).
- MINOR-7: the stale worker and truck tests.
- MINOR-8: the pop skid's black cones.
- MINOR-9: the compactor decal confetti.
- MINOR-10: the driver tiles can't show the drivers.
- MINOR-13: the McKesson tote strap.
- MINOR-14: the egg film highlights.
- MINOR-15: impossible crate dates.
- MINOR-16: unidentified grey planks lie flat in v4_18.
- MINOR-17 (partial): cardboardBale.png is mostly blank.
- MINOR-18: the floor1_test stairs float.
- MINOR-19 (partial): in v4_17 the "1st flo…" sign is cut by the bottom bar, and there are no people.

## Status of previous findings (05:44 review → 06:00)
| ID | Status at 06:00 (05:49:39 renders) |
|---|---|
| BLOCKER-1 news/data clutter | **Closed (per the user's exception)**: chips collapsed in all 20 stills (already notified as item 4) |
| BLOCKER-2 wrapped skid / breakdown | **Open, narrowed (already notified)**: skid now clear and readable; no cutting, roller or partner |
| BLOCKER-4 operators | **Open (already notified)**: v4_11 forks still beside the pallet |
| BLOCKER-10 v4_10 grille close-up | Resolved (05:38) |
| BLOCKER-11 v4_09 counting | **Open (already notified 05:23)**: no change in action; vendor tag removed |
| BLOCKER-12 v4_08 foreground giant | **RESOLVED at 05:49** (residuals → MINOR-25). Notification state: header said not notified; footer said handed to trax at 05:46. Treated as not confirmed; no longer needs notifying |
| BLOCKER-3, 5, 7, 8, 9 / MAJOR-3, 4, 6, 7, 14-20, 23, 24, 27 | Remain resolved or superseded |
| MAJOR-28 | Open (re-framed; still no stocking, no jack) |
| MAJOR-30 | Open, changed (v4_02 and v4_08 resolved; v4_11 new; v4_09 and phone remain) |
| MAJOR-21 | Open, narrowed (v4_05 resolved; v4_01 and v4_03 remain) |
| MAJOR-10 | Open, narrowed (phone edge tag resolved) |
| MAJOR-1, 2, 5, 8, 9, 11, 12, 22, 25, 26, 29 | Open |
| MINOR-22 | **Regressed** (compactor background) |
| MINOR-4 | Narrowed (desktop and v4_14 resolved) |
| MINOR-1, 2 | Narrowed |
| MINOR-3, 5, 7-10, 12-16, 18, 20, 23, 24 | Open |
| MINOR-6, 17, 19 | Partly resolved, unchanged |
| MINOR-11 | Folded into MAJOR-29 |
| New this pass | MINOR-25 |

## Blockers already notified to Soros (for dedupe)
From the 03:17 EDT review:
1. Vehicles have no drivers or operators (BLOCKER-4): **still open** (v4_11 only).
2. No scene render: resolved.
3. Cartoon mannequin worker: resolved.

From the 03:31 EDT review:

4. Dashboard and news clutter (BLOCKER-1): **closed** per the chip exception.
5. No stretch-wrapped skids / breakdown process (BLOCKER-2): **still open, narrowed**.
6. Capsule people: resolved.
7. Blank first frame: resolved.
8. Skid and worker vanish between steps 5 and 6: resolved as such. The jack still vanishes between v4_05 and v4_06 (MAJOR-28).

Handed off at about 04:44 EDT (treated as notified):

9. BLOCKER-8: v4_05 subject hidden. Resolved.
10. BLOCKER-9: v4_07 cooler almost empty. Resolved.

Handed off at about 05:23 EDT (treated as notified):

11. BLOCKER-10: v4_10 grille close-up. Resolved at 05:38.
12. BLOCKER-11: v4_09 vendor embedded / no counting. **Still open.**

BLOCKER-12 (v4_08 foreground giant): the 05:44 header marked it "not yet notified", and the 05:46 footer says it was "handed to trax for delivery to Soros". Per the caller it is treated as **not confirmed notified**. It is **resolved** at 05:49, so nothing is outstanding. At most, send a "resolved" note if the 05:46 handoff did go out.

Not notified and not needed: BLOCKER-7 (resolved before notification), BLOCKER-12 (resolved before confirmed notification).

**Open blockers NOT yet notified: none.**

## Counts
- **BLOCKER (open): 3.** BLOCKER-2, -4 and -11, all already notified. New and not yet notified: **0**. Resolved this pass: BLOCKER-12.
- **MAJOR (open): 15.** MAJOR-1, 2, 5, 8, 9, 10, 11, 12, 21, 22, 25, 26, 28, 29, 30.
- **MINOR (open): 24.** MINOR-1 to -10, -12 to -20, -22 (regressed), -23, -24, plus the new -25. MINOR-6, -17 and -19 are partial; MINOR-11 is folded into MAJOR-29.
- **Files changed during the review:** none (the start and end listings are identical, and `find -newer` returned nothing).
