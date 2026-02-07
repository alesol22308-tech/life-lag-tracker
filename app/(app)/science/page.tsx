'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import ExpandableSection from '@/components/ExpandableSection';
import LagScoreCalculationVisual from '@/components/LagScoreCalculationVisual';
import GlassCard from '@/components/GlassCard';
import AppShell from '@/components/AppShell';

function SectionHeading({ id, title }: { id: string; title: string }) {
  return (
    <h2 id={id} className="text-2xl font-semibold text-text0 scroll-mt-24">
      {title}
    </h2>
  );
}

export default function SciencePage() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-10">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
        >
          <GlassCard className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-semibold text-text0">The Science Behind Life-Lag</h1>
            <p className="text-lg text-text1 leading-relaxed">
            Life-Lag is a weekly tune-up built on well-established stress science: strain tends to build gradually, and
            small shifts in sleep, energy, and follow-through can show up before things feel &quot;obvious.&quot;
          </p>
            <nav aria-label="On this page" className="pt-4 border-t border-cardBorder">
              <p className="text-xs font-medium text-text2 uppercase tracking-wide mb-3">On this page</p>
              <ul className="space-y-2 text-sm text-text1">
                <li><Link href="#problem" className="hover:text-text0 underline-offset-2 hover:underline">Problem</Link></li>
                <li><Link href="#insight" className="hover:text-text0 underline-offset-2 hover:underline">Insight</Link></li>
                <li><Link href="#solution" className="hover:text-text0 underline-offset-2 hover:underline">Solution</Link></li>
                <li><Link href="#validation" className="hover:text-text0 underline-offset-2 hover:underline">Validation</Link></li>
                <li><Link href="#map" className="hover:text-text0 underline-offset-2 hover:underline">How the science maps to the product</Link></li>
                <li className="pl-4">
                  <Link href="#why-weekly-checkin" className="hover:text-text0 underline-offset-2 hover:underline">Weekly check-in</Link>
                  {' · '}
                  <Link href="#why-lag-score" className="hover:text-text0 underline-offset-2 hover:underline">Lag Score</Link>
                  {' · '}
                  <Link href="#why-small-adjustments" className="hover:text-text0 underline-offset-2 hover:underline">Small adjustments</Link>
                  {' · '}
                  <Link href="#why-trends" className="hover:text-text0 underline-offset-2 hover:underline">Trends</Link>
                </li>
              </ul>
            </nav>
          <p className="text-sm text-text2">
            This isn&apos;t medical advice, diagnosis, or treatment—just a practical way to notice drift early and adjust
            gently.
          </p>
          </GlassCard>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.1 }}
        >
          <GlassCard className="space-y-4">
            <SectionHeading id="problem" title="Problem: issues are often noticed too late" />
            <p className="text-text1 leading-relaxed">
            People can stay functional under load for a while—then suddenly feel behind, depleted, or brittle. By the
            time it&apos;s obvious, it can take longer to recover.
          </p>
          <ExpandableSection
            summary="Learn more (research papers)"
            className="pt-2"
          >
            <div className="space-y-3 text-sm text-text2 leading-relaxed">
              <p>
                Work from institutions like the <span className="font-medium">National Academy of Medicine</span> highlights
                the value of earlier signals and shorter check-in intervals for prevention and support.
              </p>
              <div className="space-y-2">
                {/* Research paper links - TODO: Add actual paper URLs */}
                <a
                  href="https://pubmed.ncbi.nlm.nih.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-text2 hover:text-text1 underline transition-colors"
                >
                  NIH / PubMed - search for earlier detection and prevention research
                </a>
              </div>
            </div>
          </ExpandableSection>
          </GlassCard>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.2 }}
        >
          <GlassCard className="space-y-4">
            <SectionHeading id="insight" title="Insight: early drift is measurable" />
            <p className="text-text1 leading-relaxed">
            Stress isn&apos;t only about big events—it&apos;s also the hidden cost of sustained effort. Researchers describe this
            as <span className="font-medium">allostatic load</span>: the wear-and-tear that accumulates when demands stay
            higher than recovery.
          </p>
          <p className="text-text1 leading-relaxed">
            Another lens is the <span className="font-medium">effort–recovery gap</span>: you can keep performing by
            pushing harder, even as reserves shrink.
          </p>
          <ExpandableSection
            summary="Learn more (research papers)"
            className="pt-2"
          >
            <div className="space-y-3 text-sm text-text2 leading-relaxed">
              <p>
                Summaries and reviews across <span className="font-medium">NIH / PubMed</span> and university research
                groups support the idea that subjective, repeated check-ins can reflect underlying strain over time.
              </p>
              <div className="space-y-2">
                {/* Research paper links - TODO: Add actual paper URLs */}
                <a
                  href="https://pubmed.ncbi.nlm.nih.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-text2 hover:text-text1 underline transition-colors"
                >
                  NIH / PubMed - search for allostatic load research
                </a>
                <a
                  href="https://pubmed.ncbi.nlm.nih.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-text2 hover:text-text1 underline transition-colors"
                >
                  NIH / PubMed - search for effort-recovery gap research
                </a>
              </div>
            </div>
          </ExpandableSection>
          </GlassCard>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.3 }}
        >
          <GlassCard className="space-y-4">
            <SectionHeading id="solution" title="Solution: weekly, baseline-based tracking" />
            <p className="text-text1 leading-relaxed">
            Life-Lag is designed for maintenance. A short weekly check-in captures early signals, compares to your recent
            baseline, and suggests one small adjustment—so course correction stays gentle and doable.
          </p>
          </GlassCard>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.4 }}
        >
          <GlassCard className="space-y-4">
            <SectionHeading id="validation" title="Validation: research-backed, institution-supported" />
            <p className="text-text1 leading-relaxed">
            The ideas behind Life-Lag show up across many populations—students, professionals, and high-load roles—because
            it measures capacity strain rather than specific stressors.
          </p>
          <ExpandableSection
            summary="Research papers and resources"
            className="pt-2"
          >
            <div className="space-y-3 text-sm text-text2 leading-relaxed">
              <ul className="list-disc pl-5 space-y-2">
                <li>NIH / PubMed summaries of allostatic load and intervention research</li>
                <li>National Academy of Medicine guidance on earlier detection and prevention</li>
                <li>University research on recovery, sleep consistency, and workload strain</li>
              </ul>
              <div className="space-y-2 pt-2">
                {/* Research paper links - TODO: Add actual paper URLs */}
                <a
                  href="https://pubmed.ncbi.nlm.nih.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-text2 hover:text-text1 underline transition-colors"
                >
                  NIH / PubMed - allostatic load and intervention research
                </a>
                <a
                  href="https://pubmed.ncbi.nlm.nih.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-text2 hover:text-text1 underline transition-colors"
                >
                  NIH / PubMed - recovery and sleep consistency research
                </a>
                <a
                  href="https://pubmed.ncbi.nlm.nih.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-text2 hover:text-text1 underline transition-colors"
                >
                  NIH / PubMed - workload strain research
                </a>
              </div>
            </div>
          </ExpandableSection>
          </GlassCard>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.5 }}
        >
          <GlassCard className="space-y-6">
            <SectionHeading id="map" title="How the science maps to the product" />

            <ol className="space-y-6 list-decimal list-inside text-text1">
            <li className="space-y-2">
              <h3 id="why-weekly-checkin" className="text-lg font-semibold text-text0 scroll-mt-24 inline">
                Weekly check-in
              </h3>
              <p className="text-text1 leading-relaxed">
              Short-interval check-ins help catch small shifts before they compound. A weekly cadence is long enough to
              be low-friction, but frequent enough to notice drift early.
              </p>
            </li>
          <li className="space-y-4">
            <div className="space-y-2">
              <h3 id="why-lag-score" className="text-lg font-semibold text-text0 scroll-mt-24">
                Lag Score
              </h3>
              <p className="text-text1 leading-relaxed">
                The score summarizes &quot;distance from baseline&quot; style strain—aligned with allostatic load concepts—so you can
                track movement without turning your week into a performance review.
              </p>
            </div>
            <div className="pt-4 border-t border-cardBorder">
              <LagScoreCalculationVisual />
            </div>
          </li>
          <li className="space-y-2">
            <h3 id="why-small-adjustments" className="text-lg font-semibold text-text0 scroll-mt-24">
              Small weekly adjustments
            </h3>
            <p className="text-text1 leading-relaxed">
              Small, focused changes support continuous course correction. This helps close the effort–recovery gap
              without requiring a full reset.
            </p>
          </li>
          <li className="space-y-2">
            <h3 id="why-trends" className="text-lg font-semibold text-text0 scroll-mt-24">
              Trends over time
            </h3>
            <p className="text-text1 leading-relaxed">
              A calm trend line helps you see direction, not judgment. It supports continuity and early awareness—especially
              when life is busy and day-to-day memory is noisy.
            </p>
          </li>
            </ol>
          </GlassCard>
        </motion.section>
      </div>
    </AppShell>
  );
}
