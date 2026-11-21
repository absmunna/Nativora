# NATIVORA — Firebase Spark Plan Single-Vendor E-Commerce

Mobile-first organic pantry e-commerce storefront for Bangladesh built with **React 19, Vite, TypeScript, Tailwind CSS v4, Cloud Firestore, and Firebase Authentication** — engineered for **100% Firebase Spark Plan (free tier)** and **Hostinger Cloud Hosting** static deployment.

---

## Architecture & Free-Plan Compliance

- **Zero Backend Server**: Pure static SPA in `dist/` with Apache/LiteSpeed SPA routing via `.htaccess`.
- **Zero Cloud Functions / Storage / Extensions / Phone OTP**: All logic runs client-side with strict `firestore.rules` enforcement.
- **Static Media Hosting**: Product, category, banner, and logo assets live in `public/images/` and are served from Hostinger (`dist/images/...`); Firestore stores only image URLs.
- **Cash on Delivery (COD) Only**:
  - Customers (including Anonymous guest sessions) submit `pending_verification` order requests with `verifiedSubtotal = 0`, `verifiedDeliveryFee = 0`, `verifiedTotal = 0`, `pricingVerified = false`, and `stockDeducted = false` enforced by Firestore Rules.
  - Client-submitted prices or stock deductions are **never trusted**.
  - Admin verifies live Firestore prices and deducts stock atomically via `runTransaction` before confirming COD orders.
- **Facebook Ad Product Landing Links**:
  - Shareable direct order links (`/?offer=<slug>&utm_source=facebook` or `/product/<slug>`) open a 1-step COD pending order request form.

---

## Project Structure

```
nativora/
├── public/
│   ├── images/{logo,banners,categories,products}/
│   └── favicon.svg
├── src/
│   ├── app/{App.tsx,main.tsx,providers.tsx,router.tsx}
│   ├── components/{layout,shared,ui}/
│   ├── modules/{home,products,categories,cart,checkout,orders,customers}/
│   ├── admin/{auth,dashboard,products,categories,orders,customers,banners,settings}/
│   ├── services/{firebase,storage}/
│   ├── hooks/
│   ├── types/
│   ├── utils/
│   └── styles/
├── firebase/{firestore.rules,firestore.indexes.json}
├── .htaccess
├── firebase-applet-config.json
└── vite.config.ts
```

---

## Firebase Console Setup (Required)

1. **Enable Auth Providers**:
   - Open **Firebase Console → Authentication → Sign-in method**.
   - Enable **Email/Password** (for Admin and Registered Customers).
   - Enable **Anonymous** (for frictionless Guest COD checkout).
2. **Authorize Your Admin UID**:
   - Sign up or sign in at `/admin`.
   - Copy your Firebase UID displayed on the Admin Gate screen.
   - In **Firebase Console → Firestore Database**, create document `admins/{YOUR_UID}` with:
     - `uid`: `"{YOUR_UID}"`
     - `role`: `"admin"`
3. **Seed Starter Catalog**:
   - Once signed in as Admin, click **Seed Starter Catalog to Firestore** in the Admin dashboard.

---

## Spark Plan Security Trade-Offs (Transparent Disclosure)

Because Firebase Spark Plan does not allow Cloud Functions or server-side pre-write triggers:
- **Order Submission**: Firestore Rules enforce that customers can only create orders with `status: "pending_verification"` and zero verified totals, preventing fake confirmed orders or unauthorized stock deduction. However, an admin must run the **Verify Price, Deduct Stock & Confirm COD** action in `/admin` to calculate authoritative totals and deduct stock.
- **Phone Number Uniqueness**: Phone OTP is omitted under Spark Plan constraints, so accounts are strictly keyed by `Firebase UID` and are never merged by unverified phone numbers.
- **Rate Limiting**: Client validation and field-size limits are enforced in `firestore.rules`; server-side SMS/OTP or abuse rate limiting requires Cloud Functions / Blaze Plan.

---

## Building & Deploying to Hostinger

```bash
npm install
npm run build
```

Upload the entire contents of `dist/` (including `.htaccess` and `images/`) into your Hostinger `public_html/` directory.
