# Life Lag – RevenueCat iOS Sources

Add these Swift files to your Xcode **App** target (e.g. under `ios/App/App/`). See **REVENUECAT_IOS_SETUP.md** in the project root for full setup (Swift Package, API key, dashboard, and AppDelegate).

## Files

| File | Purpose |
|------|--------|
| `RevenueCatConfig.swift` | API key, entitlement ID `"Life Lag"`, product IDs (monthly, yearly). |
| `RevenueCatManager.swift` | `@MainActor` manager: entitlement state, customer info, offerings, restore, login/logout. |
| `RevenueCatAppDelegate+Configure.swift` | One-line setup: call `RevenueCatAppDelegateConfigure.configure()` from `AppDelegate`. |
| `PaywallAndCustomerCenter.swift` | Paywall modifier, `LifeLagPaywallView`, `CustomerCenterSheet`, `SubscriptionGatedContent`. |

## Quick usage

- **Entitlement check:** `RevenueCatManager.shared.hasLifeLagEntitlement` or `await RevenueCatManager.shared.checkEntitlement()`.
- **Show paywall when not entitled:** `.presentPaywallIfNeeded(requiredEntitlementIdentifier: RevenueCatConfig.entitlementID)` on your root (or gated) view.
- **Manual paywall:** `LifeLagPaywallView(offering: nil)` or pass a specific `Offering`.
- **Customer Center (manage subscription):** Present `CustomerCenterSheet()` in a sheet, or add `.withCustomerCenterToolbar()` to a view.
- **Gate content by subscription:** Wrap content in `SubscriptionGatedContent { ... }` and apply `.presentPaywallIfNeeded(...)` as needed.

Ensure the RevenueCat **RevenueCat** and **RevenueCatUI** Swift packages are added to the App target and that **In-App Purchase** capability is enabled.
