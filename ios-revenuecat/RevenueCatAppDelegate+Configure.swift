import Foundation
import RevenueCat

/// Call this once from your AppDelegate’s `application(_:didFinishLaunchingWithOptions:)`.
enum RevenueCatAppDelegateConfigure {

    static func configure() {
        #if DEBUG
        Purchases.logLevel = .debug
        #endif

        Purchases.configure(
            withAPIKey: RevenueCatConfig.apiKey,
            appUserID: nil
        )
    }
}
