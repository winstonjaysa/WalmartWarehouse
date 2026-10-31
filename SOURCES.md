# v4 — sources (walmart-store_v4.html)

Concept demo · not affiliated with Walmart Inc. · All data synthetic. No live numbers are shown; the "Live store data" panel is a placeholder for a future API.

## Store process
- **Store receiving notes** (provided by the user): routing table "How receiving routes items", the high-shrink "put line items" list, the pay-for-scan (memo only, don't scan) list, the FGX dept 49 → Vision Centre rule, the fixtures/supplies memo rule, and the baler/compactor/wave morning pre-op checks. The DSD receipt and pharmacy memo photos were used only for the shape of the props. No figures, store number, address, PO or invoice numbers are reproduced.
- The user's backroom photos were used for the look: white walls, yellow bollards and rails, cooler/freezer doors, blue/red pallets, the skate-wheel roller, the EXIT sign and the truss ceiling.
- Teams: Stocking 2 = backroom/unload, Stocking 3 = overnight (Walmart Canada job titles); DSD associate duties come from a Walmart Canada job posting (see research/v4_facts.md).
- Truck placards: FDS, CP, ADS and MP appear only as letters on placards. MP = Meat & Produce (employee usage). FDS, CP and ADS are **not verified**, so the demo gives them no meaning.

## Department names used in the scene
| Dept | Name shown | Sources |
|---|---|---|
| 1 | Candy & Tobacco | A, B, C, D |
| 2 | Health & Beauty | A, C, D |
| 4 | Paper Goods | A, B, C, D |
| 7 | Toys | A, B, D |
| 8 | Pets | A, B, D |
| 9 | Sporting Goods | A, B, D |
| 11 | Hardware | A, B, D |
| 13 | Household Chemicals | A, B, D |
| 14 | Kitchen & Dining | A, C, D |
| 40 | OTC Pharmacy | A, B, D |
| 46 | Cosmetics | A, B, D |
| 72 | Electronics | A, B, D |
| 92 | Dry Grocery | A, B, D |

Depts 15, 21, 28 and 84 have conflicting names between the Canadian and US sources, so they are shown only as "Dept NN". The full table and confidence levels are in research/v4_facts.md.

- [A] Walmart vendor-support PDF "Division & Department Number Listing": https://wmgbs-support.custhelp.com/ci/fattach/get/1721328/
- [B] https://consumergravity.com/walmart-department-numbers/
- [C] http://www.8thandwalton.com/resources/walmart-departments/
- [D] r/WalmartCanada "Fashion departments": https://www.reddit.com/r/WalmartCanada/comments/z94u7k/fashion_departments/
- [E] r/walmart jargon list: https://www.reddit.com/r/walmart/comments/iykxcv/updated_walmart_jargon_acronyms_initialisms_and/

## News strip
Headlines and links only, from the Google News RSS search "Walmart Canada" (hl=en-CA). They are baked in at build time (v4/news.json), with an optional live refresh through allorigins.win that falls back silently.

## 3D models
Pallet jack, pop/DSD skid, skate conveyor, baler, compactor, DSD box truck, tractor and curtain-side trailer, McKesson tote, handheld, worker (walk / carry / jack-pull / seated-drive poses) and 1.9 m stretch-wrapped skid come from parts/v4 (Inky). The pharmacy pallet uses _pallet.js, instanced mckessonTote.js totes (3 per layer, 2 or 3 layers on alternating nights), 2-4 cartons and the wrappedSkid.js film shell, with a generic delivery memo (no store, PO or invoice identifiers). Everything else is built procedurally in v4/a*.js. Three.js r160 loads from unpkg.
