"use client";

import { useState } from "react";
import { ProfesionalesCRUD } from "./ProfesionalesCRUD";
import { GestionAccesos } from "./GestionAccesos";
import type { Profesional, Servicio } from "@/types";
import { Users, ShieldCheck } from "lucide-react";

interface Props {
  profesionales: Profesional[];
  servicios: Servicio[];
}

type Tab = "profesionales" | "accesos";

export function ProfesionalesPageClient({ profesionales, servicios }: Props) {
  const [tab, setTab] = useState<Tab>("profesionales");

  return (
    <div>
      <div className="flex gap-1 mb-6 bg-[#f4f1ef] p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab("profesionales")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "profesionales"
              ? "bg-white text-[#1a1412] shadow-sm"
              : "text-[#6b6360] hover:text-[#1a1412]"
          }`}
        >
          <Users size={15} />
          Profesionales
        </button>
        <button
          onClick={() => setTab("accesos")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "accesos"
              ? "bg-white text-[#1a1412] shadow-sm"
              : "text-[#6b6360] hover:text-[#1a1412]"
          }`}
        >
          <ShieldCheck size={15} />
          Roles y accesos
        </button>
      </div>

      {tab === "profesionales" ? (
        <ProfesionalesCRUD profesionalesIniciales={profesionales} servicios={servicios} />
      ) : (
        <GestionAccesos profesionales={profesionales} />
      )}
    </div>
  );
}
