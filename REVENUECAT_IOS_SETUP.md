# RevenueCat iOS Integration – Life Lag

Step-by-step guide to integrate RevenueCat SDK into the Life Lag iOS app (Capacitor) using Swift Package Manager, with paywall, entitlement checking, and Customer Center.

---

## No Xcode yet?

You can do the **dashboard setup** now (no Mac needed):

1. **Set up RevenueCat in the dashboard** – [REVENUECAT_DASHBOARD_SETUP.md](./REVENUECAT_DASHBOARD_SETUP.md)  
   Create entitlement **Life Lag**, products **monthly** and **yearly**, offering, and paywall. Do this from any browser.

2. **When you have Xcode** – Come back to this file and do the steps below: add the Swift package, add the Swift files from `ios-revenuecat/`, enable In-App Purchase, and call `RevenueCatAppDelegateConfigure.configure()` in AppDelegate.

The Swift code is already in the repo under `ios-revenuecat/`; you only need Xcode to add it to the iOS project and build.

---

## 1. Install RevenueCat SDK via Swift Package Manager

1. Open the iOS project in Xcode:
   - Run `npm run cap:open:ios` or open `ios/App/App.xcworkspace` (use the **workspace**, not the `.xcodeproj`).

2. Add the RevenueCat package:
   - **File → Add Package Dependencies...**
   - In the search field (top right), enter:
     ```
     https://github.com/RevenueCat/purchases-ios-spm.git
     ```
   - Click **Add Package**.
   - Set **Dependency Rule** to **Up to next major**, version **5.0.0** (or `5.0.0 < 6.0.0`).
   - When asked "Choose Package Products", select:
     - **RevenueCat**
     - **RevenueCatUI**
   - Click **Add Package** and ensure the **App** target is selected.

3. Enable In-App Purchase capability:
   - Select the **App** project → **App** target.
   - Open **Signing & Capabilities**.
   - Click **+ Capability** and add **In-App Purchase**.

---

## 2. Configure API Key and Entitlement

- **API key (already set in code):** `test_apsaRFgnzPRWfEzMfhKSnDHqBjT`  
  - This is your **Test Store** key; use it for development and sandbox.
- **Production:** Before App Store submission, switch to your **iOS (App Store)** public API key from [RevenueCat Dashboard → Project → API Keys](https://app.revenuecat.com).
- **Entitlement identifier:** `Life Lag` (used for gating premium content and paywall).

---

## 3. RevenueCat Dashboard Setup

1. **Products**
   - In RevenueCat: **Project → Products** (or **Offerings → Products**).
   - Add products that match your App Store Connect product IDs, for example:
     - **Monthly:** identifier `monthly` (or your actual monthly product ID).
     - **Yearly:** identifier `yearly` (or your actual yearly product ID).

2. **Entitlements**
   - **Project → Entitlements**.
   - Create an entitlement with identifier: **Life Lag**.
   - Attach the **monthly** and **yearly** products to this entitlement.

3. **Offerings**
   - **Project → Offerings**.
   - Create or use the **default** offering.
   - Add **Packages** (e.g. **$rc_monthly**, **$rc_annual**) and link the **monthly** and **yearly** products.
   - Set one offering as **Current** (used when you don’t pass a specific offering ID).

4. **Paywall (optional but recommended)**
   - **Tools → Paywalls**.
   - Create a paywall for the offering you use (e.g. default).
   - Design layout, copy, and buttons in the dashboard; the SDK will display it via `PaywallView` or `presentPaywallIfNeeded`.

5. **Customer Center (optional)**
   - **Tools → Customer Center** (Pro/Enterprise).
   - Configure management options (restore, cancel, change plan, etc.).
   - The app uses `CustomerCenterView` to show this UI.

---

## 4. Add the Swift Files to Your Project

Copy (or add as references) the Swift files from the `ios-revenuecat/` folder into your Xcode project:

- `RevenueCatConfig.swift` – API key and constants.
- `RevenueCatManager.swift` – Subscription state, customer info, entitlement checks.
- `RevenueCatAppDelegate+Configure.swift` – SDK configuration (call from `AppDelegate`).
- `PaywallAndCustomerCenter.swift` – Paywall and Customer Center presentation.

**In Xcode:**

1. Right-click the **App** group under the App target (e.g. `ios/App/App/`).
2. **Add Files to "App"...**
3. Select the four Swift files above and add them to the **App** target.

---

## 5. Configure Purchases on Launch

In your existing **AppDelegate.swift** (in `ios/App/App/`), add the RevenueCat configuration at the start of `application(_:didFinishLaunchingWithOptions:)`:

```swift
import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Configure RevenueCat (add this line first)
        RevenueCatAppDelegateConfigure.configure()

        // Existing Capacitor/other setup below...
        return true
    }
    // ... rest of your AppDelegate (e.g. Capacitor bridge)
}
```

**If your AppDelegate is in Objective-C:** Add a small Swift file that calls `RevenueCatAppDelegateConfigure.configure()` from a static initializer, or call it from the first Swift code path that runs on launch.

---

## 6. Use in Your App

- **Entitlement check:** Use `RevenueCatManager.shared.hasLifeLagEntitlement` or `await RevenueCatManager.shared.checkEntitlement()` to gate features.
- **Show paywall:** Use `.presentPaywallIfNeeded(requiredEntitlementIdentifier: RevenueCatConfig.entitlementID)` on a SwiftUI view, or present `PaywallView` / `PaywallViewController` manually.
- **Customer Center:** Present `CustomerCenterSheet()` in a sheet, or add `.withCustomerCenterToolbar()` to a view (see `PaywallAndCustomerCenter.swift`).
- **Capacitor (web shell):** If your UI is mostly web, you can present the paywall from a native SwiftUI screen or add a Capacitor plugin that shows the RevenueCat paywall when the web app requests it.

---

## 7. Build and Test

1. Build in Xcode (Cmd + B).
2. Run on a simulator or device (subscriptions are test-only on simulator with Test Store).
3. Use **Test Store** with the provided test API key to verify purchases and entitlement without App Store Connect.
4. For real IAP testing, configure App Store Connect products and use the **iOS (App Store)** API key with a sandbox Apple ID.

---

## 8. Before Release

- Replace the test API key with your **iOS (App Store)** public API key (e.g. via build configuration or `RevenueCatConfig.swift`).
- Ensure **In-App Purchase** capability is enabled and your App Store Connect in-app products are approved.
- Test restore purchases and Customer Center (if used) on a real device with a sandbox account.

---

## File Reference

| File | Purpose |
|------|--------|
| `RevenueCatConfig.swift` | API key, entitlement ID, product IDs. |
| `RevenueCatManager.swift` | Customer info, entitlement state, async APIs. |
| `RevenueCatAppDelegate+Configure.swift` | One-line setup called from AppDelegate. |
| `PaywallAndCustomerCenter.swift` | Paywall + Customer Center presentation helpers. |

---

## Error handling

- **Customer info / entitlement:** `RevenueCatManager.shared.checkEntitlement()` sets `error` on failure; check `RevenueCatManager.shared.error` and `isLoading` in the UI. Use `try await getCustomerInfo()` or `try await restorePurchases()` and handle `Error` in a `do/catch` or with `Result`.
- **Offerings empty:** Usually a dashboard or Store Connect configuration issue. Enable `Purchases.logLevel = .debug` and check logs; ensure products and offerings are set up and the correct API key (Test vs iOS) is used.
- **Purchases:** RevenueCat paywall and `Purchases.shared.purchase(package:)` surface errors to the user (e.g. cancelled, payment failed). Use `.onPurchaseError` / `.onRestoreError` on paywall views if you need custom handling.

---

## Best practices

- **Configure once:** Call `RevenueCatAppDelegateConfigure.configure()` only in `AppDelegate`, not in views.
- **Single source of truth:** Use `RevenueCatManager.shared` for entitlement state and customer info so the whole app stays in sync.
- **Refresh after actions:** Call `await RevenueCatManager.shared.checkEntitlement()` after purchase, restore, or login/logout so UI updates immediately.
- **User identity:** When your user logs in, call `RevenueCatManager.shared.logIn(userId:)` so purchases are tied to their account; call `logOut()` on sign-out.
- **Production key:** Never ship with the Test Store API key. Use a build configuration or `#if DEBUG` to switch to your iOS (App Store) public API key for release.
- **Restore:** Always provide a way to restore purchases (RevenueCat paywalls include this; otherwise add a "Restore" button that calls `RevenueCatManager.shared.restorePurchases()`).

For more: [RevenueCat iOS docs](https://www.revenuecat.com/docs/getting-started/installation/ios), [Paywalls](https://www.revenuecat.com/docs/tools/paywalls), [Customer Center](https://www.revenuecat.com/docs/tools/customer-center).
