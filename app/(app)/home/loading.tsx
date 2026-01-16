import AppShell from '@/components/AppShell';
import SkeletonCard from '@/components/SkeletonCard';

export default function Loading() {
  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="space-y-3">
          <div className="h-12 bg-white/10 rounded-lg w-48 animate-pulse" />
          <div className="h-6 bg-white/10 rounded-lg w-64 animate-pulse" />
        </div>

        {/* Button skeleton */}
        <div className="h-14 bg-white/10 rounded-lg w-full animate-pulse" />

        {/* Card skeletons */}
        <SkeletonCard height="200px" lines={4} />
        <SkeletonCard height="150px" lines={3} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SkeletonCard height="120px" lines={2} />
          <SkeletonCard height="120px" lines={2} />
        </div>
      </div>
    </AppShell>
  );
}
