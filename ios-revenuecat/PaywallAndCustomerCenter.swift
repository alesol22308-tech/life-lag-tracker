import SwiftUI
import RevenueCat
import RevenueCatUI

// MARK: - Paywall presentation

/// Presents the RevenueCat paywall when the user does not have the "Life Lag" entitlement.
/// Uses the current offering from the dashboard; configure paywall in RevenueCat → Paywalls.
extension View {

    /// Presents paywall if the user lacks the Life Lag entitlement.
    /// - Parameters:
    ///   - requiredEntitlementIdentifier: Defaults to `RevenueCatConfig.entitlementID` ("Life Lag").
    ///   - offering: Optional; nil uses the current offering.
    ///   - presentationMode: `.fullScreen` or default (sheet-style).
    func presentPaywallIfNeeded(
        requiredEntitlementIdentifier: String = RevenueCatConfig.entitlementID,
        offering: Offering? = nil,
        presentationMode: PaywallPresentationMode = .default
    ) -> some View {
        modifier(PaywallIfNeededModifier(
            requiredEntitlementIdentifier: requiredEntitlementIdentifier,
            offering: offering,
            presentationMode: presentationMode
        ))
    }
}

private struct PaywallIfNeededModifier: ViewModifier {

    let requiredEntitlementIdentifier: String
    let offering: Offering?
    let presentationMode: PaywallPresentationMode

    func body(content: Content) -> some View {
        content
            .presentPaywallIfNeeded(
                requiredEntitlementIdentifier: requiredEntitlementIdentifier,
                offering: offering,
                presentationMode: presentationMode
            )
    }
}

// MARK: - Manual PaywallView (e.g. for a dedicated paywall screen)

/// Use when you want to show the paywall in your own layout (e.g. full-screen on iPad).
struct LifeLagPaywallView: View {

    var offering: Offering?
    var onDismiss: (() -> Void)?

    var body: some View {
        Group {
            if let offering = offering {
                PaywallView(offering: offering)
            } else {
                PaywallView()
            }
        }
        .onRestoreCompleted { _ in
            Task { await RevenueCatManager.shared.checkEntitlement() }
        }
        .onPurchaseCompleted { _, _ in
            Task { await RevenueCatManager.shared.checkEntitlement() }
            onDismiss?()
        }
    }
}

// MARK: - Customer Center

/// Presents RevenueCat Customer Center (manage subscription, restore, cancel, etc.).
/// Requires RevenueCat Pro/Enterprise and Customer Center configured in the dashboard.
struct CustomerCenterSheet: View {

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            CustomerCenterView()
                .navigationTitle("Subscription")
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Done") { dismiss() }
                    }
                }
        }
        .onCustomerCenterDismiss {
            dismiss()
        }
    }
}

/// View modifier that adds a toolbar "Manage subscription" button presenting Customer Center in a sheet.
struct CustomerCenterToolbarModifier: ViewModifier {

    @State private var showCustomerCenter = false

    func body(content: Content) -> some View {
        content
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showCustomerCenter = true
                    } label: {
                        Label("Manage subscription", systemImage: "person.crop.circle.badge.gear")
                    }
                }
            }
            .sheet(isPresented: $showCustomerCenter) {
                CustomerCenterSheet()
            }
    }
}

extension View {

    /// Adds a toolbar button that presents Customer Center in a sheet.
    /// Use on settings or account screens where subscribers manage their plan.
    func withCustomerCenterToolbar() -> some View {
        modifier(CustomerCenterToolbarModifier())
    }
}

// MARK: - Subscription gate view (example)

/// Example root view: shows content when entitled, otherwise presents paywall.
struct SubscriptionGatedContent<Content: View>: View {

    @StateObject private var manager = RevenueCatManager.shared
    @ViewBuilder let content: () -> Content

    var body: some View {
        Group {
            if manager.hasLifeLagEntitlement {
                content()
            } else {
                ProgressView("Loading…")
            }
        }
        .task {
            await manager.checkEntitlement()
        }
        .presentPaywallIfNeeded(requiredEntitlementIdentifier: RevenueCatConfig.entitlementID)
    }
}
