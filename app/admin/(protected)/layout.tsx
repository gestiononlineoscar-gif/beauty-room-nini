import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/admin/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import type { Usuario } from "@/types";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", user.id)
    .single<Usuario>();

  if (!usuario) redirect("/admin/login");

  return (
    <div className="flex h-screen overflow-hidden bg-[#fdf6f0]">
      <Sidebar usuario={usuario} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
