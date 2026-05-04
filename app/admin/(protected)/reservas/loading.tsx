export default function ReservasLoading() {
  return (
    <div className="p-4 md:p-6">
      <div className="h-8 w-32 bg-[#f4f1ef] rounded-lg animate-pulse mb-6" />
      <div className="flex gap-3 mb-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-9 w-40 bg-[#f4f1ef] rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-[#e8c5ce] overflow-hidden">
        <div className="bg-[#f7e8ed] px-4 py-3 flex gap-4">
          {["Cliente", "Servicio", "Profesional", "Fecha", "Estado", "Acciones"].map((h) => (
            <div key={h} className="h-4 w-20 bg-[#e8c5ce] rounded animate-pulse" />
          ))}
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-4 border-t border-[#f4f1ef]">
            <div className="flex-1 space-y-1">
              <div className="h-4 w-32 bg-[#f4f1ef] rounded animate-pulse" />
              <div className="h-3 w-20 bg-[#f4f1ef] rounded animate-pulse" />
            </div>
            <div className="h-4 w-28 bg-[#f4f1ef] rounded animate-pulse" />
            <div className="h-4 w-16 bg-[#f4f1ef] rounded animate-pulse" />
            <div className="h-4 w-20 bg-[#f4f1ef] rounded animate-pulse" />
            <div className="h-6 w-20 bg-[#f4f1ef] rounded-full animate-pulse" />
            <div className="h-6 w-24 bg-[#f4f1ef] rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
