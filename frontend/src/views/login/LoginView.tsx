import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Delete } from "lucide-react";
import { authenticatePin } from "../../services/authService";
import { useToast } from "../../components/ui/useToast";

const PIN_LENGTH = 4;
const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

export const LoginView = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [pin, setPin] = useState("");
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const releaseKey = () => setPressedKey(null);

  const submitPin = async (fullPin: string) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    try {
      const result = await authenticatePin(fullPin);
      navigate(result.redirectPath, { replace: true });
    } catch {
      setShake(true);
      showToast({
        message: "PIN incorrecto. Inténtalo de nuevo.",
        tone: "terracotta",
        position: "top-center",
      });
      window.setTimeout(() => {
        setPin("");
        setShake(false);
      }, 420);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const appendDigit = (digit: string) => {
    if (submittingRef.current || pin.length >= PIN_LENGTH) return;

    const next = `${pin}${digit}`;
    setPin(next);

    if (next.length === PIN_LENGTH) {
      void submitPin(next);
    }
  };

  const deleteDigit = () => {
    if (submittingRef.current || pin.length === 0) return;
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="relative flex min-h-dvh flex-col bg-canvas font-sans text-text-main">
      {/* Marca */}
      <header className="absolute top-0 left-0 z-10 flex items-center gap-2.5 p-5 md:p-7">
        <img
          src="/favicon.svg"
          alt=""
          className="size-8 md:size-9"
          aria-hidden
        />
        <span className="text-xl font-black tracking-tight text-terracotta-300 md:text-2xl">
          LUMBRE
        </span>
      </header>

      {/* Contenido central */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20">
        <h1 className="mb-12 text-center text-lg font-semibold text-text-main md:mb-10 md:text-xl">
          Introduce tu PIN
        </h1>

        {/* Casillas del PIN */}
        <div
          className={`mb-10 flex items-center gap-3 md:mb-12 md:gap-4 ${
            shake ? "animate-pin-shake" : ""
          }`}
          role="status"
          aria-live="polite"
          aria-label={`${pin.length} de ${PIN_LENGTH} dígitos`}
        >
          {Array.from({ length: PIN_LENGTH }, (_, index) => {
            const filled = index < pin.length;
            return (
              <div
                key={index}
                className="flex size-12 items-center justify-center rounded-lg bg-white md:size-14"
              >
                {filled ? (
                  <span className="size-3 rounded-full bg-terracotta-300 md:size-3.5" />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Teclado numérico */}
        <div className="grid grid-cols-3 gap-x-5 gap-y-4 md:gap-x-6 md:gap-y-5">
          {DIGITS.map((digit) => {
            const isPressed = pressedKey === digit;
            return (
              <button
                key={digit}
                type="button"
                disabled={submitting}
                aria-label={`Dígito ${digit}`}
                onPointerDown={() => setPressedKey(digit)}
                onPointerUp={releaseKey}
                onPointerLeave={releaseKey}
                onPointerCancel={releaseKey}
                onClick={() => appendDigit(digit)}
                className={`flex size-16 cursor-pointer items-center justify-center rounded-full text-2xl font-bold shadow-sm transition-all duration-150 ease-out md:size-18 md:text-[1.65rem] ${
                  isPressed
                    ? "scale-90 bg-terracotta-300 text-white shadow-none"
                    : "scale-100 bg-canvas-white text-text-main"
                } disabled:pointer-events-none`}
              >
                {digit}
              </button>
            );
          })}

          {/* Fila inferior: hueco | 0 | borrar */}
          <span className="size-16 md:size-18" aria-hidden />

          {/* Botón de 0 */}
          <button
            type="button"
            disabled={submitting}
            aria-label="Dígito 0"
            onPointerDown={() => setPressedKey("0")}
            onPointerUp={releaseKey}
            onPointerLeave={releaseKey}
            onPointerCancel={releaseKey}
            onClick={() => appendDigit("0")}
            className={`flex size-16 cursor-pointer items-center justify-center rounded-full text-2xl font-bold shadow-sm transition-all duration-150 ease-out md:size-18 md:text-[1.65rem] ${
              pressedKey === "0"
                ? "scale-90 bg-terracotta-300 text-white shadow-none"
                : "scale-100 bg-canvas-white text-text-main"
            } disabled:pointer-events-none`}
          >
            0
          </button>

          {/* Botón de borrar */}
          <button
            type="button"
            disabled={submitting || pin.length === 0}
            aria-label="Borrar"
            onPointerDown={() => setPressedKey("delete")}
            onPointerUp={releaseKey}
            onPointerLeave={releaseKey}
            onPointerCancel={releaseKey}
            onClick={deleteDigit}
            className="flex size-16 cursor-pointer items-center justify-center bg-transparent p-0 disabled:pointer-events-none 0 md:size-18"
          >
            <Delete
              className={`size-7 transition-all duration-150 ease-out md:size-8 text-terracotta-300  ${
                pressedKey === "delete" ? "scale-85" : "scale-100"
              }`}
              strokeWidth={2.25}
            />
          </button>
        </div>
      </main>

      {/* Pie de página */}
      <footer className="pb-6 text-center text-xs font-semibold text-text-muted md:pb-8 md:text-sm">
        © 2026 Lumbre. Todos los derechos reservados.
      </footer>
    </div>
  );
};
