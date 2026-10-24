import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Delete } from "lucide-react";
import { authenticatePin } from "../../services/authService";
import { useToast } from "../../components/ui/useToast";
import { LiveDateTime } from "../../components/ui/LiveDateTime";
import { LumbreLogo } from "../../components/ui/LumbreLogo";

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

  const digitButtonClass = (key: string) => {
    const isPressed = pressedKey === key;
    return `flex size-16 cursor-pointer items-center justify-center rounded-full text-2xl font-bold shadow-sm transition-all duration-150 ease-out md:size-18 md:text-[1.65rem] ${
      isPressed
        ? "scale-90 bg-terracotta-300 text-white shadow-none"
        : "scale-100 bg-canvas text-text-main"
    } disabled:pointer-events-none`;
  };

  return (
    <div className="flex min-h-dvh flex-col bg-terracotta-300 font-sans text-text-main md:landscape:flex-row lg:flex-row">
      {/* Bloque marca (terracota) */}
      <aside className="relative flex shrink-0 flex-col px-5 pt-5 pb-3 text-white md:landscape:h-dvh md:landscape:w-[40%] md:landscape:justify-between md:landscape:px-8 md:landscape:py-10 lg:h-dvh lg:w-[40%] lg:justify-between lg:px-10 lg:py-12">
        {/* Marca + bienvenida (en móvil solo logo y nombre) */}
        <div className="flex flex-col items-center md:landscape:flex-1 md:landscape:justify-center lg:flex-1 lg:justify-center">
          <div className="flex items-center gap-2.5 md:landscape:flex-col md:landscape:gap-4 lg:flex-col lg:gap-5">
            <LumbreLogo className="size-9 text-white md:landscape:size-16 lg:size-20" />
            <span className="text-2xl font-black tracking-tight md:landscape:text-4xl lg:text-5xl">
              LUMBRE
            </span>
          </div>

          <p className="mt-3 hidden max-w-xs text-center text-sm leading-relaxed text-white/90 md:landscape:mt-8 md:landscape:block md:landscape:text-base lg:mt-10 lg:block lg:text-lg">
            Bienvenido al equipo. Introduce tu PIN para acceder a tu panel.
          </p>
        </div>

        {/* Desktop / tablet landscape: reloj + copyright */}
        <div className="hidden md:landscape:block lg:block">
          <LiveDateTime
            layout="stacked"
            className="mb-6 gap-1 text-sm text-white/90 lg:text-base [&>span:last-child]:text-2xl [&>span:last-child]:font-semibold [&>span:last-child]:tracking-wide lg:[&>span:last-child]:text-3xl"
          />
          <p className="text-xs text-white/70 lg:text-sm">
            © 2026 Lumbre. Todos los derechos reservados.
          </p>
        </div>
      </aside>

      {/* Bloque PIN: redondeado arriba (móvil) / izquierda (desktop · tablet landscape) */}
      <section className="flex flex-1 flex-col rounded-t-[1.75rem] bg-canvas-white shadow-[0_-8px_24px_rgba(43,44,52,0.08)] md:landscape:rounded-t-none md:landscape:rounded-l-[1.75rem] md:landscape:shadow-[-8px_0_24px_rgba(43,44,52,0.08)] lg:rounded-t-none lg:rounded-l-[1.75rem] lg:shadow-[-8px_0_24px_rgba(43,44,52,0.08)]">
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 md:py-12">
          <h1 className="mb-8 text-center text-lg font-semibold text-text-main md:mb-10 md:text-xl">
            Introduce tu PIN
          </h1>

          {/* Display de los dígitos introducidos */}
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
                  className="flex size-12 items-center justify-center rounded-full bg-canvas shadow-[inset_0_2px_5px_rgba(43,44,52,0.08),0_2px_6px_rgba(43,44,52,0.06)] md:size-14"
                >
                  {filled ? (
                    <span className="size-3 rounded-full bg-terracotta-300 md:size-3.5" />
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Teclado de dígitos */}
          <div className="grid grid-cols-3 gap-x-5 gap-y-4 md:gap-x-6 md:gap-y-5">
            {DIGITS.map((digit) => (
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
                className={digitButtonClass(digit)}
              >
                {digit}
              </button>
            ))}

            {/* Espacio vacío para el dígito 0 */}
            <span className="size-16 md:size-18" aria-hidden />

            {/* Botón de dígito 0 */}
            <button
              type="button"
              disabled={submitting}
              aria-label="Dígito 0"
              onPointerDown={() => setPressedKey("0")}
              onPointerUp={releaseKey}
              onPointerLeave={releaseKey}
              onPointerCancel={releaseKey}
              onClick={() => appendDigit("0")}
              className={digitButtonClass("0")}
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
              className="flex size-16 cursor-pointer items-center justify-center bg-transparent p-0 disabled:pointer-events-none text-terracotta-300 disabled:opacity-40 disabled:text-text-muted md:size-18"
            >
              <Delete
                className={`size-7 transition-all duration-150 ease-out md:size-8 ${
                  pressedKey === "delete" ? "scale-75" : "scale-100"
                }`}
                strokeWidth={2.25}
              />
            </button>
          </div>
        </div>

        {/* Copyright solo en móvil */}
        <p className="pb-5 text-center text-[11px] font-medium text-text-muted md:landscape:hidden lg:hidden">
          © 2026 Lumbre. Todos los derechos reservados.
        </p>
      </section>
    </div>
  );
};
