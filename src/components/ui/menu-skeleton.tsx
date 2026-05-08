'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function MenuSkeleton() {
  return (
    <div className="min-h-screen bg-background font-body pb-24">
      {/* Header Skeleton */}
      <header className="flex justify-between items-center px-6 py-4 sticky top-0 bg-surface shadow-card z-40">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-full" />
      </header>

      {/* Hero Skeleton */}
      <section className="px-6 pt-6 pb-4">
        <Skeleton className="h-10 w-48 mb-2 rounded-lg" />
        <Skeleton className="h-6 w-72 rounded-lg" />
      </section>

      {/* Category Tabs Skeleton */}
      <nav className="sticky top-[72px] z-30 bg-surface/90 backdrop-blur-md overflow-x-auto hide-scrollbar flex items-center gap-4 px-6 py-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-full shrink-0" />
        ))}
      </nav>

      {/* Menu Grid Skeleton */}
      <main className="px-6 mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <MenuCardSkeleton key={i} />
        ))}
      </main>
    </div>
  );
}

export function MenuCardSkeleton() {
  return (
    <article className="bg-white rounded-3xl overflow-hidden shadow-card border border-surface-container">
      {/* Image Skeleton */}
      <Skeleton className="h-48 w-full rounded-none" />
      
      {/* Content Skeleton */}
      <div className="p-6 flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-32 rounded-lg" />
          <Skeleton className="h-6 w-16 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-3/4 rounded-lg" />
        
        <div className="flex justify-between items-center mt-2">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </article>
  );
}

export function CategoryTabsSkeleton() {
  return (
    <nav className="sticky top-[72px] z-30 bg-surface/90 backdrop-blur-md overflow-x-auto hide-scrollbar flex items-center gap-4 px-6 py-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-10 w-24 rounded-full shrink-0" />
      ))}
    </nav>
  );
}

export function HeroSkeleton() {
  return (
    <section className="px-6 pt-6 pb-4">
      <Skeleton className="h-10 w-48 mb-2 rounded-lg" />
      <Skeleton className="h-6 w-72 rounded-lg" />
    </section>
  );
}

export function HeaderSkeleton() {
  return (
    <header className="flex justify-between items-center px-6 py-4 sticky top-0 bg-surface shadow-card z-40">
      <Skeleton className="h-8 w-32 rounded-lg" />
      <Skeleton className="h-10 w-24 rounded-full" />
    </header>
  );
}
