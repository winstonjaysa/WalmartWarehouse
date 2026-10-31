# v4 visual/UX review: full scene renders (verdict: FAIL, improved)

Reviewer: QA (read-only; only qa/ was written). Updated Sat 2026-10-31, about 03:46 EDT (America/Toronto). Supersedes the 03:31 EDT version, which is backed up at qa/v4_artefacts/v4_review_0331_backup.md.

**Scope of this update.** I was asked to check only the 03:32 contact-sheet re-render, but `ls -la --time-style=full-iso` showed that **every scene render except v4_15 was rewritten at 03:42:00 EDT**. v4/main.js (03:39:42), body.html (03:38:40) and a7_ui.js (03:39:42) also changed. So I re-reviewed every 03:42 scene render at full size and as a 390 px-wide copy, as well as the new contact sheet.

I compared content against ref/ (ref_small/) and the look against ref/reel/f01-f06 (strip at qa/v4_artefacts/reel_strip.png). The reel's look is a bright, clean low-poly diorama with toy-like plastic materials. The v4 renders now broadly match it, so style is **not** penalized below. The findings are about content, process, continuity, scale, framing and legibility.

**Root-cause update:** v4/main.js now imports `worker.js` (line 15) and `wrappedSkid.js` (line 16). Workers in every frame are worker.js figures, with vests, hands, badges and hip scanners, and their faces are plain. wrappedSkid is used for 5 skids at x ≈ −5, z 13.5-16.6 (main.js line 601) and for the pharmacy pallet (line 555). However, the 5 wrapped skids appear in no reviewed frame.

## Files reviewed (`ls -la --time-style=full-iso`, EDT -04:00; re-checked at 03:42:04 and 03:45:25, with no further changes)
| Path | mtime | Size (B) | Notes |
|---|---|---|---|
| preview/v4_desktop.png | 2026-10-31 03:42:00.586705992 -0400 | 486095 | 1280x800 landing (dot 1/15) |
| preview/v4_phone.png | 2026-10-31 03:42:00.590706071 -0400 | 147994 | 390x844 landing |
| preview/v4_01_truck.png | 2026-10-31 03:42:00.594706150 -0400 | 231023 | Re-rendered; content changed a lot |
| preview/v4_02_breakdown.png | 2026-10-31 03:42:00.598706229 -0400 | 367117 | |
| preview/v4_03_roller.png | 2026-10-31 03:42:00.602706308 -0400 | 441366 | |
| preview/v4_04_sort.png | 2026-10-31 03:42:00.606706387 -0400 | 661118 | |
| preview/v4_05_floor.png | 2026-10-31 03:42:00.610706466 -0400 | 347605 | |
| preview/v4_06_stock.png | 2026-10-31 03:42:00.614706545 -0400 | 328289 | |
| preview/v4_07_dsd.png | 2026-10-31 03:42:00.618706624 -0400 | 394112 | |
| preview/v4_08_snack.png | 2026-10-31 03:42:00.622706703 -0400 | 253624 | |
| preview/v4_09_pharm.png | 2026-10-31 03:42:00.626706781 -0400 | 281047 | |
| preview/v4_10_baler.png | 2026-10-31 03:42:00.630706861 -0400 | 250463 | |
| preview/v4_11_omni.png | 2026-10-31 03:42:00.634706939 -0400 | 251043 | |
| preview/v4_12_fashion.png | 2026-10-31 03:42:00.638707018 -0400 | 268123 | |
| preview/v4_13_claims.png | 2026-10-31 03:42:00.642707097 -0400 | 271007 | |
| preview/v4_14_overview.png | 2026-10-31 03:42:00.646707176 -0400 | 503802 | Now the last step (dot 15/15) |
| preview/v4_15_overview.png | 2026-10-31 03:22:06.873321320 -0400 | 403227 | **Stale and orphaned**: not re-rendered, and the rail now has 15 dots with v4_14 last |
| parts/v4/preview/v4_models.png | 2026-10-31 03:32:11.669514697 -0400 | 1925763 | 1800x1680, a 4x4 grid of 450x420 tiles |
| parts/v4/preview/v4_models_final.png | 2026-10-31 03:32:11.829514177 -0400 | 1925763 | Byte-identical to v4_models.png (`cmp`) |
| parts/v4/preview/trucks_test.png / worker_test.png | 03:29:27.141933867 / 03:29:28.501931454 | 261755 / 286503 | Unchanged since the 03:31 review |
| parts/v4/preview/contact.html / trucks_test.html / worker_test.html | 03:25:07.873969350 / 03:29:23.369940454 / 03:27:22.258065174 | 11148 / 3708 / 2716 | Unchanged |
| parts/v4/README.md | 2026-10-31 03:32:05.525534517 -0400 | 6822 | Read in full |
| parts/v4/compactor.js | 2026-10-31 03:32:05.517534543 -0400 | 6490 | |
| parts/v4/materials.js / mckessonTote.js / popSkid.js | 2026-10-31 03:31:24.005660623 -0400 | 5619 / 6075 / 7800 | plasticRed is 0x52101c |
| v4/main.js / body.html / a7_ui.js | 03:39:42.443508058 / 03:38:40.815794194 / 03:39:42.395506767 | 107796 / 7645 / 12259 | Now imports worker.js and wrappedSkid.js; news strip at body.html:31 and a7_ui.js:89-93 |

Refs compared: ref_small/backroom_1, backroom_2, wrapped_skid_ref, pop_skid_1/2/3, mckesson_tote_1/2 (tote body sampled at about #68192b, which matches plasticRed 0x52101c), dsd_truck_*; reel f01-f06.

New artefacts (qa/v4_artefacts/):
- Downscales: `v4_models_0332_390w.png`, `v4_*_0342_390w.png` (all 17 scene renders), `reel_small/`, `reel_strip.png`, `ref_strip_pop_tote.png`.
- Contact-sheet tiles: `m0332_<tile>.png` for all 16 tiles, plus 2x zooms `m0332_pop_zoom`, `m0332_tote_zoom`, `m0332_comp_zoom` and `m0332_baler_jackpull_drivers.png`.
- Scene crops: `c0342_01_worker_roller`, `c0342_02_card_ghost`, `c0342_03_fg_worker`, `c0342_04_red_slab`, `c0342_04_roller_gaps`, `c0342_07_pop_float`, `c0342_07_vendors_jack`, `c0342_08_cabs`, `c0342_08_snack_truck`, `c0342_09_tote_pallet`, `c0342_desk_cubes`, `c0342_news_ticker`.

## Findings (worst first)

### BLOCKER-4 (still open; notified as item 1): Jacks and vehicles still run without visible operators, and no one is shown pulling a jack in any story frame (check 3)
- **Files and regions:**
  - v4_02_breakdown.png, centre: the jack at the dock door is unattended. The only person in the frame is behind the card (MAJOR-20).
  - v4_03_roller.png, right-middle: the jack is unattended.
  - v4_05_floor.png, centre-right: the jack stands about 1 m from the pallet, not engaged, and the worker walks past it. The card says he "pulls each finished skid … with a pallet jack".
  - v4_06_stock.png: same as v4_05; the jack is detached and nobody is at its handle.
  - v4_07_dsd.png (c0342_07_vendors_jack.png): "Beverage vendor" stands about 1.2 m from his jack with his arms at his sides, the second vendor faces away, and the left jack under the kraft skid at the truck has no one at it. The card says "The vendor pulls the skid in".
  - v4_09_pharm.png (c0342_09_tote_pallet.png): yellow forks are just visible under the tote pallet, but there is no handle and no puller. The associate walks beside the pallet. The card says "An associate pulls it … with a pallet jack".
  - v4_08_snack.png: the "Snack Vendor reversing to door" red box truck (c0342_08_snack_truck.png) has no readable driver, and the blue tractor's cab is cropped at the frame bottom-left.
  - v4_desktop.png, v4_14: tractor cabs show no occupant at this distance.
- **Improved:** v4_08's yard vehicle now has a full-scale worker head under the canopy (c0342_08_cabs.png). The contact sheet's @jackPull tile shows a correct, readable pull pose.
- **Fix:** Use the @jackPull composition (`wPull` with `gripPoint`) for the v4_05/06 skid, the v4_07 vendor and the v4_09 associate. Engage the jack under the pallet, raise the handle about −0.76 rad, and put the hand on the grip. Seat `wSeat` drivers in the v4_08 red box truck and the tractor, and frame the shot so the windshield with the driver is visible.

### BLOCKER-1 (still open, partly changed; notified as item 4): A news feed is now on every story frame, and v4_14 is still a text-data panel (check 5)
- **Files and regions:**
  - Every 03:42 frame, bottom-left (c0342_news_ticker.png): a persistent "News · Walmart Canada launches AI shopping assistant Sparky - BNN Bloomberg…" strip. It expands into a 5-item Google News list (body.html:31) and live-fetches through api.allorigins.win (a7_ui.js:93).
  - v4_14_overview.png, left 45%: a "High-shrink ('put line items'): Div 1: 2, 5, 46, 72 · …" code line, plus a 9-line "Pay-for-scan" callout naming vendors.
  - v4_15_overview.png (stale, 03:22) still shows the KPI tiles, but body.html no longer contains them.
- **Changes since 03:31:** The KPI tiles appear to be removed (no `.live` markup in body.html), and the 11-row division table is gone. However, the headlines moved from one overview into a ticker on all 15 frames, which makes the clutter more visible, not less.
- **Fix:** Delete `#newsBar` (body.html:31), the news IIFE (a7_ui.js:89-93), news.json and the third-party fetch. Cut v4_14 to one plain sentence. Delete or re-render v4_15.

### BLOCKER-2 (still open, partly fixed; notified as item 5): The step about stretch-wrapped skids still shows bare boxes (checks 1 and 6)
- **Files and regions:**
  - v4_02_breakdown.png, right and centre: the card says "Mixed skids, stretch-wrapped … about 1.9 m tall", but every skid is unwrapped. The right skid is still 2 columns with a gap. The 3 skids in front are about 0.6 m high, one layer.
  - v4_desktop.png and v4_14: the trailer loads are loose cases, which is fine for floor-loaded freight, but no wrapped skid is visible on the floor anywhere.
- **Improved:** The cartons are now kraft and white with tape and barcodes, so the saturated toy colours are gone from the backroom. v4_09 shows a wrapped tote pallet (see MINOR-12). The contact sheet's wrapped skids (seeds 1, 4 and 7) are good: 1.27 × 1.91 × 1.07 m, mixed kraft and white, labels, banded film. The 5 wrapped skids in code (main.js:601, x ≈ −5, z 13.5-16.6) are in no story camera.
- **Fix:** Point the step 2 camera at the wrapped skids, or move them to the breakdown spot. Show one 1.9 m wrapped skid with its wrap partly cut and a worker cutting it, next to an empty-pallet stack.

### MAJOR-17 (NEW, replaces BLOCKER-5): The opening frame now shows the trailer, but the unloader is fused into the roller head and isn't lifting anything (checks 6 and 2)
- **File and region:** v4_01_truck.png, centre (c0342_01_worker_roller.png).
- **Problem:** The worker stands at the roller's far end with his lower body hidden. The roller runs into his hips, so he is either standing in or on the conveyor. His hands hang at his sides. A grey slab (dock plate or trailer-floor edge) crosses the frame at his chest height, in front of the roller, and the roller seems to pass under it. The "Roller head" tag sits on his torso. A stray blue "Wa…" trailer graphic floats outside the right trailer wall. Only one case is on the roller.
- **Improved:** BLOCKER-5 is resolved. The blur is gone, and the frame now shows the open trailer, floor-loaded kraft and white cases, the roller head and a person.
- **Fix:** Put the worker beside the roller head, with his feet on the trailer floor, in `carryPose`, holding a case over the rollers. Make the dock leveler a sloped plate at floor level that the roller sits on. Move the tag to the roller's end. Put 3-5 cases spaced along the roller.

### MAJOR-18 (was BLOCKER-6, downgraded): The v4_05 to v4_06 continuity is improved but still not believable (check 2)
- **Files:** v4_05_floor.png, v4_06_stock.png.
- **Improved:** The worker now persists between the frames.
- **Problem:** The pallet goes from 2 cases (v4_05) to empty (v4_06) while the worker stands idle with empty hands. The cases reappear as unopened kraft cartons on the shelf, which contradicts the card's "the product goes into the empty spots". A 2-case pallet also isn't a "finished skid". The jack is detached from the pallet in both frames.
- **Fix:** In v4_05, show a 6-10 case Dept 46 skid on an engaged jack, with the worker pulling it. In v4_06, show 3 cases left, one case open, and product facings going into a visible gap.

### MAJOR-19 (NEW): A Zebra handheld floats above the pop skid (check 6)
- **File and region:** v4_07_dsd.png, bottom-right (c0342_07_pop_float.png).
- **Problem:** A black-and-yellow handheld hovers about 0.2-0.3 m above the shrink layer, not resting on anything and not in anyone's hand.
- **Fix:** Put it in the DSD associate's hand (`attachHandsTo` or the `grip` pivot), or lay it on the pack top at y = skid top.

### MAJOR-20 (NEW): The breakdown step's only worker is hidden behind the card (checks 3 and 2)
- **File and region:** v4_02_breakdown.png, left (c0342_02_card_ghost.png). A worker is faintly visible through the translucent card. Outside the card, the frame shows no person at all.
- **Fix:** Frame the breakdown in the right 60% of the viewport, with the worker cutting the wrap and a partner feeding the roller, both outside the card's rectangle.

### MAJOR-21 (NEW): The camera clips a foreground worker (unreadable framing)
- **File and region:** v4_03_roller.png, bottom-left (c0342_03_fg_worker.png). A giant cropped head, shoulder and vest fill the lower-left corner, as if the camera were inside the person.
- **Fix:** Keep the camera at least 1.5 m from every worker, or hide workers inside the near frustum for that shot.

### MAJOR-1: Trailers are roofless cutaways (still open)
v4_08_snack.png, right (white Walmart trailer, ribs and cargo seen from above); v4_14; v4_desktop; v4_phone. Fix: close the roofs and keep cutaways for "Explore 3D".

### MAJOR-2: Pallets are still mostly black (partly fixed)
- **Still black:** v4_02 (all), v4_04 (most), v4_05 and v4_06 (glossy black with teal slats), v4_12 (left).
- **Now red:** v4_03 (several), v4_07 (left), v4_12 (right), the v4_desktop sort area.
- **Contact sheet:** natural, blue and red as intended.
- **Fix:** Render every scene pallet with `PM.woodVC` and the `_pallet.js` seed paint (about 40% CHEP blue, 15% red, 45% natural). No black pallets.

### MAJOR-3: Roller layout still zig-zags (still open, possibly improved)
v4_04_sort.png, centre-left (c0342_04_roller_gaps.png): 3 sections meet at sharp angles, and the joins sit behind the card, so continuity can't be verified. v4_03 looks continuous. Fix: one continuous run with ends touching at the same rollerTopY, and capture the joins in frame.

### MAJOR-4: Signs render as barcode stripes (still open)
v4_11_omni.png, top; v4_12_fashion.png, top; v4_02_breakdown.png, upper-left; v4_desktop.png, right wall. Fix: as before (double-sided, with the correct orientation and aspect).

### MAJOR-5: Toy-block products and unidentified monoliths (still open, plus a NEW sub-item)
- **Still open:** v4_05 and v4_06 gondolas hold 0.4-0.5 m solid-colour bricks; v4_12 garments are slabs with no hangers; v4_10 left has a single 1 m cardboard cube.
- **(NEW)** v4_desktop.png, centre-right, and v4_14, centre (c0342_desk_cubes.png): an unlabelled red block and a blue block, each about 1.5-2 m tall, stand in the sort area. They match no object in backroom_1/2.
- **Fix:** As before for the products. Identify the monoliths (a wrap-recycle bin? a cage?), then model and label them or remove them.

### MAJOR-8: Interpenetration and ghost poses (partly fixed)
- **Fixed:** the v4_05 arm through the shelf, the v4_09 forearms in the desk, and the v4_13 zombie arms.
- **Still open:** v4_12 ghost legs under the Z-rack. v4_01 is now MAJOR-17.
- **Fix:** Move the v4_12 worker to the rack's open end, hanging an item.

### MAJOR-9: Too empty versus backroom_1/2 (still open)
v4_09 is a white void around a single pallet. v4_11 has no people. v4_13's cage is nearly empty. Fix: as before (loose cartons, bins, a wrap ball, an EXIT sign, LED strips, contact shadows).

### MAJOR-10: Phone legibility (still open)
v4_phone.png: the "Stocking 2 · sorting by dept" tag is still clipped at the right edge, and the news ticker is truncated ("…assis"). In the `_0342_390w` copies, v4_07's "Receiving · Check-in · invoices · memos" subtitle and the "Beverage Vendor" placard, v4_08's "FDS" placard and the desktop Cooler/Freezer door plaques are illegible. Fix: as before, and render every step at 390x844.

### MAJOR-11: Step numbering (partly fixed)
The rail now has 15 dots for 15 frames (desktop plus v4_01-v4_14). But "STEP 7" is still on both v4_07 and v4_08, "STEP 8" is on v4_11, v4_12 and v4_13, v4_09 says "PHARMACY", and v4_10 "MORNING PRE-OP" sits mid-night. Fix: as before.

### MAJOR-12: Aerial dollhouse landing (still open)
v4_desktop.png, v4_phone.png, v4_14. Fix: as before (an eye-level backroom opener).

### MINOR-1: The card hides the subject
v4_02 (MAJOR-20), v4_13 (the worker is half behind the card, and his scanning isn't visible), v4_10 (the compactor is mostly behind the card).

### MINOR-2: Card promises that aren't shown
v4_02 says "Empty pallets are stacked by the wall", but there are none. v4_01 says "placard CP", but no placard is visible on the trailer.

### MINOR-3: Idle workers
v4_04: both sorters stand arms-down beside the roller, with no box in hand. v4_10 stands still (acceptable for a check). v4_13 isn't scanning.

### MINOR-4: Tag over sign
v4_10: the "Baler" tag still covers "Cardboard baler" sign text. (NEW) In v4_desktop and v4_phone, a second dark tag sits under "Stocking 2 · sorting by dept" just below "Department skids" (a collision).

### MINOR-5: Dev chrome on the contact sheet (still open)
v4_models.png: the @boxTruckDriver, @tractorDriver and @jackPull tiles still read "? × ? × ? m · meshes N (ud ?)". Fine for QA only.

### MINOR-6: Stale or duplicate renders (updated)
v4_15_overview.png (03:22) is stale and now orphaned (the rail ends at v4_14), and it still shows the removed KPI tiles. v4_models_final.png is byte-identical to v4_models.png. Fix: delete v4_15, and stamp a build hash on the renders.

### MINOR-7: worker_test.png is stale (updated)
In the 03:42 scene the faces are plain, so the painted-face issue looks fixed in the scene. But worker_test.png (03:29:28) still shows the old painted faces, and the floating steering wheel can't be re-checked. Fix: re-render worker_test.

### MINOR-8 (was MAJOR-13, downgraded): Pop skid is better but still not quite the ref
- **File and region:** v4_models.png, row 1 tile 2 (m0332_pop_zoom.png), and v4_07 right.
- **Improved:** The cans are now grouped into packs under a translucent shrink shell, with a barcode label per pack, on a natural pallet. This is close to pop_skid_1/2/3.
- **Still wrong:** The cans are a perfectly even grid with no pack seams or cardboard trays. The 2 L bottles are tall black cones in the tile and featureless black prisms in v4_07. In the refs the bottles have coloured labels and caps, and the packs are stacked 2 high.
- **Fix:** Add coloured label bands and red or white caps on the bottles, gaps between packs, and a second pack layer on half the skid.

### MINOR-9 (NEW): Compactor decals read as confetti
- **File and region:** v4_models.png, row 2 tile 4 (m0332_comp_zoom.png).
- **Problem:** The rust and bolt decals show as a row of yellow and black dots along the bottom edge and the chute. At 390 px they look like hazard tape or noise, not rust. The rest of the tile matches what a backroom compactor looks like: green body, through-wall chute frame, hydraulic cylinder, 6.05 m length.
- **Fix:** Use a few soft brown streaks under the ribs and drop the dot rows.

### MINOR-10 (NEW): Driver tiles can't show the drivers
- **File and region:** v4_models.png, row 4 tiles 1-2 (m0332_baler_jackpull_drivers.png).
- **Problem:** The cab fills the tile, and the driver is a faint shape behind tinted glass. At 390 px no driver is readable.
- **Fix:** Pull back to a 3/4 front view with a lighter glass tint (opacity ≤ 0.3).

### MINOR-11 (NEW): The v4_08 card and tag disagree
- **File:** v4_08_snack.png.
- **Problem:** The card says "The tractor-trailer reverses slowly to its door", but the "Snack Vendor reversing to door" tag points at a red straight box truck. The only tractor-trailer in the frame is labelled "Beverage Vendor".
- **Fix:** Make the text and the vehicle match.

### MINOR-12 (NEW): The pharmacy pallet's wrap reads as a glass display case
- **File and region:** v4_09_pharm.png, centre (c0342_09_tote_pallet.png).
- **Problem:** The film has vertical tube highlights at the corners and mid-faces, so it looks like a glass cabinet with posts. The tote content itself is now correct: maroon totes, about 3 per layer, cartons on top and a memo, which resolves MAJOR-7.
- **Fix:** Use the wrappedSkid film (banded streaks, no posts) and a slight inward bulge.

### MINOR-13 (NEW): The McKesson tote has a strap the refs don't show
- **File and region:** v4_models.png, row 1 tile 3 (m0332_tote_zoom.png).
- **Problem:** The colour (0x52101c) now matches mckesson_tote_1/2 (about #68192b), and the memo across the seam matches too. But the white strap and buckle don't appear in the refs, where the memo sits across the closed flaps with no strap.
- **Fix:** Drop the strap, or make it a thin clear tie.

## Previous findings status (03:31 review)
| Previous ID | Status at 03:46 |
|---|---|
| BLOCKER-1 dashboard/data | **Open, changed**: KPI tiles and table removed; the news ticker is now on every frame; v4_14 is still a text-data panel |
| BLOCKER-2 no wrapped skids | **Open, partly fixed**: wrappedSkid is imported and used, but no wrapped skid shows in step 2 |
| BLOCKER-3 "faceless capsule placeholders" | **Resolved.** Restated per the style calibration: the real issue was missing content (no hands, vest, badge or scanner, and worker.js not used). Faceless low-poly people are on-style. The scene now uses worker.js everywhere, with vests, hands, badges and holsters. Leftover pose problems are in MINOR-3 and MAJOR-8 |
| BLOCKER-4 no operators | **Open** (above); the yard-vehicle driver is improved |
| BLOCKER-5 blank first frame | **Resolved**; new content issues are in MAJOR-17 |
| BLOCKER-6 skid/worker vanish | **Downgraded** to MAJOR-18 |
| MAJOR-6 gondola and yard-driver scale | **Resolved**: gondolas are now about 2 m against a 1.78 m worker, and the yard driver is full scale |
| MAJOR-7 no pharmacy tote | **Resolved**: a tote pallet is visible (wrap look in MINOR-12) |
| MAJOR-13 pop skid | **Downgraded** to MINOR-8 |
| MAJOR-14 baler planks | **Resolved**: v4_10 shows flattened kraft sheets in the chamber, and the baler tile shows a layered strapped bale. The v4_10 cube is still in MAJOR-5 |
| MAJOR-15 snack trailer as a container | **Resolved**: the snack vendor is now a red box truck, and the blue tractor-trailer has a pleated curtain |
| MAJOR-16 squash animations | **Resolved per README** (03:32: rear door slides, curtain bunches, landing gear translates, "no scaling"); not verified in motion |
| MINOR-5 / MINOR-7 | Updated above |

## Blockers already notified to Soros (for dedupe)
From the 03:17 EDT review:
1. Vehicles have no drivers or operators (check 3)
2. No scene render, so most checks are unverifiable (resolved 03:21)
3. The worker is a cartoon mannequin (check 6)

New in this review (reported back 03:31 EDT):
4. Dashboard and data clutter is back in the story (v4_15 "Live store data" KPI tiles and headlines; v4_14 division table)
5. No stretch-wrapped skids anywhere; the scene doesn't use wrappedSkid.js
6. People are faceless capsule placeholders; the scene doesn't use worker.js
7. The story's first frame shows nothing (v4_01 blurred trailer wall)
8. A loaded skid and its worker vanish between steps 5 and 6 (v4_05 → v4_06)

## Counts
- **BLOCKER: 3** (all already notified: BLOCKER-4, -1, -2; **0 new**). Resolved: BLOCKER-3 and BLOCKER-5. Downgraded: BLOCKER-6.
- **MAJOR: 15** (MAJOR-17, -19, -20 and -21 are new; MAJOR-18 is the former BLOCKER-6; open: MAJOR-1, 2, 3, 4, 5, 8, 9, 10, 11, 12). Resolved: MAJOR-6, 7, 14, 15 and 16. Downgraded: MAJOR-13.
- **MINOR: 13** (MINOR-9 to 13 are new; MINOR-8 is the former MAJOR-13).
