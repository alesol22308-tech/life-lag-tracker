'use client';

import AppShell from '@/components/AppShell';
import GlassCard from '@/components/GlassCard';

export default function HelpPage() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-semibold text-text0 mb-4">Help & Keyboard Shortcuts</h1>
          <p className="text-text2 text-sm">Learn how to navigate Life-Lag efficiently</p>
        </div>

        {/* Keyboard Shortcuts Section */}
        <GlassCard>
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-text0">Keyboard Shortcuts</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-text0 mb-2">Check-In Page</h3>
                <ul className="space-y-2 text-sm text-text1">
                  <li className="flex items-start gap-3">
                    <kbd className="px-2 py-1 bg-white/10 border border-cardBorder rounded text-text0 font-mono text-xs">
                      1
                    </kbd>
                    <span className="flex-1">Select scale value 1 (Very off)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <kbd className="px-2 py-1 bg-white/10 border border-cardBorder rounded text-text0 font-mono text-xs">
                      2
                    </kbd>
                    <span className="flex-1">Select scale value 2 (Somewhat off)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <kbd className="px-2 py-1 bg-white/10 border border-cardBorder rounded text-text0 font-mono text-xs">
                      3
                    </kbd>
                    <span className="flex-1">Select scale value 3 (Neutral)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <kbd className="px-2 py-1 bg-white/10 border border-cardBorder rounded text-text0 font-mono text-xs">
                      4
                    </kbd>
                    <span className="flex-1">Select scale value 4 (Mostly aligned)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <kbd className="px-2 py-1 bg-white/10 border border-cardBorder rounded text-text0 font-mono text-xs">
                      5
                    </kbd>
                    <span className="flex-1">Select scale value 5 (Fully aligned)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <kbd className="px-2 py-1 bg-white/10 border border-cardBorder rounded text-text0 font-mono text-xs">
                      ←
                    </kbd>
                    <span className="flex-1">Navigate to previous question</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <kbd className="px-2 py-1 bg-white/10 border border-cardBorder rounded text-text0 font-mono text-xs">
                      →
                    </kbd>
                    <span className="flex-1">Navigate to next question</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <kbd className="px-2 py-1 bg-white/10 border border-cardBorder rounded text-text0 font-mono text-xs">
                      Enter
                    </kbd>
                    <span className="flex-1">Submit check-in (on last question)</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-cardBorder">
                <h3 className="text-lg font-medium text-text0 mb-2">Global Shortcuts</h3>
                <ul className="space-y-2 text-sm text-text1">
                  <li className="flex items-start gap-3">
                    <kbd className="px-2 py-1 bg-white/10 border border-cardBorder rounded text-text0 font-mono text-xs">
                      Esc
                    </kbd>
                    <span className="flex-1">Close modals or cancel actions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <kbd className="px-2 py-1 bg-white/10 border border-cardBorder rounded text-text0 font-mono text-xs">
                      Tab
                    </kbd>
                    <span className="flex-1">Navigate between interactive elements</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Accessibility Features */}
        <GlassCard>
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-text0">Accessibility Features</h2>
            <ul className="space-y-2 text-sm text-text1 list-disc list-inside">
              <li>Keyboard navigation throughout the app</li>
              <li>Screen reader support with ARIA labels</li>
              <li>Adjustable font sizes (Default, Large, Extra Large)</li>
              <li>High contrast mode for better visibility</li>
              <li>Skip to main content link for screen readers</li>
              <li>Respects prefers-reduced-motion settings</li>
            </ul>
          </div>
        </GlassCard>

        {/* Tips */}
        <GlassCard>
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-text0">Tips</h2>
            <ul className="space-y-2 text-sm text-text1 list-disc list-inside">
              <li>Complete weekly check-ins consistently to track trends</li>
              <li>Set a micro-goal related to your weakest dimension</li>
              <li>Review trends regularly to identify patterns</li>
              <li>Check-ins work offline and sync automatically when online</li>
              <li>Use reflection notes to add context to your check-ins</li>
            </ul>
          </div>
        </GlassCard>
      </div>
    </AppShell>
  );
}
