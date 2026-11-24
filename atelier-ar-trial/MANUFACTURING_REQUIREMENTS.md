# Configured order to manufacturer

Customer requirement: place furniture in AR, set its location, adjust actual size with plus/minus or exact millimetres, lock the configuration, purchase it and deliver drawings for that exact order to the manufacturer.

## Implemented prototype

Nook supports provisional width/depth/height constraints and part regeneration. The versioned recipe preserves nominal panel thickness, drawer clearances and leg lengths rather than stretching a whole GLB. A lock creates a copied configuration ID, recipe version, dimensions, finish, material, panel thickness, timestamp and review/quote status. Bag rows retain separate snapshots. A printable HTML draft packet contains front/side/top concept views, nominal component dimensions and the saved record. It is marked DRAFT — NOT FOR PRODUCTION.

Android WebXR offers touch position locking and controls for changing recorded dimensions. Pinch scaling is disabled. Position locking only blocks gestures; tracking drift, physical scale accuracy, model replacement during AR and placement retention need physical-device validation. No permanent anchor is saved. The user's K11 Gen2 tablet has not been established as supported.

## Required production integration

1. Manufacturer approves construction, joinery, runners, clearances, panel/back thickness, leg attachments, allowable loads, tolerances, material choices and safe size limits. The current recipe is a concept only.
2. A server validates the configuration against an approved recipe and creates a priced quote. Store a versioned immutable order snapshot including quantity, currency and quoted price; do not trust client totals or localStorage.
3. The customer accepts the quote and pays through a configured payment provider. Never accept a client success flag as evidence of payment.
4. Verify the provider webhook signature and transaction/order/amount/currency on the server. Process event IDs idempotently and transition the server order to paid once.
5. Generate production drawings, cut list, bill of materials and hardware details from that paid order snapshot and its approved recipe version. Later catalogue edits must not alter the order.
6. Deliver the packet through an authorized manufacturer endpoint or configured email integration with an idempotent delivery record, retry state and receipt. Scope each maker to its own orders.

Live payments, server orders/quotes, manufacturer delivery, production CAD/DXF and maker approval are not implemented. Provider credentials, business pricing and the intended manufacturer destination are still needed. No payment is taken or manufacturer contacted by this prototype.


## Prototype support rule

Recipe v3 adds two centre legs when X width exceeds 600 mm. X is limited to 400–700 mm, Y height to 450–750 mm, Z depth to 300–550 mm. These are demonstration bounds and an illustrative support threshold; they are not validated structural limits. Model geometry and draft packets use the same rule, while v2 snapshots retain their original four legs. Before production, a maker must replace these provisional limits with approved construction and load rules.


The AR placement implementation now uses a stable horizontal-hit gate and an explicit Place here action, with optional WebXR device anchors and a fixed world-position fallback. Resizing preserves the placement parent. Anchor/viewer tracking loss hides the object and reference resets require re-placement. This replaces the earlier gesture-only position lock; physical-device QA remains required.


The prototype now supports checkout inside AR. A saved demo order snapshots the locked configuration and quantity, marks payment and manufacturer delivery as simulated, and generates an order-specific draft packet. Confirmation is browser-local and idempotent per checkout ID. This does not implement any of the production payment/webhook/manufacturer integrations above.


## Workshop review details now generated

The packet includes a part-by-part nominal finished schedule, exploded ID drawing, individual panel/leg/pull dimensions, order counts, mating-face references, leg-axis locations, hardware allowances, proposed assembly steps, CSV and sign-off fields. It is tied to the saved configuration and order quantity. It must remain unapproved: the current visual drawer front has a measured 12 mm gap to the box, runner allowance is provisional, and no validated joinery/drilling/mount stack or load schedule exists. Those details require an approved recipe revision before real manufacture; this update intentionally does not silently alter saved geometry.
