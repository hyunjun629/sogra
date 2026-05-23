import React from 'react';

export function Skeleton({ className = '' }) {
  return (
    <div className={`skeleton animate-pulse rounded-lg ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="card">
      <Skeleton className="h-40 w-full mb-4 rounded-xl" />
      <div className="flex justify-between items-start mb-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-6 w-1/3 mb-1" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 w-16 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="card text-center">
      <Skeleton className="h-8 w-8 mx-auto mb-2 rounded-full" />
      <Skeleton className="h-9 w-1/2 mx-auto mb-2" />
      <Skeleton className="h-4 w-2/3 mx-auto" />
    </div>
  );
}

export function SkeletonProductVerify() {
  return (
    <div className="max-w-lg w-full mx-auto px-4">
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-56 w-full rounded-xl mb-4" />
        <Skeleton className="h-7 w-3/4 mb-2" />
        <Skeleton className="h-7 w-1/3 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-1" />
        <Skeleton className="h-4 w-2/5 mb-4" />
        <Skeleton className="h-20 w-full rounded-lg mb-4" />
        <div className="flex justify-center mt-4">
          <Skeleton className="h-32 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
