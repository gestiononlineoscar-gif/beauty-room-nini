export default function ProfesionalesLoading() {
  return (
    <div className="p-4 md:p-6">
      <div className="h-8 w-36 bg-[#f4f1ef] rounded-lg animate-pulse mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#e8c5ce] p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f4f1ef] animate-pulse" />
              <div className="space-y-1 flex-1">
                <div className="h-4 w-24 bg-[#f4f1ef] rounded animate-pulse" />
                <div className="h-3 w-32 bg-[#f4f1ef] rounded animate-pulse" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 h-8 bg-[#f4f1ef] rounded-xl animate-pulse" />
              <div className="w-20 h-8 bg-[#f4f1ef] rounded-xl animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
