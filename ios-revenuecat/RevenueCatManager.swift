import Foundation
import RevenueCat

/// Manages subscription state, customer info, and entitlement checks for Life Lag.
/// Use `shared` to gate features and drive UI (e.g. show paywall when not entitled).
@MainActor
final class RevenueCatManager: ObservableObject {

    static let shared = RevenueCatManager()

    /// True if the user has an active "Life Lag" entitlement.
    @Published private(set) var hasLifeLagEntitlement: Bool = false

    /// Latest customer info (nil until first fetch).
    @Published private(set) var customerInfo: CustomerInfo?

    /// Loading or error state for UI.
    @Published private(set) var isLoading: Bool = false
    @Published private(set) var error: Error?

    private init() {}

    // MARK: - Entitlement & customer info

    /// Fetches latest customer info and updates `hasLifeLagEntitlement` and `customerInfo`.
    /// Call on launch and after purchase/restore.
    func checkEntitlement() async {
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            let info = try await Purchases.shared.customerInfo()
            customerInfo = info
            hasLifeLagEntitlement = info.entitlements[RevenueCatConfig.entitlementID]?.isActive == true
        } catch let e {
            error = e
            hasLifeLagEntitlement = false
            #if DEBUG
            print("[RevenueCat] Failed to get customer info: \(e)")
            #endif
        }
    }

    /// Returns the current customer info (from cache or network).
    /// Use this when you need full subscription details (expiration, product IDs, etc.).
    func getCustomerInfo() async throws -> CustomerInfo {
        try await Purchases.shared.customerInfo()
    }

    /// Synchronous check using cached customer info only.
    /// For authoritative state, use `checkEntitlement()` or `getCustomerInfo()`.
    var isEntitledFromCache: Bool {
        guard let info = customerInfo else { return false }
        return info.entitlements[RevenueCatConfig.entitlementID]?.isActive == true
    }

    // MARK: - Offerings

    /// Fetches current offerings (used to present a specific offering’s paywall if needed).
    func getOfferings() async throws -> Offerings {
        try await Purchases.shared.offerings()
    }

    /// Current offering (nil if none or fetch failed).
    func getCurrentOffering() async -> Offering? {
        do {
            let offerings = try await Purchases.shared.offerings()
            if let id = RevenueCatConfig.offeringIdentifier {
                return offerings.all[id]
            }
            return offerings.current
        } catch {
            #if DEBUG
            print("[RevenueCat] Failed to get offerings: \(error)")
            #endif
            return nil
        }
    }

    // MARK: - Restore

    /// Restores previous purchases. Call from a “Restore” button; then call `checkEntitlement()` to refresh UI.
    func restorePurchases() async throws {
        _ = try await Purchases.shared.restorePurchases()
        await checkEntitlement()
    }

    // MARK: - User identity (optional)

    /// Log in with your app’s user ID so purchases are tied to that account.
    /// Call after user signs in; omit or use anonymous ID for guests.
    func logIn(userId: String) async throws -> (CustomerInfo, Bool) {
        let result = try await Purchases.shared.logIn(userId)
        await checkEntitlement()
        return (result.customerInfo, result.created)
    }

    /// Log out and switch back to anonymous user.
    func logOut() async throws -> CustomerInfo {
        let info = try await Purchases.shared.logOut()
        await checkEntitlement()
        return info
    }
}
