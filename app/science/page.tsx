import Link from 'next/link';

export const metadata = {
  title: 'The Science Behind Life-Lag',
  description: 'A lightweight summary of the research foundations behind Life-Lag.',
};

function SectionHeading({ id, title }: { id: string; title: string }) {
  return (
    <h2 id={id} className="text-2xl font-light text-gray-900 dark:text-gray-100 scroll-mt-24">
      {title}
    </h2>
  );
}

export default function SciencePage() {
  return (
    <main className="min-h-screen px-4 py-12 sm:py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto space-y-10">
        <header className="card space-y-4">
          <h1 className="text-4xl sm:text-5xl font-light text-gray-900 dark:text-gray-100">The Science Behind Life-Lag</h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            Life-Lag is a weekly tune-up built on well-established stress science: strain tends to build gradually, and
            small shifts in sleep, energy, and follow-through can show up before things feel &quot;obvious.&quot;
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This isn&apos;t medical advice, diagnosis, or treatment—just a practical way to notice drift early and adjust
            gently.
          </p>
          <div className="pt-2">
            <Link href="/home" className="text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 underline">
              Back to Home
            </Link>
          </div>
        </header>

        <section className="card space-y-4">
          <SectionHeading id="problem" title="Problem: issues are often noticed too late" />
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            People can stay functional under load for a while—then suddenly feel behind, depleted, or brittle. By the
            time it&apos;s obvious, it can take longer to recover.
          </p>
          <details className="pt-2">
            <summary className="text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer">
              Learn more (institutions)
            </summary>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Work from institutions like the <span className="font-medium">National Academy of Medicine</span> highlights
              the value of earlier signals and shorter check-in intervals for prevention and support.
            </p>
          </details>
        </section>

        <section className="card space-y-4">
          <SectionHeading id="insight" title="Insight: early drift is measurable" />
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Stress isn&apos;t only about big events—it&apos;s also the hidden cost of sustained effort. Researchers describe this
            as <span className="font-medium">allostatic load</span>: the wear-and-tear that accumulates when demands stay
            higher than recovery.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Another lens is the <span className="font-medium">effort–recovery gap</span>: you can keep performing by
            pushing harder, even as reserves shrink.
          </p>
          <details className="pt-2">
            <summary className="text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer">
              Learn more (institutions)
            </summary>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Summaries and reviews across <span className="font-medium">NIH / PubMed</span> and university research
              groups support the idea that subjective, repeated check-ins can reflect underlying strain over time.
            </p>
          </details>
        </section>

        <section className="card space-y-4">
          <SectionHeading id="solution" title="Solution: weekly, baseline-based tracking" />
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Life-Lag is designed for maintenance. A short weekly check-in captures early signals, compares to your recent
            baseline, and suggests one small adjustment—so course correction stays gentle and doable.
          </p>
        </section>

        <section className="card space-y-4">
          <SectionHeading id="validation" title="Validation: research-backed, institution-supported" />
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            The ideas behind Life-Lag show up across many populations—students, professionals, and high-load roles—because
            it measures capacity strain rather than specific stressors.
          </p>
          <ul className="text-gray-700 dark:text-gray-300 leading-relaxed list-disc pl-5 space-y-1">
            <li>NIH / PubMed summaries of allostatic load and intervention research</li>
            <li>National Academy of Medicine guidance on earlier detection and prevention</li>
            <li>University research on recovery, sleep consistency, and workload strain</li>
          </ul>
        </section>

        <section className="card space-y-6">
          <SectionHeading id="map" title="How the science maps to the product" />

          <div className="space-y-2">
            <h3 id="why-weekly-checkin" className="text-lg font-medium text-gray-900 dark:text-gray-100 scroll-mt-24">
              Weekly check-in
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Short-interval check-ins help catch small shifts before they compound. A weekly cadence is long enough to
              be low-friction, but frequent enough to notice drift early.
            </p>
          </div>

          <div className="space-y-2">
            <h3 id="why-lag-score" className="text-lg font-medium text-gray-900 dark:text-gray-100 scroll-mt-24">
              Lag Score
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              The score summarizes &quot;distance from baseline&quot; style strain—aligned with allostatic load concepts—so you can
              track movement without turning your week into a performance review.
            </p>
          </div>

          <div className="space-y-2">
            <h3 id="why-small-adjustments" className="text-lg font-medium text-gray-900 dark:text-gray-100 scroll-mt-24">
              Small weekly adjustments
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Small, focused changes support continuous course correction. This helps close the effort–recovery gap
              without requiring a full reset.
            </p>
          </div>

          <div className="space-y-2">
            <h3 id="why-trends" className="text-lg font-medium text-gray-900 dark:text-gray-100 scroll-mt-24">
              Trends over time
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              A calm trend line helps you see direction, not judgment. It supports continuity and early awareness—especially
              when life is busy and day-to-day memory is noisy.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

