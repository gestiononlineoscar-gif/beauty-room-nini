export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#C4728A] border-t-transparent animate-spin" />
        <p className="text-sm text-[#6b6360]">Cargando...</p>
      </div>
    </div>
  );
}
