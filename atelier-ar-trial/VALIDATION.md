# Validation notes

Build: npm run build passed on Node 24.19.0. The production JavaScript bundle is approximately 94 kB gzip; CSS approximately 6 kB gzip.

Browser journey checked in the Codex in-app browser:
1. Homepage rendered with loaded furniture photography and working Shop navigation.
2. Catalogue initially listed 24 pieces; selecting Sofas reduced the count to four.
3. Selected Price: Low to High and opened Cloud Two-Seater.
4. Selected Walnut and added it to the bag.
5. Saved the product to the wishlist.
6. Opened bag and increased quantity to two. Subtotal and total were ₹91,800 (2 × ₹45,900), with Walnut retained.
7. Opened demo checkout and reloaded the page; bag contents, finish and quantity persisted.

Limitations: responsive layouts are implemented with breakpoints, but a physical mobile device and AR device were not tested. No AR capability is claimed. Product gallery uses labelled alternate crops because exact product image angles are not supplied. Comprehensive screen-reader and keyboard-only audits remain outstanding.

Colour preview update: strict TypeScript/production build passed. Browser checks confirmed Natural and Charcoal photographs, Forest selection and Forest cart variant. Test cart line was removed afterwards. Colour assets are local and labelled AI-edited demo previews.

Nightstand update: GLTFLoader inspection passed: 0.500 × 0.550 × 0.400 m, floor Y=0, 17 meshes, 3,580 triangles, 185,952 bytes. Browser rendered the model, orbit drag changed angle, and switching Charcoal to Walnut changed the material without resetting the rotated view. Strict TypeScript and Vite build passed. Vite reports a large optional 3D chunk (~278 kB gzip); it is lazy-loaded. No AR placement/device validation was performed.

AR launch repair: capability detection now awaits the immersive-AR support check, distinguishes insecure links, embedding/Permissions Policy restrictions, missing tracking APIs, unsupported devices and errors. Model loading and asynchronous model-viewer readiness are observed separately, including cached model loads. A launch that never starts now times out with an explanation. Added Check again, direct-page link and local compatibility details; no diagnostics are uploaded automatically.

Validation: four regression tests cover delayed support probes, unsupported devices/missing APIs, insecure/embedded/blocked pages and rejected checks. Strict TypeScript and Vite build passed. Lenovo Tab K11 Gen 2 was not found on Google's ARCore supported-device list at investigation time; K11 Plus is listed. This is evidence of a likely compatibility limitation, not a physical-device test or a guarantee about all K11 variants.

Mobile layout update: responsive bottom navigation, persistent product purchase bar carrying selected finish and quantity, early product 3D/AR shortcuts, larger touch targets and finish swatches, mobile filter apply action, readable inputs, safe-area spacing, compact AR controls and scroll-to-room-placement. The existing AR compatibility checks remain active; responsive styling does not add AR hardware support.

Browser QA: 320px homepage/catalogue layouts and 390px product/cart/AR layouts had no horizontal overflow. At 390px, selecting Walnut and using the persistent purchase bar added the correct nightstand variant; test cart line was removed afterwards. Category Tables returned five pieces and the Show pieces action closed mobile filters. The early room shortcut opened the AR section, which correctly reported the desktop test browser as unsupported. At 1280px, mobile navigation and purchase bars were hidden. AR regression tests and production build passed. These are browser viewport checks, not physical-device or immersive AR tests.


## November 17 — configurable nightstand prototype

- Automated recipe/GLB tests cover minimum, maximum, standard and asymmetric bounds in metres, floor origin, fixed panel/leg dimensions, invalid inputs, exported GLB reload and saved finish.
- Cart tests cover snapshot copying, separate configuration IDs, targeted quantity updates, stock limits across configurations and rejection of mismatched finish data.
- Draft packet tests verify exact saved dimensions and explicit draft status. AR capability detector tests remain included.
- Browser verification: locked dimensions/finish survive reload; 650 and 600 mm wide Walnut configurations remain separate in the bag. Targeted quantity edits survive refresh; changing finish unlocks the configuration; an out-of-range 800 mm width cannot be locked. At 390 × 844 the controls and purchase bar remain usable. The 650 × 450 × 620 mm draft views and warning were visually inspected.
- Browser renderer reported WebGL unavailable in this environment; photoreal rendered model and physical AR placement could not be verified here. No supported physical Android device is connected. Position gesture lock and model replacement during immersive AR require physical QA.
- No live payment, server order or manufacturer dispatch is claimed or tested. Generated packets are review drafts only.


## Independent axes and procedural supports

- Added independent axis tests (X width, Y height, Z depth), bounds checks and threshold checks at 600/601/700 mm.
- Verified the recipe removes extra supports when returning to 600 mm and keeps 150 mm leg lengths.
- Draft packets preserve legacy v2 four-leg snapshots while new v3 packets include six legs above the threshold.
- Physical AR testing is still unavailable; this change does not establish structural suitability or device compatibility.

- Browser checked at 390 × 844: X Home/End respects 400/700 mm limits; Y +5% changes height alone; Z Home changes depth alone. Support readout changes between 4 and 6 legs. Exact inputs remain available through their disclosure. WebGL was unavailable in the browser test environment, so procedural model geometry is verified through automated scene/GLB checks rather than rendered or physical AR QA.


## Floor-placement correction after reported hands-free sliding

- Replaced automatic room placement with explicit stable-hit placement, optional hit-result device anchors, a fixed world-space fallback and Reposition.
- Added tests for horizontal/range/stability gates, rejection of moving hits, camera movement not altering placed transforms, tracking-loss visibility, tracked anchor poses, and geometry replacement preserving the floor root/yaw/contact.
- All 21 automated checks pass. TypeScript and production build pass. Browser inspection confirms the mobile guide and unsupported-device state; no AR camera session was available in this environment.
- A supported physical Android device must still verify floor contact, anchor tracking, walking around, resize retention, tracking loss/recovery and reference reset. Physical drift is not claimed fixed by automated tests.


## November 18 — model visibility / placement tap

- Restarted the local server, which was not listening on port 5173 when the issue was reported.
- Place here now commits the displayed point immediately. Added a regression test proving the following frame does not hit-test or cancel the accepted point.
- A valid surface has an amber scan marker before it becomes ready. The sample stability gate tolerates ordinary hand jitter; vertical/distant/invalid/moving hits remain rejected by tests.
- Model failures now expose a retryable error; a regression test verifies retrying the same failed URL.
- Browser security policy blocked page inspection in this session. UI and physical tablet placement remain unverified; automated tests are not a camera-device test.


## November 18 — camera opens / invisible after Place here

- Corrected a confirmed visibility edge case: a newly-resolved anchor without a usable pose no longer immediately hides an otherwise valid world placement.
- Added a 2.5-second fallback for anchors that never locate, support for direct pose queries without trackedAnchors metadata, and explicit Show at saved position recovery.
- Regression tests cover initial unlocated anchors, anchor timeout, missing tracking metadata, recovery at the saved point and rejection of manual display during viewer tracking loss.
- Browser inspection remains blocked by the session's browser security policy. Real tablet rendering and placement require user verification; no visual or physical success is claimed from these unit tests.


## November 19 — AR controls obscuring camera

- Changed the default placed view from an always-expanded sizing form, finish bar, recovery and movement buttons to a small dock and closed tool panels.
- Size, Finish, Move and Info open individually; panels are limited to 45dvh and have a persistent Close control. Done exits AR. Healthy placement status no longer shows a large banner.
- Production build and strict TypeScript checks pass. This is a UI-only update; no physical AR behavior or camera rendering fix is claimed.
- Browser inspection remains unavailable following the earlier browser policy rejection. The layout was implemented from the user's tablet screenshot and code review; device layout needs user confirmation.


## November 19 — direct AR prototype checkout

- Added Order / Lock & order in the compact dock, in-session review with quantity and demo price, simulation confirmation, saved receipt and matching draft order blueprint.
- Tests cover exact configuration copies, later edit isolation, repeated confirmation idempotency, quantity/product/price validation, saved receipt reload, packet dimensions/legs and storage failure handling. All 33 automated checks pass.
- Production TypeScript/build checks pass. Browser inspection remains blocked; touch layout, in-session downloads and camera checkout still need physical-device verification. A receipt outside the immersive overlay supports downloading after Done.
- This flow is explicitly simulated: no live payment or manufacturer transmission.


## November 19 — bag payment simulation

- Replaced the bag's static demo-checkout message with a review, Demo UPI/card selection, payment simulation confirmation and per-configuration dimensioned blueprint downloads.
- Saved order blueprint history is available on the bag page and empty bag. Unsupported sample products are labelled as having no blueprint; no manufacturing drawing is invented for them.
- Added checks for separate bag sizes, idempotent retry, batch quantity limits, prevention of partial confirmation and preserving legacy recipe versions. All 37 automated checks pass.
- Browser UI inspection remains unavailable under the earlier browser policy block; mobile checkout layout and downloads still need user verification.


## November 19 — individual manufacturing dimensions and assembly review

- Added manufacturingPlan and manufacturingDrawings helpers: per-part axis mapping, stable IDs, order quantities, connection references, leg positions, unresolved geometry and proposed assembly workflow.
- Tests cover 666 W × 330 D × 725 H mm part sizes (including 557 × 330 × 18 mm side panels), fractional drawer sizes, legacy/v3 leg rules, order quantities, runner allowance/front gap, finite SVG geometry and downloadable pack sections. All 43 automated checks pass.
- Rendered the generated exploded SVG and side-panel dimension sketch with resvg and visually inspected them. An example order review HTML/CSV/SVG/PNG is in outputs. This checks static drawing content, not immersive browser behavior or released manufacturing suitability.
- No final joinery, drilling template, selected runner/leg mounting hardware, structural load approval or CNC release is claimed. The download explicitly holds production until those are resolved.


## November 24 — Solace relaxing lounge chair

- Added an original procedural GLB chair with separate timber, upholstery and leg parts plus decorative piping; verified exact surface W/D/H and floor origin at minimum, standard, maximum and asymmetric sizes.
- Checked GLB export/reload with Forest upholstery, separate product/recipe/storage validation and chair + nightstand in the same bag/payment with separate blueprints. All 47 checks pass.
- Rendered the actual GLB in Blender for product views and inspected the Natural/Forest previews. Rendered all 27 SVGs in a wide-chair sample workshop packet to validate markup.
- No browser UI or physical AR session is claimed verified; browser tools are unavailable. Upholstery manufacture, joints, drilling, hardware and load safety still require maker approval.


### Procedural seating revision

50 automated checks pass, including all length/front-to-back presets, real surface bounds and floor contact, fixed dimensions of the armrest assemblies, one/two cushion transitions, independent leg height with unchanged body parts, 4/6/8 support rules, round-trip double-seat GLB bounds, immutable simulated orders, dimensioned workshop schedules and legacy v1 order compatibility. TypeScript compilation passes. New Blender renders use the v2 GLBs. Device AR and browser interaction remain unverified in this environment.
