# RevenueCat Dashboard Setup – Life Lag

Do this in the [RevenueCat Dashboard](https://app.revenuecat.com) from any browser. No Xcode or Mac required. When you have Xcode, the iOS app will use this configuration.

---

## 1. Sign in and select your project

- Go to [app.revenuecat.com](https://app.revenuecat.com) and sign in.
- Create a project if you haven’t (e.g. **Life Lag**).
- Your **Test Store** API key is already in the app code: `test_apsaRFgnzPRWfEzMfhKSnDHqBjT`. You can confirm it under **Project → API Keys**.

---

## 2. Products

- In the sidebar: **Products** (or **Offerings → Products**).
- Add two products. Identifiers must match what the app and (later) App Store Connect use:

| Identifier | Type        | Notes                    |
|-----------|-------------|--------------------------|
| `monthly` | Subscription| Monthly auto-renewable   |
| `yearly`  | Subscription| Yearly auto-renewable   |

- For **Test Store** you don’t need to link to App Store Connect yet. When you go to production, add the same identifiers in App Store Connect and attach them here.

---

## 3. Entitlements

- In the sidebar: **Entitlements**.
- Click **+ New**.
- **Identifier:** `Life Lag` (must match exactly – the app uses this).
- Attach both products to this entitlement:
  - **monthly**
  - **yearly**
- Save.

---

## 4. Offerings

- In the sidebar: **Offerings**.
- Use the **default** offering or create one (e.g. **default**).
- Add **Packages** inside that offering:

| Package identifier | Product   | Typical use   |
|--------------------|-----------|---------------|
| `$rc_monthly`      | monthly   | Monthly plan  |
| `$rc_annual`        | yearly    | Yearly plan   |

- Set this offering as **Current** (so the app gets it when no specific offering ID is passed).

---

## 5. Paywall (recommended)

- In the sidebar: **Tools → Paywalls**.
- **+ New paywall** and choose a template or start from scratch.
- Assign it to the **offering** you use (e.g. default).
- Edit copy, layout, and buttons. The iOS app will show this via `PaywallView` / `presentPaywallIfNeeded`.
- Save and publish.

---

## 6. Customer Center (optional; Pro/Enterprise)

- In the sidebar: **Tools → Customer Center**.
- If you’re on a plan that includes it, configure:
  - Restore purchases
  - Cancel / change plan
  - Support link
  - (Optional) Promo offers and feedback prompts.
- The iOS code already uses `CustomerCenterView`; once configured here, it will show this UI.

---

## 7. API keys (for later)

- **Project → API Keys**.
- **Test Store** key: already in the app for development.
- **iOS (App Store)** key: use this in the app when you build for production (replace the test key in `RevenueCatConfig.swift` or via build config).

---

## Checklist

- [ ] Products: `monthly`, `yearly` created  
- [ ] Entitlement: `Life Lag` created and both products attached  
- [ ] Offering: default (or your chosen one) with packages `$rc_monthly`, `$rc_annual`, set as **Current**  
- [ ] Paywall: created and attached to that offering  
- [ ] (Optional) Customer Center configured  

When you have Xcode, continue with **REVENUECAT_IOS_SETUP.md** (add the Swift package, add the Swift files, and call `RevenueCatAppDelegateConfigure.configure()` in AppDelegate).
