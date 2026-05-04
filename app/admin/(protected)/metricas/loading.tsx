export default function MetricasLoading() {
  return (
    <div className="p-4 md:p-6">
      <div className="h-8 w-28 bg-[#f4f1ef] rounded-lg animate-pulse mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#e8c5ce] p-5 space-y-2">
            <div className="h-3 w-24 bg-[#f4f1ef] rounded animate-pulse" />
            <div className="h-8 w-20 bg-[#f4f1ef] rounded animate-pulse" />
            <div className="h-3 w-16 bg-[#f4f1ef] rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#e8c5ce] p-5">
            <div className="h-5 w-40 bg-[#f4f1ef] rounded animate-pulse mb-4" />
            <div className="h-56 bg-[#f4f1ef] rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
