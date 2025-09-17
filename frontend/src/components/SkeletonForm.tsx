export default function SkeletonForm() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-md border border-black/10 dark:border-white/10 p-4">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="mt-3">
            <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
