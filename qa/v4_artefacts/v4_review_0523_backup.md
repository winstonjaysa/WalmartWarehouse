# v4 visual/UX review: full scene renders (verdict: FAIL; 2 NEW blockers not yet notified: BLOCKER-10, BLOCKER-11)

Reviewer: QA (read-only; only qa/ was written; nothing committed). Updated Sat 2026-10-31, about 05:22 EDT (America/Toronto). This covers the **05:00:16 EDT** renders and supersedes the 04:43 version (backed up at `qa/v4_artefacts/v4_review_0444_backup.md`; older backups: `v4_review_0433_backup.md`, `v4_review_0408_backup.md`, `v4_review_0346_backup.md`, `v4_review_0331_backup.md`).

**Scope.** `ls -la --time-style=full-iso` of preview/v4_*.png and parts/v4/preview was taken at the start (about 05:19 EDT, `qa/v4_artefacts/ls_start_0500.txt`) and the end (05:21:31 EDT, `ls_end_0500.txt`). The two listings are identical (`diff` empty), and `find -newer preview/v4_phone.png` over preview/, parts/v4/ and v4/ returned nothing, so **nothing changed during this review**. All 20 `preview/v4_*.png` were re-rendered together at 05:00:16. They are newer than the latest source (a5_brains.js / main.js 04:59:07, out.js 04:59:07.93, news.json 04:59:08.61). parts/v4/preview is unchanged since 04:24:54 (newest PNG v4_models_final.png 04:24:32), so the parts findings carry over unchanged.

**Method.**
- Every image viewed at full size and as a 390 px-wide copy (`qa/v4_artefacts/*_0500_390w.png`, contact sheet `sheet_0500_390w.png`), plus 1.2-3x crops (`c0500_*`).
- Diffed each 390 px copy against the 04:38 copy (`*_0438_390w.png`) to locate changes: big changes in v4_02 (37% of pixels), v4_05 (43%), v4_06 (65%), v4_07 (41%), v4_09 (34%), v4_10 (58%); moderate in v4_03 (10%), v4_08 (9%), v4_11 (12%); ≤5% (substantively unchanged) in v4_01, 04, 12-18, desktop, phone.
- Content checked against ref/ photos (backroom_1/2, wrapped_skid_ref, bev_skid_*, egg_case_*, milk_crates_cooler, mckesson_tote_*, cardboard_bale, dsd_truck_*, pop_skid_*). Style judged only against ref/reel f01-f06; toy-like, low-poly, faceless style is **not** penalised.

## What changed 04:38 → 05:00 (summary)
- **v4_05 (fixed):** Low camera; the Dept 46 skid sits on an engaged yellow jack and the puller walks ahead with his hand on the grip. **BLOCKER-8 resolved.** Residuals: the tag floats on a blank wall, and the setting is still the backroom, not an aisle (MINOR-22).
- **v4_07 (fixed):** The cooler now holds 4 visible milk skids (a 5th probably behind the card), the wrapped egg pallet, and a worker pulling a skid in with his hand on the jack grip. **BLOCKER-9 resolved.** Residuals: the two back skids touch, the front skid is cut by the bottom bar, and the egg pallet looks taller than the worker (MINOR-23).
- **v4_08 (fixed):** The vendor now pulls the beverage skid with his hand on the jack grip. The v4_08 part of BLOCKER-4 is resolved.
- **v4_02 (changed, still failing):** The trailer view is gone. Now a worker stands next to a jack beside a 5-case-high mixed skid on the floor. But the skid is **bare cardboard with no stretch film**, the worker's hands are at his sides (not on the jack), and nobody cuts film. BLOCKER-2 is still open. MAJOR-20 (no person) and the v4_02 part of MAJOR-25 are resolved.
- **v4_06 (regressed):** The camera is high over the toy-brick gondolas again. The worker now just pulls the skid down the aisle on a jack. **Nobody takes cases off the skid or puts product on a shelf**, which is the whole step ("Filling the holes"). → **MAJOR-28 (new)**. MINOR-21 is superseded.
- **v4_09 (regressed):** A tight close-up on one rainbow-brick beverage skid. The "Beverage vendor" is **embedded in the side of the skid**. The DSD associate is cut by the left edge and hidden behind the card. No wrap, no cutting, no handheld. → **BLOCKER-11 (new)**.
- **v4_10 (regressed):** The camera is about 1 m from the front of a blue tractor cab. The whole frame is cab, grille and fuel tank, with no dock door, no trailer rear, no snack vendor and no reversing. A driver is now visible behind real glazing (MAJOR-27's cab-shell issue is resolved), but the step can't be read. → **BLOCKER-10 (new)**.
- **v4_11 (still failing):** The jack is now beside the tote pallet, with its forks running along the pallet's left side and **not under it**. The associate stands behind the jack head, holding the ring.
- **v4_03:** Minor re-pose. The foreground carrier now walks toward the camera holding a case, and a background puller has his hand on a jack. OK.
- **v4_01, v4_04, v4_12-v4_18, desktop, phone:** substantively unchanged (≤5% of pixels differ).
- **News chip and routechip:** still present (BLOCKER-1). news.json was re-written again at 04:59:08. The allorigins fetch is now at a7_ui.js:98, main.js:1013 and out.js:17.

## Files reviewed (EDT, -04:00; identical at the start ≈05:19 and the end 05:21:31)
| Path | mtime | Size (B) | Notes |
|---|---|---|---|
| preview/v4_01_truck.png | 2026-10-31 05:00:16.627071240 | 210712 | 1280×800; unchanged content |
| preview/v4_02_breakdown.png | 2026-10-31 05:00:16.627071240 | 411122 | New composition; BLOCKER-2 still open |
| preview/v4_03_roller.png | 2026-10-31 05:00:16.631071236 | 480780 | Minor re-pose |
| preview/v4_04_sort.png | 2026-10-31 05:00:16.631071236 | 797550 | |
| preview/v4_05_floor.png | 2026-10-31 05:00:16.631071236 | 222227 | **Fixed** (BLOCKER-8 resolved) |
| preview/v4_06_stock.png | 2026-10-31 05:00:16.635071232 | 301319 | Regressed (MAJOR-28) |
| preview/v4_07_milk.png | 2026-10-31 05:00:16.635071232 | 380226 | **Fixed** (BLOCKER-9 resolved) |
| preview/v4_08_dsd.png | 2026-10-31 05:00:16.639071228 | 339375 | Vendor now operates the jack |
| preview/v4_09_bev.png | 2026-10-31 05:00:16.639071228 | 374532 | **Regressed (BLOCKER-11)** |
| preview/v4_10_snack.png | 2026-10-31 05:00:16.639071228 | 178099 | **Regressed (BLOCKER-10)** |
| preview/v4_11_pharm.png | 2026-10-31 05:00:16.639071228 | 284829 | Jack moved; still not under the load |
| preview/v4_12_baler.png | 2026-10-31 05:00:16.643071225 | 391186 | |
| preview/v4_13_omni.png | 2026-10-31 05:00:16.643071225 | 268260 | |
| preview/v4_14_fashion.png | 2026-10-31 05:00:16.643071225 | 277579 | |
| preview/v4_15_claims.png | 2026-10-31 05:00:16.647071220 | 306070 | |
| preview/v4_16_stairs.png | 2026-10-31 05:00:16.647071220 | 291937 | |
| preview/v4_17_upstairs.png | 2026-10-31 05:00:16.651071216 | 171737 | |
| preview/v4_18_overview.png | 2026-10-31 05:00:16.651071216 | 571399 | |
| preview/v4_desktop.png | 2026-10-31 05:00:16.651071216 | 540312 | |
| preview/v4_phone.png | 2026-10-31 05:00:16.655071212 | 157064 | 390×844 |
| parts/v4/preview/ (dir) | 2026-10-31 04:24:54.121188619 | 4096 | Unchanged |
| parts/v4/preview/v4_models.png / v4_models_final.png | 04:24:30.361192377 / 04:24:32.981192083 | 5029936 / 5029936 | Unchanged; still duplicates |
| parts/v4/preview/cardboardBale.png / _crop.png | 04:24:17.997193349 / 04:24:54.213188599 | 181649 / 530536 | Unchanged |
| parts/v4/preview/floor1_test.png | 04:18:02.996798021 | 1367722 | Unchanged |
| parts/v4/preview/trucks_test.png / worker_test.png | 03:29:27.141933867 / 03:29:28.501931454 | 261755 / 286503 | Unchanged (stale) |
| parts/v4/preview/contact.html / floor1_test.html / trucks_test.html / worker_test.html | 04:23:47.905 / 04:17:31.720 / 03:29:23.369 / 03:27:22.258 | 12104 / 10968 / 3708 / 2716 | Not rendered |
| v4/a5_brains.js / a6_render.js / a7_ui.js / main.js / out.js / news.json | 04:59:07.851 / 04:55:44.099 / 04:58:44.583 / 04:59:07.907 / 04:59:07.931 / 04:59:08.611 | 28301 / 9369 / 12987 / 119526 / 230852 / 1991 | Grepped only: body.html:28 `routechip`, body.html:32 `newsBar`, allorigins at a7_ui.js:98, main.js:1013, out.js:17 |

New artefacts in qa/v4_artefacts/ (all tagged 0500):
- `v4_review_0444_backup.md`, `ls_start_0500.txt`, `ls_end_0500.txt`.
- 390 px copies: `*_0500_390w.png` (20 files) and `sheet_0500_390w.png`.
- Crops: `c0500_01_unloader`, `c0500_02_skid_jack`, `c0500_03_fg_worker`, `c0500_03_jack`, `c0500_04_behindcard`, `c0500_05_bg`, `c0500_05_jack`, `c0500_06_skid_jack`, `c0500_07_puller`, `c0500_07_skids`, `c0500_08_left`, `c0500_08_leftedge`, `c0500_08_vendor_jack`, `c0500_09_left_fg`, `c0500_09_vendor_skid`, `c0500_10_driver`, `c0500_10_wheels`, `c0500_11_jack`, `c0500_15_cage`.

## Findings (worst first)

### BLOCKER-10 (NEW, not yet notified; supersedes MAJOR-27): The v4_10 frame is just a truck grille, so the step can't be read
- **File and region:** v4_10_snack.png, the whole frame (c0500_10_driver.png, c0500_10_wheels.png).
- **Problem:**
  - The camera sits about 1 m in front of a blue tractor cab. About 85% of the frame is cab panel, grille, mirror and fuel tank, and the trailer side is cut by the left edge.
  - There is no dock door, no trailer rear, no store wall, no snack vendor or snack product, and no sign of reversing. The card says "A snack vendor backs in… the vendor pulls a skid out", and none of that is visible.
  - The driver is now visible behind glazing, but his hands reach into empty air (no steering wheel).
  - At 390 px it reads as an abstract blue shape.
  - This regressed from 04:38, when the docks, both trailers and the reversing truck were in frame.
- **Fix:**
  - Pull back to about 12-15 m, at about 25° above, behind and to the side of the reversing snack truck, so the open dock door, the truck's rear and the cab (with the driver in `seatedDrivePose` with his hands on a wheel) are all in frame.
  - Put a "Snack vendor" decal or box truck in frame (dsd_truck_red_box.jpg).
  - Keep the subject outside the card's rectangle.

### BLOCKER-11 (NEW, not yet notified): The v4_09 vendor is embedded in the beverage skid, and the counting step isn't shown
- **File and region:** v4_09_bev.png, centre-right (c0500_09_vendor_skid.png) and left (c0500_09_left_fg.png).
- **Problem:**
  - The "Beverage vendor" is fused into the right side of the skid. His torso and arm are inside the case layers, he leans at about 20°, and his feet sit under the overhanging cases. It's a person intersecting cargo in the hero shot.
  - The DSD associate (the receiver who should cut the wrap and count) is cut by the left frame edge and hidden behind the card. Only a shoulder and the handheld show.
  - The card says "Every wrap comes off… the receiver cuts all the stretch wrap off, counts with the handheld". There is no film on or around the skid, no cutting and no visible counting.
  - The skid itself is a rainbow stud-brick stack, with translucent ghost cases on top and layers overhanging the pallet on the right (MAJOR-22).
  - The second skid and the 04:38 wide framing are gone.
- **Fix:**
  - Move the vendor ≥ 0.5 m clear of the skid, standing at the jack handle (`jackPullPose`).
  - Bring the receiver fully into frame, outside the card. Show one hand holding the handheld scanner aimed at a case and a cut film tail hanging from the skid (wrapped_skid_ref.jpg, bev_skid_wrapped.jpg).
  - Seat every case layer within the pallet's footprint.
  - Use a camera about 4-5 m back at about 30°.

### BLOCKER-4 (still open; already notified as item 1): Some jacks still have no real operator
- **Resolved this pass:**
  - v4_05: the puller's hand is on the grip of an engaged jack.
  - v4_07: the cooler puller's hand is on the grip.
  - v4_08: the vendor pulls the skid with his hand on the grip (c0500_08_vendor_jack.png).
  - v4_10: the visible tractor now has a seated driver behind glazing.
  - v4_03 and v4_06: the pullers hold their grips.
- **Still failing:**
  - **v4_11_pharm.png, centre-left (c0500_11_jack.png):** the jack's forks run *alongside* the tote pallet's left edge, not under it, so the pallet sits on the floor. The associate stands behind the jack head instead of in front of it, pulling.
  - **v4_02_breakdown.png, centre (c0500_02_skid_jack.png):** the jack's handle is upright with nobody on it. The worker stands beside it with both arms down, and its forks end beside the skid, not under it.
- **Fix:**
  - v4_11: rotate the jack 90° so its forks go into the pallet's fork openings, and put the associate in front of the handle, in `jackPullPose`.
  - v4_02: put the forks under the skid's pallet, with the worker's hand on the grip.

### BLOCKER-1 (still open, unchanged; already notified as item 4): A news feature and a data table are still in the product
- **Every one of the 20 frames, bottom-left:** a "News" chip (body.html:32 `#newsBar`). The live allorigins → Google News fetch is at a7_ui.js:98, main.js:1013 and out.js:17, and news.json was re-written at 04:59:08.
- **v4_18_overview.png, card:** the "How receiving routes items (store receiving notes) ▸" pill (body.html:28 `routechip`) expands to a Division/Departments table.
- **Fix:** Delete `#newsBar`, the news code, news.json and the fetch. Delete the routechip table, or replace it with one plain sentence.

### BLOCKER-2 (still open, changed; already notified as item 5): Step 2 still has no stretch-wrapped skid and no breakdown action
- **File and region:** v4_02_breakdown.png, centre (c0500_02_skid_jack.png).
- **Changed:** The skid is now out on the floor, and a worker and a jack are present.
- **Still failing:**
  - The card title is "Mixed skids, stretch-wrapped", but the skid is **bare stacked cartons with no film at all**. The 04:38 skid at least had film. This is exactly the "bare boxes where stretch-wrapped skids belong" defect (compare wrapped_skid_ref.jpg).
  - No one cuts film, there's no film flap, no partner feeding cases to the roller, and no empty-pallet stack by the wall. The card promises all four.
  - The worker stands idle next to an unengaged jack (BLOCKER-4).
  - The skid is about 1.6 m, slightly short of the 1.9 m the card states, and both pallets are black (MAJOR-2).
- **Fix:**
  - Use the `wrappedSkid` film on the tall skid, with one side slit and a film flap hanging.
  - Put the worker in a cutting pose (box cutter at the film) and a partner placing a case on the roller head.
  - Bring the skid to about 1.9 m, and add a 6-8 high empty-pallet stack against the wall.

### MAJOR-28 (NEW; supersedes MINOR-21): The v4_06 "Filling the holes" step shows no stocking
- **File and region:** v4_06_stock.png, centre (c0500_06_skid_jack.png).
- **Problem:**
  - The 04:38 fix (a worker bending to take a case off the skid) is gone. The worker now just pulls the skid down the aisle on a jack, which is a repeat of step 5.
  - No case comes off the skid, no product goes onto a shelf, and there are no visible holes on the shelves.
  - The tag "Stocking 3 · Dept 46 skid (1 person)" is copied from step 5.
  - The camera is back to a high aerial view over the toy-brick gondolas (MAJOR-5), so the skid is small at 390 px.
- **Fix:** At aisle level, park the skid (jack lowered) against the gondola. Show the worker holding an open case at a shelf with a visible gap, and use the tag "Stocking 3 · filling holes".

### MAJOR-25 (still open, reduced): A white horizontal bar crosses dock-door openings
- **Resolved:** v4_02 (the door is no longer in frame).
- **Still open:**
  - v4_01_truck.png: across the trailer mouth, with a case resting on it.
  - v4_08_dsd.png: the left and centre doors.
  - v4_13_omni.png: the right door.
- **Fix:** Roll each door fully into its header, or remove the bar.

### MAJOR-22 (still open, worse in v4_09): Beverage skids read as coloured toy bricks
- **Files and regions:** v4_09_bev.png, centre (c0500_09_vendor_skid.png), now the full-frame subject; v4_08_dsd.png, centre and right; v4_16, right edge.
- **Problem:** Lime, purple and red stud-topped slabs, translucent ghost cases on top, black layers with red and green cones, and layers overhanging the pallet.
- **Fix:** Can/bottle-top texture instead of studs, muted print bands, carton seams, and supported top cases (bev_skid_1-4.jpg).

### MAJOR-21 (still open, changed): The camera clips or the card hides foreground workers
- **Resolved:** v4_04 (no ghost figure is visible behind the card in c0500_04_behindcard.png).
- **Still open:**
  - v4_09: the DSD associate is cut by the left edge and the card (part of BLOCKER-11).
  - v4_08: a figure holding a jack is cut by the left edge and hidden behind the card (c0500_08_leftedge.png).
  - v4_03: the foreground carrier is cut at the shins by the bottom bar.
- **Fix:** Keep the camera ≥ 1.5 m from workers, and keep people outside the card's rectangle.

### MAJOR-1 (still open): Trailers are roofless cutaways
v4_18_overview, v4_desktop and v4_phone (open-top Walmart trailers showing their loads). v4_10 no longer shows one. Fix: close the roofs, and show the load through the open rear doors instead.

### MAJOR-2 (still open): Black pallets remain
v4_02 (both skids), v4_04 (most department skids), v4_05 and v4_06 (the Dept 46 skid, black with yellow and teal), v4_14 (left), and v4_18/desktop (empty black pallets near the docks). Fix: natural, CHEP blue or red wood everywhere.

### MAJOR-5 (still open): Toy-block products and unidentified monoliths
- v4_06 gondolas (now full-frame again) and v4_18: solid-colour bricks.
- v4_14: garment slabs with no hangers.
- v4_12, bottom-left: a lone kraft slab about 1.5 m tall in the foreground.
- v4_18 and desktop: the red and blue 1.5-2 m monoliths.

### MAJOR-8 (still open): Interpenetration and floating objects
- **v4_09:** the vendor is inside the skid (now BLOCKER-11).
- **v4_14_fashion.png, centre:** the worker is inside the garments, and the Z-racks cross at a shared upright.
- **v4_15_claims.png, centre (c0500_15_cage.png):** the shelf boards still run through the cage uprights with no uprights of their own, and the lower row of 3 cases still hangs in air below the middle shelf.
- **Fix:** Separate the racks, and move the worker to the open end. Put the shelving inside the cage on its own uprights, and seat every case on a board.

### MAJOR-9 (still open, improved): Too empty compared with backroom_1/2
- **Improved:** v4_07 is now populated.
- **Still open:**
  - No people in v4_13 (which has only 4 totes), v4_16 (apart from a far-edge figure) or v4_17.
  - v4_11: one pallet in a white void.
  - v4_15: 6 cases.
  - v4_05: background is a blank grey wall.
- **Fix:** Populate each step with the people and objects its card names.

### MAJOR-10 (still open): Phone and 390 px legibility
- **390 px copies:**
  - v4_17's room plaques ("Training room", "Lunch room", "Sick room", "Cleaning") are illegible.
  - v4_16's "Cleaning" and wall signs are illegible.
  - v4_18 wall signs and the desktop Cooler/Freezer area are at the limit.
  - v4_10 is entirely unreadable at 390 px (BLOCKER-10).
- **v4_phone:** the "Stocking 2 · sorting by dept" tag runs to the right screen edge.
- **Fix:** Use larger plaques, keep a 24 px safe area, and render each step at 390×844.

### MAJOR-11 (still open): Step labels don't match the rail
- v4_08 and v4_10 both say "STEP 7".
- v4_13, v4_14 and v4_15 all say "STEP 8".
- v4_07 ("FROZEN & DAIRY"), v4_09 ("DSD · COUNTING"), v4_11 ("PHARMACY"), v4_12 ("MORNING PRE-OP", mid-night), v4_16 ("STAIRS") and v4_17 ("UPSTAIRS") have no number.
- **Fix:** Number 1-18 to match the file NN, and move pre-op to the start or end of the story.

### MAJOR-12 (still open): Aerial dollhouse landing
v4_desktop.png, v4_phone.png and v4_18_overview.png (unchanged).

### MAJOR-26 (still open, unchanged): The v4_16 stairs step is poorly composed
v4_16_stairs.png:
- The bottom ~40% is the black dock-door header and the receiving desk.
- Only the upper flight shows, landing on the Receiving office wall. The foot of the stair is hidden.
- Nobody is on the stairs.
- Fix: put the camera on the floor near the stair foot, looking up; remove the header from the foreground; add a climbing worker.

### MINOR-1: The card hides the subject
- v4_07: a milk skid (the possible 5th) and most of the jacked skid are behind the card.
- v4_15: the worker's torso is behind the card.
- v4_12: the compactor is behind the card.
- v4_11: the jack's forks are behind the card.
- v4_05: the skid's left half is under the card.
- v4_09: the receiver is behind the card.

### MINOR-2: Card promises that aren't shown
- v4_02: no cutting, no partner, no empty-pallet stack (BLOCKER-2).
- v4_09: no cutting and no handheld count (BLOCKER-11).
- v4_12: nobody loads the baler.
- v4_05: "to its aisle" is shown in an empty backroom area.

### MINOR-3: Idle poses
- v4_12: the worker stands facing the camera with his arms down, in front of the open baler.
- v4_15: the worker isn't scanning.
- v4_04: the right-hand sorter stands with his arms down.
- v4_02: the worker stands with his arms down beside the jack.

### MINOR-4: Tag collisions
- v4_desktop: "Stocking 2 · sorting by dept" covers "Gravity roller".
- v4_14: "Z-racks" and "Fashion · hanging apparel" overlap.
- v4_12: the "Baler" tag covers the "Cardboard baler" sign.

### MINOR-5 to MINOR-10 and MINOR-13 to MINOR-15: parts-sheet items, unchanged
- MINOR-5: driver tiles show "? × ? × ?".
- MINOR-6 (partly resolved): v4_models_final.png is still a duplicate.
- MINOR-7: the stale worker and truck tests.
- MINOR-8: the pop skid's black cones.
- MINOR-9: the compactor decal confetti.
- MINOR-10: the driver tiles can't show the drivers.
- MINOR-13: the McKesson tote strap.
- MINOR-14: the egg film highlights.
- MINOR-15: impossible crate dates.

### MINOR-11 (changed): The v4_10 card and frame disagree
The card says "reverses slowly to its door", but there's no door and no motion cue in frame. It's now part of BLOCKER-10.

### MINOR-12 (still open): The pharmacy wrap reads as a glass cabinet
v4_11_pharm.png (c0500_11_jack.png): beaded vertical posts and rims, and the film box extends about 0.4 m above the top cartons. Fix: use the wrappedSkid film, shrunk to the load.

### MINOR-16: Unidentified grey planks lie flat
v4_18_overview.png, centre-right, beside the monoliths (unchanged).

### MINOR-17 (partly resolved): The cardboard bale
The bales are in v4_12 (unchanged). cardboardBale.png is still a mostly blank canvas, and the rightmost bale touches the claims-cage fence line.

### MINOR-18: The straight-stairs test variant floats
floor1_test.png. Unchanged; it isn't used in the scene.

### MINOR-19 (partly resolved): v4_17 upstairs framing
The "1st flo…" floor sign is still cut by the bottom bar, the division shelving is cut by the right edge, and there are no people.

### MINOR-20 (still open): The v4_12 card is a 5-bullet checklist
v4_12_baler.png, card: the 5-item checklist is the kind of list/panel clutter the user doesn't want, and it makes the card the tallest. Fix: one sentence, plus a worker pressing the baler's stop button.

### MINOR-22 (NEW): v4_05 residuals
- **File and region:** v4_05_floor.png, top-centre and background (c0500_05_bg.png, c0500_05_jack.png).
- **Problem:**
  - The "Stocking 3 · Dept 46 skid (1 person)" tag floats on a blank grey wall, well above the skid.
  - About 50% of the frame is empty wall, and the background is the backroom compactor and baler, not the sales-floor aisle the card names.
  - The pallet is black and yellow.
- **Fix:** Anchor the tag to the skid. Frame so a gondola aisle end or the sales-floor doors are behind the puller. Use a natural or CHEP pallet.

### MINOR-23 (NEW): v4_07 residuals
- **File and region:** v4_07_milk.png, right half (c0500_07_skids.png, c0500_07_puller.png).
- **Problem:**
  - The two back milk skids touch with zero gap (the crate walls merge).
  - The front-right skid is cut by the bottom bar and the nav buttons.
  - The wrapped egg pallet, at the back wall, reads taller than the worker standing in front of it (> 1.9 m). Real egg pallets are about 1.5-1.8 m (egg_case_1/2).
  - Only 4 of the card's 5 milk skids are clearly visible.
- **Fix:** Keep ≥ 0.2 m gaps, pull the camera back or up by about 10%, and cap the egg pallet at about 1.7 m.

## Status of previous findings (04:43 review → 05:22)
| ID | Status at 05:22 |
|---|---|
| BLOCKER-1 news/data clutter | **Open (already notified)**, unchanged: a News chip with a live fetch on every frame, and the routechip table in v4_18 |
| BLOCKER-2 no wrapped skid / breakdown process | **Open (already notified)**, changed: the skid is out on the floor with a worker and jack, but the film is now **absent entirely**, and there's no cutting, partner or pallet stack |
| BLOCKER-4 no operators | **Open (already notified)**, improved: v4_05, v4_07, v4_08 and v4_10 are now OK. Still failing: v4_11 (forks beside the pallet) and v4_02 (unattended jack) |
| BLOCKER-8 v4_05 subject invisible | **Resolved** (residuals in MINOR-22) |
| BLOCKER-9 v4_07 near-empty cooler | **Resolved** (residuals in MINOR-23) |
| BLOCKER-3, 5, 7 / MAJOR-3, 4, 6, 7, 14, 15, 16, 17, 18, 19, 23, 24 | Remain resolved or superseded |
| MAJOR-20 no worker in breakdown | **Resolved** (a worker is present; his pose is covered by BLOCKER-2 and BLOCKER-4) |
| MAJOR-27 v4_10 driver buried in hood | **Resolved as such** (closed, glazed cab with a seated driver), but the framing regressed into **BLOCKER-10 (new)** |
| MAJOR-25 | **Open, reduced** (v4_02 resolved; v4_01, v4_08 and v4_13 remain) |
| MAJOR-22 | **Open, worse** (v4_09 is now a full-frame close-up of a brick skid) |
| MAJOR-8 | **Open, worse** (v4_09 vendor in the skid → BLOCKER-11; v4_14 and v4_15 unchanged) |
| MAJOR-21 | **Open, changed** (v4_04 resolved; v4_09 new; v4_08 and v4_03 remain) |
| MAJOR-9 | **Open, improved** (v4_07 populated) |
| MAJOR-1, 2, 5, 10, 11, 12, 26 | **Open** |
| MINOR-21 v4_06 hero-skid details | **Superseded by MAJOR-28** (the stocking action was removed) |
| MINOR-1 to 5, 7 to 16, 18, 20 | **Open** (MINOR-11 folded into BLOCKER-10) |
| MINOR-6, 17, 19 | **Partly resolved**, unchanged |
| New this pass | **BLOCKER-10, BLOCKER-11**, MAJOR-28, MINOR-22, MINOR-23 |

## Blockers already notified to Soros (for dedupe)
From the 03:17 EDT review:
1. Vehicles have no drivers or operators (BLOCKER-4): **still open** (v4_11, v4_02)
2. No scene render (resolved)
3. Cartoon mannequin worker (resolved)

From the 03:31 EDT review:

4. Dashboard and news clutter (BLOCKER-1): **still open**
5. No stretch-wrapped skids / breakdown process (BLOCKER-2): **still open**
6. Capsule people (resolved)
7. Blank first frame (resolved)
8. Skid and worker vanish between steps 5 and 6 (was MAJOR-18): resolved. Note that v4_06 no longer shows stocking (MAJOR-28).

Handed off at about 04:44 EDT (treated as notified):

9. BLOCKER-8: v4_05 Dept 46 skid, puller and jack hidden behind a gondola. **Resolved at 05:00.**
10. BLOCKER-9: v4_07 cooler almost empty (1 milk skid, no egg pallet, no people). **Resolved at 05:00.**

Not notified and not needed: BLOCKER-7 (resolved before notification).

**NEW, open blockers NOT yet notified (the caller handles notification; not marked as notified here):**
- **BLOCKER-10:** v4_10_snack.png, whole frame. The camera is about 1 m from a tractor grille, with no door, trailer rear, vendor or reversing visible, so the step can't be read. Fix: pull back to about 12-15 m behind and to the side of the reversing snack truck, with the door, the truck's rear and a driver with his hands on the wheel in frame.
- **BLOCKER-11:** v4_09_bev.png, centre-right and left. The beverage vendor is embedded in the skid, the receiver is cut off behind the card, and there's no wrap, cutting or handheld count. Fix: move the vendor ≥ 0.5 m clear at the jack handle, and show the receiver in frame cutting the film with the handheld.

## Counts
- **BLOCKER (open): 5.** BLOCKER-1, -2 and -4 are already notified. **New and not yet notified: 2** (BLOCKER-10, BLOCKER-11). Resolved this pass: BLOCKER-8 and BLOCKER-9.
- **MAJOR (open): 13.** MAJOR-1, 2, 5, 8, 9, 10, 11, 12, 21, 22, 25, 26, plus the new 28. Resolved this pass: MAJOR-20, and MAJOR-27 as such (its framing problem is now part of BLOCKER-10).
- **MINOR (open): 22.** MINOR-1 to -20, -22 and -23 (MINOR-21 superseded; MINOR-6, -17 and -19 partial).
- **Files changed during the review:** none (the start and end listings are identical, and `find -newer` returned nothing).

## Notification handoff (05:23 EDT)
BLOCKER-10 (v4_10_snack) and BLOCKER-11 (v4_09_bev) were handed to trax for delivery to Soros at about 05:23 EDT. Treat them as notified for dedupe.
