import { useNavigate } from "react-router";
import { ArrowLeft, MapPinOff } from "lucide-react";

export const NotFoundView = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 py-10 font-sans text-center">
      <MapPinOff
        className="mb-8 size-20 text-terracotta-400 md:size-24"
        strokeWidth={1.5}
      />

      <h1 className="mb-3 text-2xl font-bold tracking-tight text-text-main md:text-3xl">
        Página no encontrada
      </h1>
      <p className="mb-9 max-w-sm text-sm leading-relaxed text-text-muted md:text-base">
        Esta ruta no existe. Si eres cliente, escanea de nuevo el QR de tu mesa.
        Si formas parte del equipo, comprueba la dirección del panel.
      </p>

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-terracotta-400 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-terracotta-500 active:scale-[0.98]"
      >
        <ArrowLeft className="size-4" />
        Volver atrás
      </button>
    </div>
  );
};
