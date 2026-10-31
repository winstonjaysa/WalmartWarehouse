# v4 facts: Walmart Canada backroom and overnight stocking

Researched 2026-10-31 (America/Toronto). Research only; no build files were touched. I had a 15-minute limit, so some items are gaps and are marked that way.
Confidence: **High** = official Walmart or several reliable sources · **Med** = employee or ex-employee sources (Reddit, forums) or third-party vendor sites · **Low/UNVERIFIED** = one anecdote or my own inference.

## TL;DR
- The division-to-department grouping in the user's SAP notes matches a published Walmart prototype division list almost exactly (Div10=38/40, 15=25, 24=80/93/97, 25=94, 26=90/91, 27=81/98, 28=1/92/95/96, 30=49/50, 31=6/85, 45=58/87). That list is a US source (consumergravity.com), so it is **Med**. It does suggest Canada uses the same division structure.
- Most department names are confirmed by an official Walmart vendor-support PDF (wmgbs-support, US) and an r/WalmartCanada list. The Canada list differs in a few places: 15 = Small Appliances, 21 = Window Coverings, 28 = Infant consumables (US: Clinics, Books & Magazines, Hosiery).
- **Truck codes:** **MP = Meat/Produce** truck (Med; employee usage on Reddit). **FDD = Frozen/Dairy (fresh) truck** is the code employees actually use, in both Canada and the US. **FDS, ADS and CP are NOT confirmed** for Walmart Canada stores. Treat them as UNVERIFIED. ("CP" shows up in a US DC role title, "non-con/CP Voice", but I found no definition.)
- **Stocking 1 / 2 / 3** are official Walmart Canada job titles. Stocking 2 = backroom and unloading. Stocking 3 = overnight. Stocking 1 = daytime floor stocking and picks (Med; the job posting 404'd). So "Stocking 2 = overnight" is **wrong**: overnight is Stocking 3.
- A Walmart Canada posting confirms that the Directs Store Delivery (DSD) Associate handles direct and local vendors, OMNI, alcohol and warehouse trailers; prepares returns, claims and MTRs; and keeps the cold-chain log (Receiving Temperature Log / Sure Check app). Minimum age is 16.
- Since 2023, Canadian overnight crews are again responsible for all RDC/HVDC freight except fashion (Med, r/WalmartCanada).
- The baler age limit is **under 19 cannot operate**, per the sign on one Canadian store's baler (Low, one anecdote). In the US, the federal minimum is 18 (DOL). Treat any Canada number as UNVERIFIED unless Walmart Canada policy confirms it.
- **News strip recommendation:** fetch Google News RSS (`hl=en-CA`) **at build time**. It returns HTTP 200 with 35 items but sends **no** ACAO header, so a browser can't read it directly. Bake it into static JSON. Live fallback: allorigins (it returned 200 with a reflected ACAO header on the Google News URL, but a 522 on another URL, so it is flaky). rss2json sends `ACAO: *` but returned 429 without an API key.
- walmartcanada.ca/news exists as HTML (200 after a 302), but I found no RSS feed (`/news/rss` returns 404). corporate.walmart.com/rss also returns 404.

---
## 1. Department numbers

Sources:
- [A] Walmart vendor support PDF "Division & Department Number Listing" (official, US, "prototypical"): https://wmgbs-support.custhelp.com/ci/fattach/get/1721328/
- [B] consumergravity.com dept and division list (third party, US): https://consumergravity.com/walmart-department-numbers/
- [C] 8th & Walton list (US vendor consultancy): http://www.8thandwalton.com/resources/walmart-departments/
- [D] r/WalmartCanada "Fashion departments" thread. The poster says the list was "stolen from the internet, but can verify accuracy": https://www.reddit.com/r/WalmartCanada/comments/z94u7k/fashion_departments/
- [E] r/walmart jargon list (US): https://www.reddit.com/r/walmart/comments/iykxcv/updated_walmart_jargon_acronyms_initialisms_and/

What the user's note says (read from the image): Div 1 = 2-24, 26-36, 72, 46, 82 "(Not 6, 87)". Dept 84 under Div 28 is written in blue ink, so it was added later. There is also a "Put Line Items" section: High shrink Div1 = 2, 5, 46, 72; Div31 = 6; Div28 = 92, 95; Div45 = 87.

| Dept | Name | User's SAP Div | Source | Conf. | Canada-specific? |
|---|---|---|---|---|---|
| 1 | Candy & Tobacco | 28 | A,B,C,D | High | D yes |
| 2 | Health & Beauty Aids / Personal Care | 1 | A,C,D | High | D yes |
| 3 | Stationery | 1 | A,B,C,D | High | D yes |
| 4 | Household Paper / Paper Goods (NOT stationery) | 1 | A,B,C,D | High | D yes |
| 5 | Media & Gaming | 1 | A,B,C,D | High | D yes |
| 6 | Cameras & Supplies | 31 | A (Div31),B,D | High | D yes |
| 7 | Toys | 1 | A,B,D | High | D yes |
| 8 | Pets & Supplies | 1 | A,B,D | High | D yes |
| 9 | Sporting Goods | 1 | A,B,D | High | D yes |
| 10 | Automotive | 1 | A,B,D | High | D yes |
| 11 | Hardware | 1 | A,B,D | High | D yes |
| 12 | Paint & Accessories | 1 | A,B,D | High | D yes |
| 13 | Household Chemicals | 1 | A,B,D | High | D yes |
| 14 | Kitchen & Dining / Cook & Dine / Housewares | 1 | A,C,D | High | D yes |
| 15 | Canada: Small Appliances (D) · US: Health & Wellness Clinics (B,C) | 1 | D vs B,C | Med (conflict) | D yes |
| 16 | Lawn & Garden / Outdoor Living | 1 | A,B,D | High | D yes |
| 17 | Home Decor (D: "Home Decor & Furniture") | 1 | A,B,D | High | D yes |
| 18 | Seasonal | 1 | A,B,D | High | D yes |
| 19 | Fabrics & Crafts | 1 | A,B,D | High | D yes |
| 20 | Bath & Shower | 1 | A,B,D | High | D yes |
| 21 | Canada: Window Coverings (D) · US: Books & Magazines (A,B) | 1 | D vs A | Med (conflict) | D yes |
| 22 | Bedding | 1 | A,B,D | High | D yes |
| 23 | Menswear | 1 | A,B,D | High | D yes |
| 24 | Boyswear | 1 | A,B,D | High | D yes |
| 25 | Shoes | 15 | A (Div15),B,D | High | D yes |
| 26 | Infant Apparel | 1 | A,B,D | High | D yes |
| 27 | Ladies' / Family Socks | 1 | A,B,D | High | D yes |
| 28 | Canada: Infants consumables (D) · US: Hosiery (A,B,C) | 1 | D vs A | Med (conflict) | D yes |
| 29 | Sleepwear (D: Ladies Sleepwear) | 1 | A,B,D | High | D yes |
| 30 | Foundations / Bras (D: "Bras and family underwear") | 1 | A,B,D | High | D yes |
| 31 | Accessories (D: Handbags & Accessories) | 1 | A,B,D | High | D yes |
| 32 | Jewelry | 1 | A (US = Div11),B,D | High (name). The div differs: in the US it is Div11, but the user's note has it in Div1 | D yes |
| 33 | Girlswear | 1 | A,B,D | High | D yes |
| 34 | Ladieswear | 1 | A,B,D | High | D yes |
| 35 | Plus Size & Maternity | 1 | A,B,D | High | D yes |
| 36 | Ladies Outerwear (D: "Ladies seasonal") | 1 | A,B,D | High/Med | D yes |
| 40 | OTC Pharmacy (38 = Rx) | 10 | A (Div10),B,D | High | D yes |
| 46 | Cosmetics / Beauty | 1 | A,B,D | High | D yes |
| 49 | Optical (50 = Optical service income) | 30 | B (Div30),C,D | High | D yes |
| 72 | Electronics | 1 | A,B,D | High | D yes |
| 80 | Service Deli | 24 | A,B (Div24),D | High | D yes |
| 81 | Commercial Bread | 27 | A,B (Div27),D | High | D yes |
| 82 | Impulse Merchandise & Batteries | 1 | A,B,D | High | D yes |
| 83 | Seafood (B calls it "defunct" in the US) | 24 | A,B,D | Med | D yes |
| 84 | Balloons & Flowers (US, "defunct" per B) | 28 (blue ink) | A,B,C | Med. UNVERIFIED for Canada | no |
| 85 | Photo Lab / 1-Hour Photo | 31 | B (Div31),C,E | Med-High | no |
| 87 | Wireless | 45 | A (Div45),B,D | High | D yes |
| 90 | Dairy | 26 | A,B (Div26),D | High | D yes |
| 91 | Frozen Food | 26 | A,B,D | High | D yes |
| 92 | Dry Grocery | 28 | A,B,D | High | D yes |
| 93 | Fresh/Frozen Meat (& Seafood) | 24 | A,B,D | High | D yes |
| 94 | Produce | 25 | A,B (Div25),D | High | D yes |
| 95 | DSD Grocery, Snacks & Beverages | 28 | A,B,D | High | D yes |
| 97 | Packaged / Prepackaged Deli ("wall deli") | 24 | A,B,C,D | High | D yes |
| 98 | Bakery | 27 | A,B,D | High | D yes |

Notes:
- In source A, divisions 24 to 28 are not used (the fresh departments sit in Div 1 and are marked "^"). Source B and the user's notes use the split divisions. Both lists call themselves "prototypical; your store may be different."
- No official Walmart Canada department list was found (gap). Associates can see department sales in the Me@Walmart app [D], and the item inquiry screen at the till shows "D##" ([r/WalmartCanada](https://www.reddit.com/r/WalmartCanada/comments/mwnzna/walmart_cashier_help/)). Either one could confirm the Canada names in-store.
- Dept 96 (Liquor) appears under Div28 in B. It is not in the user's notes, which may reflect provincial liquor rules (inference, UNVERIFIED).

## 2. Truck and freight codes (FDS, CP, ADS, MP)
| Code | Finding | Source | Conf. |
|---|---|---|---|
| MP (M/P) | **Meat & Produce** truck. One US post describes an "M/P truck… 6 pallets meat, 13 produce." A Canadian post says "FDD trucks… MP varies… 15+ pallets every night" and calls the fresh trucks "produce/meat or dairy/frozen." | https://www.reddit.com/r/walmart/comments/1ck46mt/what_is_going_on_with_meat_and_produce/ · https://www.reddit.com/r/WalmartCanada/comments/1ekap8l/trucks/ | Med (US and Canada usage agree) |
| FDD | Dairy/Frozen fresh truck. This is the employee term in Canada and the US. I don't know what the letters stand for (UNVERIFIED). | same r/WalmartCanada thread · https://www.reddit.com/r/walmart/comments/18yfnc7/latest_arrival_for_fdd/ | Med (meaning of the letters UNVERIFIED) |
| FDS | **Not confirmed.** The only "FDS" hit was "FDS Express," a carrier on Walmart Marketplace (unrelated). It might be a variant or misreading of FDD (inference). | https://developer.walmart.com/global-marketplace/lang-fr_CA/docs/supported-carrier-names | UNVERIFIED |
| ADS | **Not confirmed.** Walmart Canada officially uses **ADC = Ambient Distribution Centre** (Vaughan, opened 2025) and **RDC = Regional Distribution Centre**. Employees also mention "HVDC" freight. ADS might relate to "ambient," but that is only an inference. | https://www.walmartcanada.ca/news/2025/10/16/walmart-canada-s-most-advanced-distribution-centre-opens-in-vaug · https://www.walmartcanada.ca/news/2024/03/21/walmart-canada-s-supply-chain-gets-a-high-tech-makeover--how-we- · https://www.reddit.com/r/WalmartCanada/comments/14qvkax/need_info_about_changes_to_on_work/ | UNVERIFIED |
| CP | **Not confirmed.** "CP" appears in a US Walmart DC role title ("non-con/CP Voice") with no definition. A search summary claimed CP = Canada Post, but nothing on any page I opened supports that. | https://www.reddit.com/r/walmart/comments/uhc4p4/any_other_dc_people_in_here_im_nonconcp_voice/ | UNVERIFIED |

Canadian employees also refer to a "GM trailer" or "GM truck" (general merchandise) and "both trucks" on a night ([r/WalmartCanada](https://www.reddit.com/r/WalmartCanada/comments/1fypv53/overnights/), [r/WalmartCanada](https://www.reddit.com/r/WalmartCanada/comments/1wedgab/is_it_ohk_to_leave_not_worked_skids_for_stocking_1/)) (Med). The user's own store paperwork, or asking on r/WalmartCanada, is the fastest way to confirm FDS, ADS and CP.

## 3. Store process
- **Receiving / DSD (High, Canada):** The Directs Store Delivery Associate processes direct and local shipments, including OMNI merchandise, alcohol and warehouse trailers. They also secure high-ticket items and control backdoor access and keys. They prepare returns, claims and MTRs, log cold chain on the Receiving Temperature Log or Sure Check app, and work with the Operations Manager and Office Support Associate on discrepancies. Minimum age is 16. https://walmart.wd504.myworkdayjobs.com/en-US/WalmartExternal/job/directs-store-delivery-associate_R-2679017 . Employees say some DSD vendors are counted (Frito-Lay, bread) and others are not (Coke, Pepsi, on different programs). That post is now deleted, so this is Low/UNVERIFIED: https://www.reddit.com/r/WalmartCanada/comments/1ou55hk/
- **Unloading (Med-High, Canada):** Stocking 2 covers "backroom and unloading department processes" (official title: "(CAN) Stocking 2 Team Lead," reporting to the "Stocking 1 and 2 Coach"): https://careers.walmart.ca/job/montreal/can-stocking-2-team-lead/4853/101696663792 . A "(CAN) Stock Unloader Associate" role also exists (the posting has since expired). Canadian employees describe holiday loads of 22-26 "skids, many double-stacked" FDD. Rollers, belts and floor-loaded versus palletized trailers in Canada: **gap/UNVERIFIED**. US practice is floor-loaded GM trailers worked on rollers, but this was not verified here and should not be assumed for Canada.
- **Sort line:** **Gap/UNVERIFIED** for Canada. US employees say Cap 2 "unloads / top stock / sorting" (https://www.reddit.com/r/walmart/comments/1d8v2hu/). That is US only.
- **Binning (Med, Canada):** Overnight takes overstock to the back and bins it. The Stocking 3 posting says "a stronger emphasis on labelling and placing merchandise in the backroom bins": https://careers.walmart.ca/job/courtenay/can-overnight-associate-stocking-3-team-associate/4853/101013290592 . Steel, slotting and capping details: UNVERIFIED.
- **Stocking 1 / 2 / 3 (High for 2 and 3, Med for 1):** Stocking 2 = backroom and unloading (above). **Stocking 3 = Overnight Associate**: unloading trailers, pulling pallets to the floor, stocking, features/mods, labelling, and readying the floor for opening (Courtenay BC posting above, $18.40/h minimum). Stocking 1 = daytime floor stocking and picks. This comes from a search snippet of a careers.walmart.ca posting that later 404'd, plus a Canadian post where overnight leaves "skids for Stocking 1" (https://www.reddit.com/r/WalmartCanada/comments/1wedgab/). In the US, the equivalent terms are Cap 1 and Cap 2.
- **Overnight scope (Med, Canada):** Since about 2023, overnight works "all the freight that comes off RDC and HVDC freight except for fashion." Food comes first, and a "new BOS structure" requires freight to be finished before viz picking starts: https://www.reddit.com/r/WalmartCanada/comments/14qvkax/ · https://www.reddit.com/r/WalmartCanada/comments/1wedgab/
- **Omni / OGP (Med-High, Canada):** The official title is "OMNI Customer Fulfillment Associate" (Online Grocery): pick, pack, stage and dispense pickup and delivery orders. I saw this in search snippets of careers.walmart.ca postings (e.g. https://careers.walmart.ca/job/north-battleford/online-grocery-omni-customer-fulfillment-associate/4853/96309935088). I could not open the full text (the Workday page rendered empty), so the details are Med.
- **Fashion processing:** **Gap.** Canadian overnight excludes fashion (above). Hang/fold and rolling-rack details only came from search summaries (UNVERIFIED).
- **Claims / RTS (Med, Canada):** A "(CAN) Claims" role exists (https://careers.walmart.ca/job/toronto/can-claims/4853/82518900000, expired). The DSD role prepares "returns, claims and MTRs" (High). The locked claims cage in the backroom is described by US employees (Med, US): https://www.reddit.com/r/walmart/comments/6kfpkd/
- **Baler / compactor:** In the US, federal child-labor rules bar under-18s from operating or unloading balers and compactors (High, US): https://www.dol.gov/sites/dolgov/files/whd/youthrules/Compactors-Balers_child-labor.pdf . In Canada, one worker at a Canadian Walmart said the baler sign reads "under 19 CANNOT operate" (Low, single anecdote; the province is unknown): https://www.reddit.com/r/legaladvice/comments/8w3yjg/ . Provincial rules: gap.

## 4. News feeds (tested 2026-10-31 ~03:00 EDT, with `-H 'Origin: https://example.com'`)
| URL | HTTP | ACAO | Notes |
|---|---|---|---|
| news.google.com/rss/search?q=Walmart+Canada&hl=en-CA&gl=CA&ceid=CA:en | 200 application/xml | none | 35 items. Can't be read from the browser directly. Fine at build time. |
| walmartcanada.ca/news | 302 → 200 HTML | none | No RSS link found |
| walmartcanada.ca/news/rss, /en/newsroom.rss | 404 | none | |
| corporate.walmart.com/rss, /news/rss | 404 | none | |
| cbc.ca/webfeed/rss/rss-business (also cmlink/rss-business, which 301s here) | 200 XML | none | General business news, not Walmart-specific |
| globalnews.ca/feed/ and globalnews.ca/tag/walmart/feed/ | 200 rss+xml | none | The tag feed is Walmart-specific (mix of US and Canada stories) |
| cp24.com/rss | 301 → 404 | none | Dead |
| api.rss2json.com (Global News feed) | 200 JSON | `*` | Same call on the Google News feed: **429** "use an API key." Free tier is rate-limited. |
| api.allorigins.win/raw and /get (Google News) | 200 | reflects origin | Same service on the Global News feed: **522**. Free, unreliable, no SLA. |
| corsproxy.io | 401 | `*` | Needs an API key |
| api.codetabs.com proxy | gap | gap | My test request returned a corsproxy.io 401 error body; I didn't re-test it |

**Recommendation:** Fetch Google News RSS (en-CA) and/or the globalnews.ca/tag/walmart feed **at build time** (or in a scheduled CI job), parse it to `news.json`, and serve it as a static file. That avoids CORS entirely, along with proxy ToS and uptime problems. Google News links are redirect URLs; keep titles and sources short to stay within fair-use display. **Fallback:** if the strip must be live, try allorigins `/get` client-side and fall back to the baked `news.json` on error or timeout. If you want a keyed service, use rss2json with an API key. Don't depend on any free proxy as the primary source.
