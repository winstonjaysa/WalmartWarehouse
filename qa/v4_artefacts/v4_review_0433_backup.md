# v4 visual/UX review: full scene renders (verdict: FAIL; no new blockers, BLOCKER-7 resolved)

Reviewer: QA (read-only; only qa/ was written). Updated Sat 2026-10-31, about 04:32 EDT (America/Toronto). Supersedes the 04:07 EDT version, backed up at `qa/v4_artefacts/v4_review_0408_backup.md` (older: `v4_review_0346_backup.md`, `v4_review_0331_backup.md`).

**Scope.** `ls -la --time-style=full-iso` at the start (04:26:44 EDT) and the end (04:31:38 EDT) were identical: **nothing changed during this review.** All 19 `preview/v4_*.png` were re-rendered together at 04:22:24 with new, unique numbering 01-17 plus desktop and phone. The old files (`v4_07_dsd`, `v4_08_snack`, `v4_09_pharm`, `v4_10_baler` … `v4_14_overview`, and the stale `v4_15_overview`) **no longer exist**. Old → new names: v4_07_dsd → **v4_08_dsd**, v4_08_snack → **v4_10_snack**, v4_09_pharm → **v4_11_pharm**, v4_10_baler → **v4_12_baler**, v4_11_omni → **v4_13_omni**, v4_12_fashion → **v4_14_fashion**, v4_13_claims → **v4_15_claims**, v4_14_overview → **v4_17_overview**. **v4_16_upstairs** is a new step. The renders (04:22:24) are newer than v4/main.js (04:21:32). cardboardBale.js (04:24:03) is newer than the renders but isn't used in any story frame.

**Method.** I viewed every image at full size and as a 390 px-wide copy (`qa/v4_artefacts/*_0422_390w.png`, including the parts previews), plus 2-4x crops (`c0422_*`, `m0424_*`, `f0418_*`). I compared content against ref/ (backroom_1/2, wrapped_skid_ref, bev_skid_*, egg_case_1/2, milk_crates_cooler, mckesson_tote_1/2, cardboard_bale.jpg). I judged the look only against ref/reel f01-f06. The toy-like, low-poly, faceless style matches the reel and is **not** penalised.

**What changed 04:05 → 04:22 (summary).**
- The news ticker collapsed to a "News" chip.
- The v4_17 data callouts were replaced by a collapsed "How receiving routes items" toggle.
- Signs now render as real text.
- v4_07_milk now shows a wrapped kraft egg pallet (no more tote pallet), and the jugs are back.
- v4_11_pharm's associate has his hand on the jack grip.
- v4_03 is reframed (no clipped foreground worker; red and natural pallets; a background puller on a jack).
- v4_04's red slab is gone.
- v4_02 now has a wrapped skid in frame, but it is inside the trailer, with no one working it.

## Files reviewed (EDT, -04:00; listed at 04:26:44 and 04:31:38, unchanged between the two)
| Path | mtime | Size (B) | Notes |
|---|---|---|---|
| preview/v4_01_truck.png | 2026-10-31 04:22:24.525167560 | 231080 | |
| preview/v4_02_breakdown.png | 2026-10-31 04:22:24.525167560 | 187556 | |
| preview/v4_03_roller.png | 2026-10-31 04:22:24.529167562 | 473914 | |
| preview/v4_04_sort.png | 2026-10-31 04:22:24.529167562 | 780793 | |
| preview/v4_05_floor.png | 2026-10-31 04:22:24.529167562 | 344669 | |
| preview/v4_06_stock.png | 2026-10-31 04:22:24.533167563 | 322748 | |
| preview/v4_07_milk.png | 2026-10-31 04:22:24.533167563 | 480844 | |
| preview/v4_08_dsd.png | 2026-10-31 04:22:24.537167566 | 341117 | Was v4_07_dsd |
| preview/v4_09_bev.png | 2026-10-31 04:22:24.537167566 | 377399 | |
| preview/v4_10_snack.png | 2026-10-31 04:22:24.537167566 | 275163 | Was v4_08_snack |
| preview/v4_11_pharm.png | 2026-10-31 04:22:24.541167568 | 273402 | Was v4_09_pharm |
| preview/v4_12_baler.png | 2026-10-31 04:22:24.541167568 | 249160 | Was v4_10_baler |
| preview/v4_13_omni.png | 2026-10-31 04:22:24.541167568 | 267982 | Was v4_11_omni |
| preview/v4_14_fashion.png | 2026-10-31 04:22:24.545167570 | 276266 | Was v4_12_fashion |
| preview/v4_15_claims.png | 2026-10-31 04:22:24.545167570 | 273146 | Was v4_13_claims |
| preview/v4_16_upstairs.png | 2026-10-31 04:22:24.545167570 | 168661 | **New step** |
| preview/v4_17_overview.png | 2026-10-31 04:22:24.549167572 | 570378 | Was v4_14_overview |
| preview/v4_desktop.png | 2026-10-31 04:22:24.549167572 | 532824 | |
| preview/v4_phone.png | 2026-10-31 04:22:24.553167574 | 157001 | 390×844 |
| parts/v4/cardboardBale.js | 2026-10-31 04:24:03.277193598 | 7894 | New. Not referenced in v4/main.js |
| parts/v4/README.md | 2026-10-31 04:24:18.021193348 | 12087 | Read in full (23 assets incl. cardboardBale, stairs, rooms) |
| parts/v4/preview/cardboardBale.png | 2026-10-31 04:24:17.997193349 | 181649 | 1800×500 |
| parts/v4/preview/cardboardBale_crop.png | 2026-10-31 04:24:54.213188599 | 530536 | 1800×574 |
| parts/v4/preview/floor1_test.png | 2026-10-31 04:18:02.996798021 | 1367722 | 1800×1440, 9 tiles (rooms and stairs) |
| parts/v4/preview/v4_models.png | 2026-10-31 04:24:30.361192377 | 5029936 | 1800×4200, 4×10 grid |
| parts/v4/preview/v4_models_final.png | 2026-10-31 04:24:32.981192083 | 5029936 | **Byte-identical** to v4_models.png (`cmp`) |
| parts/v4/preview/contact.html / floor1_test.html | 04:23:47.905192777 / 04:17:31.720716245 | 12104 / 10968 | Not rendered by me |
| parts/v4/preview/trucks_test.png / worker_test.png | 03:29:27.141933867 / 03:29:28.501931454 | 261755 / 286503 | Unchanged (stale) |
| v4/body.html / a7_ui.js / main.js / news.json | 04:14:32.052 / 04:17:51.940 / 04:21:32.061 / 04:21:32.781 | 8776 / 12631 / 118250 / 1991 | Grepped only. body.html:31 still has `<details id="newsBar">`; a7_ui.js:92-96 still has the Google News list and the allorigins fetch; body.html:27 has the collapsible Division/Departments `table.route`; main.js:612 builds the egg pallet with `buildEggs` |

New artefacts in qa/v4_artefacts/:
- 390 px copies: `*_0422_390w.png` (19 scene frames plus cardboardBale, cardboardBale_crop, floor1_test and v4_models).
- Scene crops: `c0422_01_worker_roller`, `c0422_02_skid_door`, `c0422_02_wrap_zoom`, `c0422_03_workers`, `c0422_03_jack`, `c0422_07milk_overlap`, `c0422_07milk_seam`, `c0422_07milk_front`, `c0422_08_jack`, `c0422_08_jack_people`, `c0422_08_bev_skid`, `c0422_08_left_fg`, `c0422_09bev_skid`, `c0422_10_red_cab`, `c0422_10_yard`, `c0422_11_puller`, `c0422_14_zrack`, `c0422_15_cage`, `c0422_16_floorsign`, `c0422_17_sort`, `c0422_17_left`, `c0422_desk_tags`, `c0422_desk_truck`.
- Parts crops: `m0424_row1`, `m0424_row3_bale`, `m0424_row4`, `m0424_row5_milk`, `m0424_row6`, `m0424_rows7_8_bev`, `m0424_rows9_10`, `f0418_straight_stairs`.

## Findings (worst first)

### BLOCKER-4 (still open; already notified as item 1): Loaded jacks and moving trucks still have no operator
- **Improved:**
  - v4_11_pharm (c0422_11_puller.png): the associate's right hand is on the grip ring. This is the first correct jack hold in a story frame. He stands upright facing the load with the handle vertical, so it reads as "holding", not "pulling", but it is acceptable.
  - v4_03 (c0422_03_workers.png): the background puller leans into a jack handle with his hand on it.
  - v4_desktop: the milk-skid puller is behind his load at the handle.
- **Still failing:**
  - **v4_09_bev.png, centre-right:** the beverage skid sits on a jack whose grip ring (right of the skid) is untouched. The "Beverage vendor" walks *away* from it, and the "DSD associate" stands arms-down behind the skid. The card says "The beverage vendor brings the skids in by pallet jack".
  - **v4_08_dsd.png, centre (c0422_08_bev_skid.png):** a jack with its grip ring raised is under the skid, and nobody's hand is on it. Both people stand arms-down. The card says "The vendor pulls the skid in".
  - **v4_10_snack.png, centre-top (c0422_10_red_cab.png):** the red box truck tagged "Snack Vendor reversing to door" has its cab hidden behind the Beverage trailer, so no driver is visible on a vehicle that is described as moving. The Beverage tractor's cab is under the card.
  - **v4_05 and v4_06:** the jack is parked about 1 m from the pallet, with no one at it (see MAJOR-18).
  - **v4_02:** there is no person and no jack anywhere, while the card says "A worker pulls each skid out with a pallet jack" (see BLOCKER-2).
  - **v4_03, right:** a yellow jack stands empty (parked, so this is a minor part of the problem).
- **Fix:**
  - Apply the README jack-pull recipe (gripPoint → handle ≈ −0.76 → worker at (−0.13, −0.35) → `jackPullPose` → residual nudge) to every jack shown under a load in v4_05, v4_06, v4_08 and v4_09.
  - The vendor in v4_08/v4_09 must have his hand on the grip, with the spine lean ≤ 10°.
  - In v4_10, frame the reversing truck's windshield, with a `seatedDrivePose` driver visible.

### BLOCKER-1 (still open, much reduced; already notified as item 4): A news feature and a data table are still in the product
- **Files and regions:**
  - Every frame, bottom-left: a "News" chip (body.html:31 `<details id="newsBar">`). When expanded, it lists 5 Google News headlines. a7_ui.js:92-96 still does the live allorigins/Google News fetch, and news.json was re-written at 04:21:32.
  - v4_17_overview.png, card (c0422_17_left.png): a "How receiving routes items (store receiving notes) ▸" pill expands to a Division/Departments data table (body.html:27 `table.route`).
- **Improved:** The scrolling ticker text and the v4_14 code-line/vendor callout are gone from the default view. The stale KPI frame (v4_15_overview) was deleted.
- **Fix:**
  - Delete `#newsBar`, the news IIFE, news.json and the third-party fetch entirely.
  - Delete the `routechip` table. If routing matters, put one plain sentence in the card ("Each box's department number decides its skid").

### BLOCKER-2 (still open, partly improved; already notified as item 5): Step 2 still doesn't show the breakdown process
- **File and region:** v4_02_breakdown.png, centre (c0422_02_skid_door.png and c0422_02_wrap_zoom.png).
- **Improved:** A real stretch-wrapped mixed skid, about 1.9 m tall (film streaks visible at full size), now sits inside the trailer and is tagged "Wrapped mixed skid ≈ 1.9 m".
- **Still wrong:**
  - The skid is about 40% occluded by the door jamb and a white bar across the opening (MAJOR-25). At 390 px the film doesn't read at all; it looks like bare cartons.
  - A black milk-crate stack with no jugs is jammed against it with no gap. Its crates' sides touch or pierce the film.
  - The frame has **no worker, no pallet jack, no cut film and no empty-pallet stack**. The "Stocking 2 · pulling skids" tag points at an empty dock plate. The card promises all four.
- **Fix:**
  - Pull the wrapped skid onto the dock plate or backroom floor, in front of the door.
  - Show a worker on a jack (BLOCKER-4 recipe) and a second worker slitting the film, with a flap of film hanging.
  - Put an empty-pallet stack by the wall.
  - Leave at least 0.2 m between the wrapped skid and any other load.

### MAJOR-24 (NEW; replaces resolved BLOCKER-7): v4_07_milk is readable as content, but the framing and spacing are wrong
- **File and region:** v4_07_milk.png, centre (c0422_07milk_overlap.png, c0422_07milk_seam.png, c0422_07milk_front.png).
- **Resolved part of BLOCKER-7:** The pharmacy tote pallet is gone. The wrapped load is now a kraft-case pallet built with `buildEggs` (main.js:612), and the crates are full again.
- **Problems:**
  1. The wrapped egg pallet sits flush against both milk stacks, with no visible gap. Its film edge is drawn over the right-hand crate column of the front stack. main.js:735 spaces the skids 1.6 m apart in a line, so this render shows them out of their slots, presumably mid-move, with no puller.
  2. Only about 3 milk skids are visible; the card says 5.
  3. There are no people at all in the frame.
  4. The camera looks straight down through 3 white roof joists, which cut across the subject.
  5. Each jug reads as a solid coloured blob from above. milk_crates_cooler.jpg shows white jugs with small coloured caps.
  6. The card has no step number.
- **Fix:**
  - Keep the skids in their slots with ≥ 0.2 m gaps, or show the one being moved with its puller.
  - Show all 5 milk skids plus the egg pallet.
  - Lower the camera to about 35° so the joists leave the frame.
  - Make the jug bodies white and only the caps coloured.
  - Add "STEP n".

### MAJOR-25 (NEW): A white horizontal bar crosses every dock-door opening
- **Files and regions:**
  - v4_01_truck.png: across the trailer mouth at chest height, behind the case and in front of the worker (c0422_01_worker_roller.png).
  - v4_02_breakdown.png: across the door, hiding the lower third of the wrapped skid.
  - v4_08_dsd.png: left door (c0422_08_jack_people.png).
  - v4_07_milk.png and v4_13_omni.png: similar bars or joists.
- **Problem:** It reads as a half-closed door or a barrier rail. Dock doors are fully rolled up during unloading, so this fakes the scene and hides the action.
- **Fix:** Roll the door fully into its header (top 0.3 m only), or remove the bar.

### MAJOR-22 (still open): Beverage skids read as coloured toy bricks, not drinks
- **Files and regions:** v4_09_bev.png, centre (c0422_09bev_skid.png); v4_08_dsd.png, right (c0422_08_bev_skid.png); v4_models rows 7-8 (m0424_rows7_8_bev.png). The tiles are unchanged.
- **Problem:**
  - Saturated lime, purple and red slabs with stud tops, plus translucent ghost cubes (the 4 L jugs) on top.
  - Seed 7's red top case still overhangs, unsupported.
  - The uniform seed 2 skid is still a seamless blue monolith.
- **Fix:** As before: a can/bottle-top texture instead of studs, muted print bands, carton seams, and supported top cases. Or use `detail:'high'` for the hero skid in v4_09.

### MAJOR-18 (still open): The v4_05 → v4_06 skid is still a single case
- **Files and region:** v4_05_floor.png and v4_06_stock.png, centre. These are unchanged from 03:55: 1 case on a black pallet, a detached jack, and an empty pallet in v4_06.
- **Fix:** As before: a 6-10 case skid on an engaged jack with a puller, then a partly emptied skid with product going into a gap.

### MAJOR-17 (still open, slightly improved): The unloader at the roller head isn't unloading
- **File and region:** v4_01_truck.png, centre (c0422_01_worker_roller.png).
- **Problem:** The worker now stands inside the trailer behind the roller head and is no longer fused into it. But his hands are empty and hidden, the "Roller head" tag covers his torso, and the only case rests on the white bar (MAJOR-25), not on the roller.
- **Fix:** `carryPose` with a case over the roller head, 3-5 cases on the roller, and the tag moved to the roller.

### MAJOR-20 (still open, worse): The breakdown step has no visible worker
- **File:** v4_02_breakdown.png. No person appears anywhere in the frame (see BLOCKER-2).
- **Fix:** As in BLOCKER-2.

### MAJOR-21 (open, moved): The camera clips foreground workers
- **Resolved in v4_03.**
- **New instances:**
  - v4_04_sort.png: a bottom-centre worker cut at the waist by the bottom bar, and the left-edge sorter cut by the frame and the card.
  - v4_08_dsd.png: a giant left-edge figure cut by the frame and the card (c0422_08_left_fg.png).
- **Fix:** Keep the camera at least 1.5 m from workers, and keep people outside the card's rectangle.

### MAJOR-1 (still open): Trailers are roofless cutaways
v4_10_snack.png (the Walmart "FDS" trailer, with cases visible from above), v4_17_overview, v4_desktop and v4_phone. Fix: close the roofs.

### MAJOR-2 (still open, improved): Black pallets remain
- **Black:** v4_04 (most skids), v4_05 and v4_06 (black with teal slats), v4_14 left.
- **Correct:** v4_03, v4_07, v4_08, v4_09 and v4_11 now use natural, CHEP blue or red pallets.
- **Fix:** `PM.woodVC` plus the `_pallet.js` paint everywhere.

### MAJOR-5 (still open): Toy-block products and unidentified monoliths
- **Files and regions:**
  - v4_05 and v4_06 gondolas: solid-colour bricks.
  - v4_14_fashion: garment slabs with no hangers.
  - v4_12_baler, left: a lone 1 m kraft cube in front of the compactor.
  - v4_17_overview and v4_desktop, centre: the red and blue 1.5-2 m monoliths.
- **Fix:** As before.

### MAJOR-8 (still open): Interpenetration and ghost poses
- **Files and regions:**
  - v4_14_fashion.png, centre (c0422_14_zrack.png): the worker is entirely inside the garments, so only the legs show. The two Z-rack frames cross at the shared upright.
  - **New:** v4_15_claims.png, centre (c0422_15_cage.png): the 3 shelf boards stick out through the cage's front uprights to the left, with no uprights of their own, so they float.
- **Fix:**
  - Separate the racks, and put the worker at the open end hanging an item.
  - Put the shelving fully inside the cage, on its own uprights.

### MAJOR-9 (still open): Too empty compared with backroom_1/2
- v4_11_pharm: a white void around one pallet.
- v4_13_omni: no people and 4 totes.
- v4_15_claims: 6 cases in the cage.
- v4_16_upstairs: no people in any room.
- v4_07_milk: no people.
- **Fix:** As before. Populate each step with the people and objects the card names.

### MAJOR-10 (still open): Phone and 390 px legibility
- **390 px copies:**
  - v4_16's floor plaques ("Training room", "Lunch room", "Sick room", "Cleaning") are illegible.
  - The "FDS" placard in v4_10 is barely legible.
  - v4_17 wall signs, the desktop Cooler/Freezer plaques and all contact-tile captions are illegible.
  - Dark tags are at the limit of legibility.
- **v4_phone:** the "Stocking 2 · sorting by dept" tag runs to the right edge, under the rail.
- **Fix:** As before. Render each step at 390×844, use larger plaques, and keep a 24 px safe area from the rail.

### MAJOR-11 (still open, reduced): Step labels don't match the rail
- **Resolved:** The file names are now unique (01-17).
- **Card labels are still inconsistent:**
  - v4_08 and v4_10 both say "STEP 7".
  - v4_13, v4_14 and v4_15 all say "STEP 8".
  - v4_07 ("FROZEN & DAIRY"), v4_09 ("DSD · COUNTING"), v4_11 ("PHARMACY"), v4_12 ("MORNING PRE-OP") and v4_16 ("UPSTAIRS") have no number.
  - "Morning pre-op" sits mid-night.
- **Fix:** Number the cards 1-17 to match the rail and the file NN, and move pre-op to the start or end of the story.

### MAJOR-12 (still open): Aerial dollhouse landing
v4_desktop.png, v4_phone.png and v4_17_overview.png. Fix as before.

### MINOR-1: The card hides the subject
- v4_15: the worker is half behind the card.
- v4_12: the compactor and its left sign are behind the card.
- v4_10: the Beverage tractor cab is behind the card.
- v4_16: the training room is behind the card.
- v4_04: the roller's left section and its joints are behind the card.

### MINOR-2: Card promises that aren't shown
- v4_02: no empty-pallet stack and no wrap cutting.
- v4_01: no "CP" placard visible.
- v4_09_bev: the card says the receiver "cuts all the stretch wrap off, counts with the handheld", but nobody cuts film or holds a handheld.
- v4_12: the card says cardboard goes into the baler, but nobody is loading it, and no finished bale is shown (see MINOR-17).

### MINOR-3: Idle or odd poses
- v4_04: the sorters stand arms-down.
- v4_03: the near sorter bends about 45° with both palms flat on the skate wheels and no box; the middle sorter stands arms-down while a box passes.
- v4_15: the worker isn't scanning.
- v4_12: the worker stands facing the open baler with his arms down.

### MINOR-4: Tag collisions
- v4_desktop and v4_phone: "Department skids" and "Stocking 2 · sorting by dept" sit on top of a third dark tag (c0422_desk_tags.png).
- v4_08_dsd: "Beverage vendor" covers "DSD associate · receiving".
- v4_14: "Z-racks" and "Fashion · hanging apparel" overlap.
- v4_12: the "Baler" tag covers the "Cardboard baler" sign.

### MINOR-5: Dev chrome on the contact sheet
v4_models.png row 4 (m0424_row4.png): @boxTruckDriver and @tractorDriver still read "? × ? × ? m · (ud ?)". The beverage captions still don't say low/high or wrapped/bare.

### MINOR-6 (partly resolved): Stale or duplicate renders
- **Resolved:** v4_15_overview and the old-numbered files were deleted.
- **Open:** v4_models_final.png is still byte-identical to v4_models.png.

### MINOR-7: worker_test.png and trucks_test.png are stale
They are the 03:29 renders. Fix: re-render or delete them.

### MINOR-8: The pop skid's bottles are black cones
v4_models row 1, tile 2 (m0424_row1.png), unchanged.

### MINOR-9: Compactor decals read as confetti
The tile is unchanged.

### MINOR-10: Driver tiles can't show the drivers
v4_models row 4. A driver is faintly visible in the box-truck cab at full size, but not at 390 px.

### MINOR-11: The v4_10 card and tags disagree
- **File:** v4_10_snack.png.
- **Problem:** The card says "The tractor-trailer reverses". The "Snack Vendor reversing to door" tag points at a red box truck, and "Snack vendor" points at a skid at a different door.

### MINOR-12: The pharmacy pallet's wrap reads as a glass cabinet
v4_11_pharm.png, centre (c0422_11_puller.png): bubble-like vertical "posts" at the corners and mid-faces. Fix: use the wrappedSkid film.

### MINOR-13: The McKesson tote has a strap the refs don't show
The tile is unchanged (m0424_row1.png).

### MINOR-14: The egg pallet's film has corner highlights that hide the case print
v4_models row 6, tiles 3-4 (m0424_row6.png). This is unchanged at sheet scale.

### MINOR-15: The milk-crate stencils show impossible dates
v4_models row 5 (m0424_row5_milk.png) still reads "33/11 31" and "27/01 31".

### MINOR-16: Unidentified grey planks lie flat in the overview
v4_17_overview.png, centre-right, next to the monoliths. Unchanged.

### MINOR-17 (NEW): The cardboard bale's straps float, the bale isn't in the story, and the preview is mostly blank
- **Files and regions:** cardboardBale_crop.png and v4_models row 3 (m0424_row3_bale.png); cardboardBale.png.
- **Good:** Content-wise the bale matches cardboard_bale.jpg well: crushed board layers, flaps, white poly straps and a natural pallet.
- **Problems:**
  - The 5 straps run as rigid rectangles a few cm *off* the bale's top and front faces. They don't bite in, and they end in air above the pallet deck instead of passing under the bale.
  - cardboardBale.png is 1800×500, but the two renders fill only about 1/4 of the width each; the rest is blank white canvas.
  - No finished bale appears in v4_12_baler or anywhere else in the scene.
- **Fix:**
  - Inset the straps 1-2 cm into the top and front edges and route them under the bale.
  - Fix the preview canvas size.
  - Stand one finished bale on its pallet beside the baler in v4_12.

### MINOR-18 (NEW): The straight-stairs variant floats and is truncated
- **File and region:** floor1_test.png, row 2, tile 3 (f0418_straight_stairs.png).
- **Problem:** The stair is about 1 m above the floor, its shadow is far below it, and it has no stringer feet. It is 3.13 m tall, against the README's 5.24 m rise, and the lower treads are missing.
- **Mitigation:** Only the U-turn variant is in the scene (main.js:395), so this is minor.
- **Fix:** Ground it at y = 0, or drop the variant.

### MINOR-19 (NEW): The v4_16 upstairs framing
- **File:** v4_16_upstairs.png.
- **Problems:**
  - The "1st flo…" floor sign is cut by the bottom bar (c0422_16_floorsign.png).
  - The division shelving is cut by the right edge.
  - The card says "Up the stairs from the backroom", but the stairs aren't in the frame.
  - The rooms have no walls or doors facing the camera.
  - There are no people (see MAJOR-9).
- **Fix:** Pull the camera back or rotate it to include the stair head, and keep labels inside the frame.

## Status of previous findings (04:07 review → 04:32)
| ID | Status at 04:32 |
|---|---|
| BLOCKER-1 news/data clutter | **Open (already notified)**, reduced: the ticker is now a "News" chip with a live fetch, and v4_17 has a collapsible data table |
| BLOCKER-2 no wrapped skid in step 2 | **Open (already notified)**, partly improved: a wrapped 1.9 m skid is in frame but inside the trailer, occluded, with no worker, jack or cutting |
| BLOCKER-4 no operators | **Open (already notified)**, improved in v4_11, v4_03 and desktop; v4_08, v4_09, v4_05, v4_06, v4_02 and the v4_10 reversing truck still fail |
| BLOCKER-7 tote pallet instead of egg pallet (was NEW, not yet notified) | **Resolved**: the egg pallet is now built with `buildEggs`. The leftover spacing and framing issues are downgraded to MAJOR-24. **No notification needed** |
| BLOCKER-3, 5 / MAJOR-6, 7, 14, 15, 16 | Remain resolved |
| MAJOR-3 roller zig-zag | **Resolved**: the main roller is straight in v4_04 and v4_17; the left-section join is hidden by the card (MINOR-1) |
| MAJOR-4 barcode signs | **Resolved**: signs render as real text (v4_13, v4_14, v4_15, v4_12) |
| MAJOR-19 floating Zebra over the pop skid | **Resolved / not reproducible**: the frame is reframed (v4_08) and no floating handheld is visible |
| MAJOR-21 camera clips a worker | v4_03 is **resolved**; it **recurs** in v4_04 and v4_08, so it stays open |
| MAJOR-23 red slab in v4_04 | **Resolved** |
| MAJOR-1, 2, 5, 8, 9, 10, 11, 12, 17, 18, 20, 22 | **Open**. MAJOR-2 and MAJOR-11 are reduced, MAJOR-17 is slightly improved, MAJOR-20 is worse (no worker), and MAJOR-8 has a new cage instance |
| MINOR-1 to 5, 7 to 16 | **Open** |
| MINOR-6 | **Partly resolved** (the stale overview is gone; models_final is still a duplicate) |
| New this pass | MAJOR-24, MAJOR-25, MINOR-17, MINOR-18, MINOR-19 |

## Blockers already notified to Soros (for dedupe)
From the 03:17 EDT review:
1. Vehicles have no drivers or operators (BLOCKER-4): **still open**
2. No scene render (resolved)
3. Cartoon mannequin worker (resolved)

From the 03:31 EDT review:
4. Dashboard and news clutter (BLOCKER-1): **still open**
5. No stretch-wrapped skids (BLOCKER-2): **still open**
6. Capsule people (resolved)
7. Blank first frame (resolved)
8. Skid and worker vanish between steps 5 and 6 (downgraded to MAJOR-18)

**Not notified, and no longer needed:** BLOCKER-7 (the v4_07_milk tote pallet). It was resolved before notification, and the residuals are MAJOR-24.

**NEW, not yet notified, open blockers: none.**

## Counts
- **BLOCKER (open): 3.** BLOCKER-1, -2 and -4, all already notified. New and not yet notified: 0. BLOCKER-7 is resolved.
- **MAJOR (open): 15.** MAJOR-1, 2, 5, 8, 9, 10, 11, 12, 17, 18, 20, 21, 22, plus the new MAJOR-24 and -25. Resolved this pass: MAJOR-3, 4, 19 and 23.
- **MINOR (open): 19.** MINOR-1 to -19; MINOR-6 is partial, and MINOR-17, -18 and -19 are new.
- **Files changed during the review:** none. The listings at 04:26:44 and 04:31:38 EDT were identical, and `find -newer` on the backup returned nothing in preview/, parts/v4/ or v4/.

## Late change (noticed after writing, at 04:33:29 EDT)
After the 04:31:38 end listing, Soros changed source files:
- v4/a5_brains.js at 04:32:11.412786614.
- v4/main.js (119134 B), a1_core.js, a2_static.js, a4_sim.js, a7_ui.js, body.html (9022 B) and out.js at 04:33:09.376-.456.
- news.json at 04:33:10.160698202.

**No preview PNGs were re-rendered** (all still 04:22:24), so the visual findings above stand for the current renders. A grep of the new source shows BLOCKER-1 is still present:
- `newsBar` at body.html:32.
- `routechip` / `table.route` at body.html:28.
- The allorigins / news.google fetch at a7_ui.js:97 and main.js:1012.

All other findings need a re-check once new renders exist.
