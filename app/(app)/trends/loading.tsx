import AppShell from '@/components/AppShell';
import SkeletonChart from '@/components/SkeletonChart';

export default function Loading() {
  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="space-y-3">
          <div className="h-12 bg-white/10 rounded-lg w-40 animate-pulse" />
          <div className="h-6 bg-white/10 rounded-lg w-56 animate-pulse" />
        </div>

        {/* Chart skeleton */}
        <SkeletonChart height="400px" />
        <SkeletonChart height="300px" />
      </div>
    </AppShell>
  );
}
