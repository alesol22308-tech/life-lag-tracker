import Foundation

/// Central configuration for RevenueCat in Life Lag.
/// Replace `apiKey` with your production iOS key before App Store release.
enum RevenueCatConfig {

    /// Public API key. Use Test Store key for development, iOS key for production.
    /// Get keys from: RevenueCat Dashboard → Project → API Keys
    static let apiKey: String = "test_apsaRFgnzPRWfEzMfhKSnDHqBjT"

    /// Entitlement identifier used to gate premium features (must match RevenueCat Dashboard).
    static let entitlementID: String = "Life Lag"

    /// Product identifiers (must match App Store Connect and RevenueCat products).
    enum ProductID {
        static let monthly: String = "monthly"
        static let yearly: String = "yearly"
    }

    /// Optional: use a specific offering identifier, or nil for current offering.
    static let offeringIdentifier: String? = nil
}
