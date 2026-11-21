# Nativora Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Customer Privacy (UID Identity)**: A `customers/{customerUid}` document may only be read or written by the authenticated user whose `request.auth.uid == customerUid` or an authorized Admin. Unverified phone numbers never merge or grant cross-UID access.
2. **Order Price & Stock Integrity**: Customers (anonymous or email-authenticated) can ONLY create `orders` with `status == 'pending_verification'`, `pricingVerified == false`, `stockDeducted == false`, `paymentMethod == 'COD'`, `verifiedSubtotal == 0`, `verifiedDeliveryFee == 0`, and `verifiedTotal == 0`.
3. **Admin Verification Gate**: Only an authenticated Admin (`isAdmin()`) can transition an order to `confirmed`, set `pricingVerified: true`, set `verifiedTotal`, or deduct product `stock` on `/products/{productId}`.
4. **Catalog & Public Reviews Protection**: Public shoppers may read `products`, `categories`, `banners`, `settings`, and `reviews` (no PII stored in `reviews`), while only Admins may write catalog docs. Signed-in customers (including anonymous guest accounts) may create `reviews` strictly bound to `authorUid == request.auth.uid`, valid integer `rating` (1–5), and bounded strings, and may only update/delete their own reviews (or Admin).
5. **No Ghost Fields or Oversized Payloads**: Every write validates required + allowed keys via `hasAll` and `hasOnly`, enforces string lengths, and checks `request.time` on `createdAt`/`updatedAt`.

## 2. Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Pre-Confirmed Order Spoof**: Customer submits `/orders/{id}` with `status: 'confirmed'` instead of `'pending_verification'`.
2. **Tampered Price Verification Flag**: Customer submits `/orders/{id}` with `pricingVerified: true` and `verifiedTotal: 1`.
3. **Direct Client Stock Deduction**: Customer attempts `update` on `/products/{id}` to decrement `stock`.
4. **Cross-Customer PII Read**: Customer A calls `get` on `/customers/{customerB_uid}`.
5. **Customer Collection Scraping**: Customer calls `list` on `/customers`.
6. **Cross-UID Order Impersonation**: Customer A creates `/orders/{id}` with `customerUid: customerB_uid`.
7. **Order Scraping**: Customer queries `list` on `/orders` without `where('customerUid', '==', auth.uid)`.
8. **Shadow Ghost Field Injection**: Customer creates `/customers/{uid}` or `/reviews/{id}` with extra field `isAdmin: true` or `verifiedPurchase: true`.
9. **Spoofed Unverified Admin Email**: User signs up with `email_verified: false` attempting admin write.
10. **Non-COD Payment Bypass**: Customer creates `/orders/{id}` with `paymentMethod: 'CARD'`.
11. **Oversized ID Poisoning**: Attacker writes to `/orders/{1500_char_id}` or `/reviews/{1500_char_id}` exceeding 128-char ID limit.
12. **Client Timestamp Forgery & Review Impersonation**: Customer creates `/orders/{id}` or `/reviews/{id}` with backdated `createdAt` not matching `request.time`, out-of-range rating (`6` or `0`), or `authorUid != request.auth.uid`.
