'use client';

// Shimmer loading component for ZCOFFEE-style menu
function ShimmerLine({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-md animate-pulse ${className}`}
      style={{
        backgroundSize: '200% 100%',
        animation: 'shimmer 2.5s infinite linear'
      }}
    />
  );
}

export function MenuSkeleton() {
  return (
    <div className="min-h-screen bg-[#faf9f6] pb-20">
      {/* Header Skeleton */}
      <nav className="sticky top-0 z-50 px-6 py-4 flex justify-center items-center bg-[#faf9f6]/90 backdrop-blur-xl border-b border-[#b48c68]/10">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 bg-[#2d2a26] rounded-xl mb-1" />
          <ShimmerLine className="h-5 w-24 mb-1" />
          <ShimmerLine className="h-2 w-20" />
        </div>
        <div className="absolute right-6">
          <ShimmerLine className="h-7 w-14 rounded-full" />
        </div>
      </nav>

      {/* Menu Cards Skeleton */}
      <main className="max-w-xl mx-auto px-5 py-6 space-y-6">
        {[1, 2, 3].map((i) => (
          <MenuCardSkeleton key={i} />
        ))}
      </main>
    </div>
  );
}

export function MenuCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/[0.03]">
      {/* Category Header */}
      <div className="flex items-center gap-4 mb-5">
        <ShimmerLine className="h-5 w-24" />
        <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
      </div>
      
      {/* Items */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between items-center py-2">
            <ShimmerLine className="h-4 w-40" />
            <ShimmerLine className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CategoryTabsSkeleton() {
  return (
    <nav className="sticky top-[72px] z-30 bg-[#faf9f6]/90 backdrop-blur-md overflow-x-auto flex items-center gap-4 px-6 py-4">
      {[1, 2, 3, 4].map((i) => (
        <ShimmerLine key={i} className="h-8 w-20 rounded-full shrink-0" />
      ))}
    </nav>
  );
}

export function HeroSkeleton() {
  return (
    <section className="px-6 pt-6 pb-4 text-center">
      <ShimmerLine className="h-8 w-32 mx-auto mb-2" />
      <ShimmerLine className="h-4 w-48 mx-auto" />
    </section>
  );
}

export function HeaderSkeleton() {
  return (
    <nav className="sticky top-0 z-50 px-6 py-4 flex justify-center items-center bg-[#faf9f6]/90 backdrop-blur-xl">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 bg-[#2d2a26] rounded-xl mb-1" />
        <ShimmerLine className="h-5 w-24 mb-1" />
        <ShimmerLine className="h-2 w-16" />
      </div>
    </nav>
  );
}
