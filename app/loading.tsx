export default function PublicLoading() {
  return (
    <div className="min-h-screen bg-[#fdf6f0]">
      {/* Hero skeleton */}
      <div className="bg-[#1a1412] py-24 flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[#2a2422] animate-pulse" />
        <div className="h-10 w-56 bg-[#2a2422] rounded-xl animate-pulse" />
        <div className="h-10 w-40 bg-[#2a2422] rounded-xl animate-pulse" />
        <div className="h-5 w-72 bg-[#2a2422] rounded-lg animate-pulse" />
        <div className="h-12 w-40 bg-[#C4728A]/30 rounded-2xl animate-pulse mt-2" />
      </div>
      {/* Stats skeleton */}
      <div className="bg-white py-5 flex justify-center gap-16">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="h-7 w-14 bg-[#f4f1ef] rounded animate-pulse" />
            <div className="h-3 w-16 bg-[#f4f1ef] rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
