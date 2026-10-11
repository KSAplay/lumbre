import { Link } from "react-router";
import { UtensilsCrossed, ArrowLeft } from "lucide-react";

// Diseño temporal para la vista de 404
// TODO: Crear una vista de 404 personalizada
export const NotFoundView = () => {
  return (
    <div className="min-h-screen bg-canvas-white flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-6 shadow-sm">
        <UtensilsCrossed className="w-8 h-8" />
      </div>

      <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-2">
        404
      </h1>
      <h2 className="text-xl font-bold text-slate-700 mb-3">
        Página o mesa no encontrada
      </h2>
      <p className="text-slate-500 max-w-sm mb-8 text-sm leading-relaxed">
        El enlace al que intentas acceder no existe o el código QR de la mesa no
        es válido.
      </p>

      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-md"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al inicio
      </Link>
    </div>
  );
};
