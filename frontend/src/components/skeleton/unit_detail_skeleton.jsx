import React from 'react';

const UnitDetailSkeleton = () => {
  return (
    <div className="animate-pulse bg-white rounded-lg shadow-lg p-6 h-full flex flex-col">
      {/* Image Skeleton */}
      <div className="w-full h-64 bg-gray-300 rounded-lg mb-6"></div>

      {/* Header Skeleton */}
      <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
      <div className="h-6 bg-gray-300 rounded w-1/2 mb-6"></div>

      {/* Tabs Skeleton */}
      <div className="flex border-b-2 mb-6">
        <div className="h-10 bg-gray-300 rounded-t-lg w-24 mr-4"></div>
        <div className="h-10 bg-gray-300 rounded-t-lg w-24"></div>
      </div>

      {/* Details Skeleton */}
      <div className="space-y-4">
        <div className="h-4 bg-gray-300 rounded w-full"></div>
        <div className="h-4 bg-gray-300 rounded w-5/6"></div>
        <div className="h-4 bg-gray-300 rounded w-full"></div>
        <div className="h-4 bg-gray-300 rounded w-4/5"></div>
      </div>

      {/* Action Button Skeleton */}
      <div className="mt-auto pt-6">
        <div className="h-12 bg-gray-300 rounded w-full"></div>
      </div>
    </div>
  );
};

export default UnitDetailSkeleton;
