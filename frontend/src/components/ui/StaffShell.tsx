import type { ReactNode } from "react";
import { LiveDateTime } from "./LiveDateTime";
import { LumbreLogo } from "./LumbreLogo";

type StaffShellProps = {
  children: ReactNode;
  /** Contenido centrado en la franja terracota */
  headerCenter?: ReactNode;
  /** Sustituye el reloj de la derecha (p. ej. menú de usuario) */
  headerRight?: ReactNode;
  /** Si false, solo franja + panel (sin logo ni reloj). Por defecto true. */
  showBrandBar?: boolean;
  /** Reloj más grande y apilado (cocina / recepción sin headerRight) */
  emphasizeClock?: boolean;
  /**
   * Vistas móvil/tablet (camarero): altura fija de pantalla y, a partir de `xl`,
   * todo se encierra en una tarjeta tipo tablet como la carta del cliente.
   */
  framed?: boolean;
};

/** Marco común: franja terracota arriba + panel canvas con bordes superiores redondeados. */
export const StaffShell = ({
  children,
  headerCenter,
  headerRight,
  showBrandBar = true,
  emphasizeClock = false,
  framed = false,
}: StaffShellProps) => {
  const content = (
    <>
      {showBrandBar ? (
        <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 pt-5 pb-3 text-white md:px-8 md:pt-6 md:pb-4">
          <div className="flex items-center gap-2.5 justify-self-start">
            <LumbreLogo className="size-8 text-white md:size-9" />
            <span className="text-xl font-black tracking-tight md:text-2xl">
              LUMBRE
            </span>
          </div>

          <div className="justify-self-center">{headerCenter}</div>

          <div className="justify-self-end">
            {headerRight ??
              (emphasizeClock ? (
                <LiveDateTime
                  layout="stacked"
                  showSeconds
                  className="gap-0.5 text-right text-[11px] font-medium text-white/85 md:text-sm [&>span:last-child]:text-2xl [&>span:last-child]:font-bold [&>span:last-child]:tracking-wide [&>span:last-child]:text-white md:[&>span:last-child]:text-3xl"
                />
              ) : (
                <LiveDateTime
                  layout="compact"
                  showSeconds={false}
                  className="text-right text-[11px] font-medium text-white/90 md:text-sm"
                />
              ))}
          </div>
        </header>
      ) : (
        <div className="shrink-0 pt-5 md:pt-6" aria-hidden />
      )}

      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[1.75rem] bg-canvas shadow-[0_-8px_24px_rgba(43,44,52,0.08)]">
        {children}
      </main>
    </>
  );

  if (framed) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-terracotta-300 font-sans text-text-main xl:bg-white xl:p-6">
        <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-terracotta-300 xl:h-[min(90dvh,1024px)] xl:max-w-3xl xl:rounded-2xl xl:shadow-xl">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-terracotta-300 font-sans text-text-main">
      {content}
    </div>
  );
};
