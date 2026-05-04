export default function AgendaLoading() {
  return (
    <div className="h-screen flex flex-col pb-16 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-4 bg-white border-b border-[#e8c5ce]">
        <div className="h-7 w-24 bg-[#f4f1ef] rounded-lg animate-pulse" />
        <div className="h-4 w-40 bg-[#f4f1ef] rounded-lg animate-pulse" />
      </div>
      {/* Leyenda */}
      <div className="flex gap-2 px-4 py-3 bg-white border-b border-[#e8c5ce]">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-6 w-16 bg-[#f4f1ef] rounded-full animate-pulse" />
        ))}
      </div>
      {/* Calendario skeleton */}
      <div className="flex-1 p-4">
        <div className="h-full bg-white rounded-2xl border border-[#e8c5ce] p-4 animate-pulse">
          <div className="flex gap-2 mb-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex-1 h-8 bg-[#f4f1ef] rounded-lg" />
            ))}
          </div>
          {[...Array(10)].map((_, row) => (
            <div key={row} className="flex gap-2 mb-2">
              <div className="w-14 h-6 bg-[#f4f1ef] rounded" />
              {[...Array(6)].map((_, col) => (
                <div key={col} className="flex-1 h-6 bg-[#f4f1ef] rounded" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
